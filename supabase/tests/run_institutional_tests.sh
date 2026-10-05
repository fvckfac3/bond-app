#!/usr/bin/env bash
# Applies the Supabase stub, a schema file, then migration 021 twice (idempotency) to a fresh
# throwaway database and runs 021_institutional_rls_test.sql. Point PGHOST/PGPORT/PGUSER at a
# local disposable Postgres 15 superuser connection. Never run against the live project.
#
#   supabase/tests/run_institutional_tests.sh [schema.sql]   (default: supabase/bond_schema.sql)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
schema="${1:-$here/../bond_schema.sql}"
db="bond_institutional_test_$$"
psql_q() { psql -v ON_ERROR_STOP=1 -q -X "$@"; }

psql_q -d postgres -c "CREATE DATABASE $db" >/dev/null
trap 'psql_q -d postgres -c "DROP DATABASE IF EXISTS $db" >/dev/null' EXIT

psql_q -d "$db" -f "$here/supabase_stub.sql" 2>/dev/null
psql_q -d "$db" -f "$schema" >/dev/null 2>&1 || { echo "schema failed to load: $schema"; psql_q -d "$db" -f "$schema" 2>&1 | grep -v NOTICE | tail -5; exit 1; }
echo "loaded $schema"
for i in 1 2; do
  psql_q -d "$db" -f "$here/../migrations/021_institutional_clinician_schema.sql" 2>&1 | grep -v NOTICE || true
  echo "applied 021 (pass $i)"
done
psql_q -d "$db" -f "$here/021_institutional_rls_test.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  //'
