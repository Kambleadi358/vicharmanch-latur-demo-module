# Vicharmanch Reverse Engineering Spec — V2

_Last updated: 2026-06-04_

## V2 Database Schema (additions)

### New tables
- `households`, `household_members`, `household_year_assignments`, `donation_payments` — Community Registry + new donation ledger
- `suggestions` — public suggestion box
- `admin_activity_logs` — actor_user_id, actor_email, action, entity_type, entity_id, details JSONB, user_agent
- `app_settings` — section/key/value JSONB
- `participation_songs` — participant_id → file_path (storage bucket `participation-songs`)
- `archives` — year, archive_date, remark, summary JSONB, zip_path, created_by_email
- `failed_participation_searches` — entered_name, competition_id, competition_name, user_agent

### New columns
- `participants.household_member_id uuid → household_members.id` (nullable for legacy)
- `is_archived bool` + `archived_year text` on all primary domain tables

### Indexes / constraints
- `uniq_participant_member_competition` UNIQUE (competition_id, household_member_id) WHERE not archived → enforces 1-registration-per-competition
- `idx_participants_member`

### Triggers / functions
- `enforce_archive_readonly()` — BEFORE UPDATE/DELETE on archived rows
- `promote_education_levels()` SECURITY DEFINER RPC
- `auto_create_head_member()`, `sync_head_member()` — keep head row mirrored
- `auto_create_competition_for_program()` — 1:1 program↔competition

## Storage Buckets
| Bucket | Public | RLS |
|---|---|---|
| `competition-images` | yes | open |
| `annual-reports` | yes | admin write |
| `participation-songs` | no | anon INSERT (upload only), admin SELECT/DELETE |
| `archives` | no | admin only |

## Workflows

### Participation Integrity Flow
1. Public selects competition + category
2. Search box queries `household_members` (substring, min 2 chars)
3. Selection required — free text blocked
4. If no match → log to `failed_participation_searches` + open prefilled WhatsApp to admin (918275956954)
5. INSERT into `participants` with `household_member_id`; DB unique index rejects duplicates

### Archive Workflow
1. Validation summary (households, members, donations, programs, etc.)
2. Re-auth via password
3. Remark entry
4. JSON snapshot of all V2 tables
5. JSZip bundle uploaded to `archives` bucket
6. `archives` row inserted; `is_archived` flag set on domain rows → trigger blocks edits
7. PDF "Archive Certificate" printed via browser

### Settings Architecture
- Single `app_settings` table keyed by (section, key)
- SettingsCenter tabs map 1:1 to sections
- All writes call `logAdminAction("update_setting", "app_settings", id, { section, key })`

### Activity Logging
- Helper `logAdminAction(action, entity_type?, entity_id?, details?)` in `src/lib/activityLog.ts`
- Best-effort fire-and-forget; failures swallowed
- Surfaced in `ActivityLogManagement.tsx` (admin "क्रियाकलाप नोंदी")

### Connection Health
- `useConnectionHealth(intervalMs=30000)` polls `/rest/v1/site_settings?limit=1`
- States: online (<1500 ms), slow (≥1500 ms), offline (fetch fail or `navigator.onLine === false`)
- `ConnectionStatus` chip rendered in admin header — future hook points: pending sync queue, offline save, retry

## V2 Completion: ~85%
Pending: legacy donation module merge into ledger, full activity-log coverage on programs/expenses, real SMS gateway.

## 2026-06-06 Schema Patch

- `donation_payments.household_id` FK → `households.id` ON DELETE CASCADE
- `public_votes` unique indexes replaced:
  - `public_votes_one_per_cat_fp (competition_id, category, device_fingerprint)`
  - `public_votes_one_per_cat_phone (competition_id, category, voter_phone)`
- `public_votes` RLS: anon SELECT enabled for live public results

## Dashboard Data Sources (current)
- Donations: `donation_payments` + `household_year_assignments`
- Expenses: `ledger_expenses`
- Legacy `home_donations`/`account_expenses` are no longer read by the dashboard or public Accounts page.

## PDF Reports
- Donation Ledger: client-side, opens printable window with community header (logo + Marathi name), totals grid, full ledger table. No server, no extra deps.

