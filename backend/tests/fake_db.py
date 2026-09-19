"""
A small in-memory Postgres/PostgREST stand-in for integration tests.

Unlike conftest.FakeSupabase (which returns canned results and accepts any
column), this one keeps real state and enforces the ACTUAL schema, parsed from
supabase/bond_schema.sql: unknown columns are rejected, NOT NULL columns without
a default are required, and UNIQUE constraints raise Postgres error 23505. That
makes schema drift between the code and the database a test failure instead of a
production surprise.
"""

import itertools
import os
import re
from types import SimpleNamespace

SCHEMA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "supabase", "bond_schema.sql"
)


class PostgrestError(Exception):
    def __init__(self, message, code):
        super().__init__(message)
        self.code = code


def parse_schema(path=SCHEMA_PATH):
    """{table: {"columns", "required", "unique"}} parsed from the CREATE TABLE blocks."""
    sql = open(path).read()
    tables = {}
    for m in re.finditer(r"CREATE TABLE IF NOT EXISTS (\w+) \((.*?)\n\);", sql, re.S):
        name, body = m.group(1), m.group(2)
        cols, required, unique = set(), set(), []
        for line in body.split("\n"):
            line = re.sub(r"--.*", "", line).strip().rstrip(",")
            if not line:
                continue
            table_unique = re.match(r"UNIQUE\s*\(([^)]*)\)", line, re.I)
            if table_unique:
                unique.append(tuple(c.strip() for c in table_unique.group(1).split(",")))
                continue
            if re.match(r"(PRIMARY|FOREIGN|CONSTRAINT|CHECK)\b", line, re.I):
                continue
            col = re.match(r"(\w+)\s+([A-Za-z]+)", line)
            if not col:
                continue
            cname = col.group(1)
            cols.add(cname)
            upper = line.upper()
            if "PRIMARY KEY" in upper:
                unique.append((cname,))
            elif "UNIQUE" in upper:
                unique.append((cname,))
            if "NOT NULL" in upper and "DEFAULT" not in upper and "PRIMARY KEY" not in upper:
                required.add(cname)
        tables[name] = {"columns": cols, "required": required, "unique": unique}
    for m in re.finditer(r"ALTER TABLE (\w+) ADD COLUMN IF NOT EXISTS (\w+) ", sql):
        if m.group(1) in tables:
            tables[m.group(1)]["columns"].add(m.group(2))
    return tables


class Result(SimpleNamespace):
    def __init__(self, data=None, count=None):
        super().__init__(data=data if data is not None else [], count=count)


class Query:
    def __init__(self, db, table):
        self.db, self.table = db, table
        self.op, self.payload, self.filters, self._count = "select", None, [], None
        self._limit = None

    # -- builders ----------------------------------------------------------
    def select(self, *cols, count=None, **kw):
        if self.op == "select":
            self._count = count
        return self

    def insert(self, payload):
        self.op, self.payload = "insert", payload
        return self

    def update(self, payload):
        self.op, self.payload = "update", payload
        return self

    def delete(self):
        self.op = "delete"
        return self

    def eq(self, field, value):
        self.filters.append(("eq", field, value))
        return self

    def gte(self, field, value):
        self.filters.append(("gte", field, value))
        return self

    def in_(self, field, values):
        self.filters.append(("in", field, list(values)))
        return self

    def or_(self, expression):
        self.filters.append(("or", expression))
        return self

    def order(self, *a, **k):
        return self

    def limit(self, n):
        self._limit = n
        return self

    def single(self):
        return self

    # -- execution ---------------------------------------------------------
    def _matches(self, row):
        for f in self.filters:
            if f[0] == "eq" and row.get(f[1]) != f[2]:
                return False
            if f[0] == "gte" and not (row.get(f[1]) is not None and str(row[f[1]]) >= str(f[2])):
                return False
            if f[0] == "in" and row.get(f[1]) not in f[2]:
                return False
            if f[0] == "or":
                ok = False
                for part in f[1].split(","):
                    field, _, value = part.partition(".eq.")
                    ok = ok or str(row.get(field)) == value
                if not ok:
                    return False
        return True

    def execute(self):
        return self.db._run(self)


class InMemoryDB:
    def __init__(self, schema=None):
        self.schema = schema or parse_schema()
        self.tables = {name: [] for name in self.schema}
        self._ids = itertools.count(1)
        self.log = []  # (op, table, payload)

    def table(self, name):
        if name not in self.schema:
            raise PostgrestError(f'relation "public.{name}" does not exist', "42P01")
        return Query(self, name)

    def seed(self, table, **row):
        """Insert a row without going through the code under test."""
        self.tables[table].append({"id": next(self._ids), **row})

    def rows(self, table, **where):
        return [r for r in self.tables[table] if all(r.get(k) == v for k, v in where.items())]

    def _check_columns(self, table, row):
        unknown = set(row) - self.schema[table]["columns"]
        if unknown:
            raise PostgrestError(
                f"Could not find the {sorted(unknown)} column(s) of '{table}' in the schema cache",
                "PGRST204",
            )

    def _run(self, q):
        spec = self.schema[q.table]
        self.log.append((q.op, q.table, q.payload))
        rows = self.tables[q.table]

        if q.op == "insert":
            payloads = q.payload if isinstance(q.payload, list) else [q.payload]
            inserted = []
            for payload in payloads:
                self._check_columns(q.table, payload)
                missing = {c for c in spec["required"] if payload.get(c) is None} - {"id"}
                if missing:
                    raise PostgrestError(
                        f'null value in column "{sorted(missing)[0]}" of relation "{q.table}" '
                        "violates not-null constraint",
                        "23502",
                    )
                for cols in spec["unique"]:
                    key = tuple(payload.get(c) for c in cols)
                    if None not in key and any(tuple(r.get(c) for c in cols) == key for r in rows):
                        raise PostgrestError(
                            f'duplicate key value violates unique constraint on "{q.table}" {cols}',
                            "23505",
                        )
                row = {"id": next(self._ids), **payload}
                rows.append(row)
                inserted.append(dict(row))
            return Result(data=inserted)

        for f in q.filters:
            fields = [p.partition(".eq.")[0] for p in f[1].split(",")] if f[0] == "or" else [f[1]]
            for field in fields:
                if field not in spec["columns"]:
                    raise PostgrestError(f"column {q.table}.{field} does not exist", "42703")

        matched = [r for r in rows if q._matches(r)]

        if q.op == "update":
            self._check_columns(q.table, q.payload)
            for r in matched:
                r.update(q.payload)
            return Result(data=[dict(r) for r in matched])

        if q.op == "delete":
            for r in matched:
                rows.remove(r)
            return Result(data=[dict(r) for r in matched])

        data = [dict(r) for r in matched]
        count = len(data) if q._count else None
        return Result(data=data[: q._limit] if q._limit else data, count=count)
