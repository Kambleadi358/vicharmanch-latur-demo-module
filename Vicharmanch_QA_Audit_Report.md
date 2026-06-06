# Vicharmanch QA Audit Report — V2

_Last updated: 2026-06-04_

## V2 Modules — Status

| Module | Status | Notes |
|---|---|---|
| Community Registry (समाज नोंदणी) | ✅ Live | Households + members, head auto-creation, education promotion RPC |
| Donation Ledger (देणगी खातावही) | ✅ Live | Assignments, payments, WhatsApp + SMS + Copy templates, bulk-assign all households |
| Suggestion Box | ✅ Live | Public `/suggestion`, admin filter + WhatsApp reply |
| Participation Analytics | ✅ Live | Year-wise growth, category distribution (Recharts) |
| Participation Integrity | ✅ Live | Registry-only picker, unique constraint, failed-search log |
| Song Upload + Download | ✅ Live | MP3/M4A/WAV ≤15 MB; admin download via signed URL, filename = participant name |
| Activity Log | 🟡 Partial | Wired in: archive, settings, suggestions, donation ledger (assign/pay/delete/bulk). Pending: program winners, expenses |
| Settings Center | ✅ Live | Site, Security (password), Quiz, Event, Notifications, Backup |
| Annual Archive (वार्षिक अभिलेखागार) | ✅ Live | Validation, password confirm, JSZip package, read-only trigger, PDF certificate |
| Connection Health Monitor | ✅ Live | Always-visible chip, 30 s polling, online/slow/offline states; future-ready for offline queue |
| Public Archive on Ahval | ✅ Live | Historical year cards (jama/kharch/shillak/participants/programs/remark) |

## RLS / Security
- All new tables: RLS on, admin-only writes, public INSERT only on `suggestions` and `failed_participation_searches`
- Storage buckets `participation-songs` and `archives` are private, admin-managed
- Archive read-only trigger blocks edits on `is_archived = true`
- Unique partial index `(competition_id, household_member_id)` prevents duplicate participation

## Known Gaps / Risks
- DonationManagement (legacy `homes`/`home_donations`) still co-exists with the new ledger. Public खाते page needs explicit migration to read from `donation_payments` (planned next).
- Real SMS gateway not integrated — relies on device's `sms:` deep link.
- 2FA / Microsoft Authenticator: placeholder only.
- Email receipts: no SMTP wired yet.

## Capacity Estimate
- 500 concurrent public viewers, 50 concurrent admin writes — comfortable on current Supabase tier (free DB pool, Edge cached).

## 2026-06-06 Patch

| Fix | Status |
|---|---|
| Public vote visibility on `/spardha/:id` (per-category ranked table + total points) | ✅ |
| Vote uniqueness now scoped to `(competition, category)` — voters can vote in multiple competitions & multiple categories, once per pair | ✅ |
| Suggestion box: anonymous mode removed (UI + admin view) | ✅ |
| Dashboard home stats refactored to read from `donation_payments` + `household_year_assignments` + `ledger_expenses` (no more legacy `home_donations`/`account_expenses`) | ✅ |
| Household delete: `donation_payments` FK changed to `ON DELETE CASCADE` (members + assignments already cascaded) | ✅ |
| Donation Ledger PDF report: full printable A4, community header + logo, totals + per-household table, status colors | ✅ |
| Connection Health chip added to public `Header` (always visible on every public page; sm+ screens) | ✅ |

