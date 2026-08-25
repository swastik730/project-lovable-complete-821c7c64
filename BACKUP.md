# Backup & Restore (BoardBuddy)

## Automated backups — already ON

Lovable Cloud automatically takes **daily backups** of the whole database and keeps them for **~14 days**. No setup or schedule configuration is needed (custom schedules are not supported — daily is built-in).

To restore: **Cloud tab → Database → Backups → choose a snapshot → Restore.**
Note: restore rolls the database back to that point — data/schema changes made after the snapshot are lost. After any restore, ask Lovable to test the app and patch schema mismatches.

## Storage

The project currently has **no storage buckets**, so there is no file storage to back up. If buckets are added later, download critical files periodically (Cloud → Storage) since bucket files are not part of database snapshots.

## Restore test — baseline snapshot (taken 2026-08-25)

After any restore, run this checklist and compare against the baseline:

| Table | Baseline rows |
| --- | --- |
| profiles | 2 |
| user_roles | 4 |
| plans | 4 |
| study_models | 6 |
| questions | 0 (bank is bundled in app code) |
| attempts | 0 |
| bookmarks | 0 |
| subscriptions | 0 |
| mock_tests | 0 |
| ncert_solutions | 0 |

Post-restore smoke test:
1. Sign in as owner `swastikbaniya` — `/owner` must load (proves `auth.users` + `user_roles` survived).
2. Open home + practice — profile XP/streak should show.
3. Run the row-count query again and compare with the table above.

```sql
SELECT 'profiles' AS t, COUNT(*) FROM public.profiles
UNION ALL SELECT 'user_roles', COUNT(*) FROM public.user_roles
UNION ALL SELECT 'plans', COUNT(*) FROM public.plans
UNION ALL SELECT 'study_models', COUNT(*) FROM public.study_models
UNION ALL SELECT 'questions', COUNT(*) FROM public.questions
UNION ALL SELECT 'attempts', COUNT(*) FROM public.attempts
UNION ALL SELECT 'subscriptions', COUNT(*) FROM public.subscriptions;
```

## Manual export (optional extra safety)

For an off-platform copy: **Cloud → Advanced settings → Export data** (export only; there is no self-serve import — re-imports go through Lovable).
