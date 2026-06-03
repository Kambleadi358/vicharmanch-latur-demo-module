
# V2 Modules 2–7 — Implementation Plan

Doing all 6 modules truly "in one go" without phases produces buggy, shallow code. Here is the honest plan: one large migration that covers every new table, then UI/edge functions in 4 phases. Each phase is a single round and is independently usable.

---

## Phase 0 — Single Database Migration (one approval)

All schema for Modules 2–7 in one migration so we don't ping-pong approvals.

New tables (all `admin`-only RLS, `service_role` grants):

- `suggestions` — Module 3. Fields: name, mobile, category (`enum: suggestion|complaint|feedback|other`), message, status (`enum: new|accepted|rejected|resolved`), is_anonymous, admin_response, resolved_at.
- `admin_activity_logs` — Module 5. Fields: actor_user_id, actor_email, action, entity_type, entity_id, details (jsonb), ip, user_agent.
- `app_settings` — Module 7. Generic key/value/section store (sections: site, security, quiz, event, notification, backup). Extends existing `site_settings` rather than replacing it.
- `participation_songs` — Module 4. Fields: participant_id, file_path, original_filename, mime, size_bytes. Storage bucket `participation-songs` (private).
- `archives` — Module 6. Fields: year, archive_date, created_by, remark, summary (jsonb of totals), zip_path.
- Add `is_archived boolean default false` + `archived_year text` to: `households`, `household_members`, `donation_payments`, `programs`, `participants`, `prize_allocations`, `quiz_sessions`, `suggestions`, `notices`, `admin_activity_logs`. Used for read-only enforcement.
- DB trigger `enforce_archive_readonly()` on those tables: blocks UPDATE/DELETE when `is_archived = true`.
- DB function `promote_education_levels()` already exists — reused for Module 6 carry-forward.
- New storage bucket `archives` (private, admin-only signed URL downloads).

---

## Phase 1 — Module 2 (Donation Communication Center) + Module 3 (Suggestion Box)

Smallest, highest value, no auth complexity.

**Module 2** — extend `DonationLedgerManagement.tsx`:
- For each household × year row, compute `assigned − paid`.
- Two action buttons per row:
  - "पूर्ण देणगी संदेश" — visible when `paid >= assigned && assigned > 0`. Opens dialog with the completed-payment template pre-filled (name, year-1891 jayanti number, amount).
  - "स्मरणपत्र संदेश" — visible when `paid < assigned`. Opens dialog with the pending template (name, pending amount).
- Dialog: WhatsApp button (`https://wa.me/<mobile>?text=<encoded>`), SMS button (`sms:<mobile>?body=<encoded>`), Copy button.
- Bulk action: "सर्व प्रलंबित घरांना स्मरणपत्र" → opens list with checkboxes, generates a single WhatsApp "click-to-chat" link per selected household (no Twilio).
- Optional email receipt: deferred (no SMTP connector chosen yet).

**Module 3** — Public form + admin queue:
- Public page `/suggestion` (Marathi): name, mobile, category select (सुझाव/तक्रार/अभिप्राय/इतर), message, anonymous toggle (if enabled in settings).
- New admin section `suggestions` in sidebar (group: समाज). List with status filter, accept/reject/resolve actions. Resolve opens a dialog that drafts a Marathi response; WhatsApp/Copy buttons.

---

## Phase 2 — Module 5 (Admin Activity Log) + Module 7 (Settings Center)

**Module 5**:
- Helper `logAdminAction(action, entity_type, entity_id, details)` in `src/lib/activityLog.ts`.
- Insert calls at: login, logout, household CRUD, member CRUD, donation payment CRUD, program/competition CRUD, suggestion status change, archive creation, settings change.
- New admin section "क्रियाकलाप नोंदी" with filterable table (date range, actor, action, entity).
- Microsoft Authenticator / TOTP: per earlier decision we keep email+password and add TOTP later — this module ships activity logs only, with a stub UI note about future TOTP.

**Module 7** — `SettingsCenter.tsx`:
- Replaces the current single-screen `AdminSettings` tab with a tabbed module:
  1. साइट सेटिंग्स (existing site_settings — logo, gallery URL, instagram, etc.)
  2. सुरक्षा सेटिंग्स (password change, leaked-password protection toggle, future TOTP placeholder)
  3. प्रश्नमंजुषा सेटिंग्स (quiz config — title, scheduled_start, duration, publish_answer_key)
  4. कार्यक्रम सेटिंग्स (current active year, default categories, anonymous-suggestions toggle)
  5. सूचना सेटिंग्स (placeholder for SMS/email — disabled until provider added)
  6. बॅकअप सेटिंग्स (link to archive center, manual export buttons)
- Backed by generic `app_settings` (section/key/value), with the existing `site_settings` and `quiz_config` tables read-through.

---

## Phase 3 — Module 4 (Participation Analytics + Song Upload)

- New section "सहभाग विश्लेषण": charts (year-wise growth bar, program-wise pie, age category breakdown छोटा/मोठा/खुला). Uses existing `participants` + `competitions` data.
- Participant registration form: when competition name contains "नृत्य", show optional MP3/M4A/WAV upload (max 15 MB). Upload to `participation-songs` bucket; insert row in `participation_songs`.
- Admin participant table: shows download icon if song exists. Download renames file to `<participant_name>-<entry_code>.<ext>` on the fly (browser-side rename via blob).

---

## Phase 4 — Module 6 (वार्षिक अभिलेखागार)

Largest single module. Rebuild `YearLockManager` → `AnnualArchiveManager`.

10-step wizard component:
1. **Validation summary** — read counts/totals from each domain table, display as checklist.
2. **Password confirm** — re-prompt admin password, call `supabase.auth.signInWithPassword` to verify.
3. **Remark input** — required textarea, e.g. "भीमजयंती १३५ वार्षिक अभिलेख".
4. **Snapshot creation** — call new edge function `archive-create`:
   - Computes summary (households, members, donations, expenses, programs, participants, winners, balance).
   - Inserts `archives` row.
   - Sets `is_archived=true`, `archived_year=<year>` on all domain rows for that year.
5. **ZIP package** — edge function streams JSON exports of every table for that year + a `manifest.json` + the archive PDF, returns a signed URL. Browser triggers download.
6. **Read-only enforcement** — the DB trigger from Phase 0 blocks edits to archived rows automatically; UI shows a "🔒 अभिलेखित" badge.
7. **Year-transition wizard** — confirms new active year, sets `households.active_year` to new year for non-archived rows.
8. **Registry carry-forward** — copies households/members into the new year (keeping mobile, addresses), bumps `education_level` via the existing `promote_education_levels()` function.
9. **Do not carry forward** — expenses/programs/participants/winners/quiz/suggestions/notifications/logs are left in the archived year and not duplicated.
10. **Archive dashboard** — new public block on `/ahval` (वार्षिक अहवाल) lists archives with year, totals, balance, remark, archive date, PDF download. Admin sees the same plus ZIP re-download.
11. **Archive certificate PDF** — edge function `archive-pdf` renders A4 portrait with org name/logo, year, totals, balance, programs, participants, remark, date.

---

## What I will NOT do in this round

- Real SMS sending (Twilio) — wa.me/SMS deep links only, per your earlier choice.
- Microsoft Authenticator / TOTP — placeholder only.
- Email receipts — no SMTP connector chosen.
- Public audit2.md — per your earlier instruction, after modules are built.

---

## Approval needed

Confirm one of:

- A: Build Phase 0 migration + Phase 1 now. Then Phases 2/3/4 in follow-up turns. (Recommended — keeps each shipment testable.)
- B: Build Phase 0 + Phases 1, 2, 3 now; Phase 4 (Archive) separately. (Aggressive but doable.)
- C: All 4 phases in one turn. (Will be shallow on Phase 4; risk of incomplete archive flow.)

If you don't reply, I'll proceed with **A**.

