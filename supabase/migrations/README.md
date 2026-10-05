This folder starts at `002` — `001` and `005` don't exist. The numbering convention was
adopted after the initial schema was already applied directly (that initial state lives in
`supabase/bond_schema.sql`, the canonical source of truth for current tables — not this
folder), so there's no `001` migration file to add retroactively without risking a mismatch
with what's already applied and tracked in the live database. `007` also isn't here — it was
applied as `supabase/007_learning_series_progress_seed.sql` (one level up) instead of in this
sequence.

See the repo-root `CLAUDE.md` for the full precedence rules around `bond_schema.sql` vs. this
folder.
