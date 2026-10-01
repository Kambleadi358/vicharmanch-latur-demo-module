# Android / PWA readiness fixes

No redesign, no new features. Six targeted fixes plus verification.

## What I found (root causes)

**"Read only row is archived" on delete** — On 6 June 2026 a year-lock archive was run for **2026, the year that is still active**. That marked all 7 donation entries as archived (read-only). The households themselves are still active, but deleting a household cascades into its donation entries, so the archive guard blocks it and reports "archived" about the household. The ledger screen also still lists those archived entries as if they were current, with a delete button that can never work.

So the guard is behaving correctly; the data was archived under a live year and the screens don't show that state.

**Print / PDF** — reports open a new browser window and call print. Inside an Android app shell (WebView) pop-up windows and printing are blocked, so the button appears to do nothing.

**Program date/time** — both are free-text Marathi strings and the status is chosen manually, so it can contradict the actual date.

## 1. Archive state, deletion, and reopening a year

- Ledger and registry screens read each record's archive state and show a **"संग्रहित"** badge; for archived records the delete/edit buttons are disabled with the real reason on hover, instead of a failing button.
- Before deleting a household, check its members and donation entries. If any dependent record is archived, show the true reason: "या घराच्या देणगी नोंदी संग्रहित आहेत — प्रथम ते वर्ष पुन्हा उघडा."
- Add an admin-only, logged action in **सेटिंग्ज → वार्षिक अभिलेखागार**: **"वर्ष पुन्हा उघडा"**. It clears the archive flag for that year's records (the ZIP/PDF archive file itself stays untouched) so an accidentally locked live year can be corrected the supported way. Confirmation dialog names the year and record counts.
- Year-lock gets a guard: it refuses to archive the currently active year without an explicit extra confirmation.
- Archive protection itself is unchanged — no RLS is disabled, nothing becomes writable behind the guard.
- All deletes get a confirmation dialog, then refresh the ledger, household summary and dashboard figures so totals stay consistent.

## 2. Print / PDF that works inside the Android app

One shared helper used by every existing print/PDF button (donation statement, registry reports, certificates, documents, prize report, archive report):

- Renders the same HTML as today — logo, Marathi text, tables, stamp, official layout all unchanged.
- Prints through a hidden frame instead of a pop-up window, which works in normal browsers and app shells.
- In an app shell it also offers **"PDF जतन करा"**, which produces a file and hands it to the device's share/save sheet so it can be opened in a PDF viewer or saved.
- No fake "छपाई सुरू..." state: the button shows progress only while work is happening, and failures show "PDF तयार होऊ शकली नाही — पुन्हा प्रयत्न करा."

## 3. Permissions

- On first launch, a one-time Marathi welcome sheet explains and asks for **notifications only** (the one permission needed everywhere). It can be dismissed and re-run from the Permission Manager.
- Camera is asked only when the camera screen opens. Denied shows exactly: "कॅमेरा परवानगी नाकारली आहे. कृपया Browser/App Settings मधून कॅमेरा परवानगी द्या." with a **"परवानगी तपासा / पुन्हा प्रयत्न करा"** action; permanently-denied states say settings must be used.
- Notification denial shows a matching message with the same settings guidance, and the Permission Manager reflects live state (granted / denied / permanently denied / unsupported) and re-checks when the app regains focus.
- Microphone is removed from the permission list — no feature uses it.
- Android manifest guidance: notifications (Android 13+ POST_NOTIFICATIONS) and camera are requested at runtime after launch, never at install.

## 4. Test notification (real, end-to-end)

In the admin notification screen: current permission state, whether this device is registered, and a **"चाचणी सूचना पाठवा"** button that sends a real push to this device only — title "विचारमंच — चाचणी सूचना", body "ही विचारमंच अ‍ॅपची चाचणी सूचना आहे." Tapping it opens the app. The result shown is the actual delivery outcome; a failure is reported as a failure with its reason, and a denied permission tells the admin to enable notifications in App Settings.

## 5. Program date and time pickers

- कार्यक्रम व्यवस्थापन gets a date picker and a time picker (Indian time, Asia/Kolkata), pre-filled correctly when editing an existing program.
- Status is derived from the full date **and** time against the current moment: later → **आगामी**, earlier → **पूर्ण**. The manual status control is replaced by this automatic value, and it re-evaluates as time passes.
- Existing programs whose date is stored as Marathi text keep displaying exactly as they do now; they show the picker once re-saved.

## 6. Regression check

I'll walk the app in a browser and confirm: camera-denied flow, notification-denied flow, test notification, PDF generation and save, active household delete, archived protection, active donation delete, donation totals after deletion, program pickers and automatic status, existing programs, admin authorization, and the mobile layout.

## Technical notes

- New `src/lib/print.ts` (hidden-iframe print + blob/share fallback + WebView detection); existing print HTML builders untouched.
- `src/lib/permissions.ts`: drop microphone, add `permanently-denied` detection via Permissions API + `getUserMedia` error names, re-query on `visibilitychange`.
- Migration: `reopen_archive_year(_year text)` security-definer function, admin-only, clearing `is_archived`/`archived_year` across the archive-guarded tables for that year and writing an `admin_activity_logs` entry.
- `send-push-notification` edge function gains an optional single-token target for the admin test send and returns the real per-token FCM outcome.
- `programs.date`/`time` stay text columns; the form stores ISO date + 24h time and derives status on read, so no breaking schema change.
