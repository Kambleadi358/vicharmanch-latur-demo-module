# Project Architecture Rules

- Keep cross-platform printing in one shared `src/lib/print.ts` helper so web printing and Android PDF delivery stay consistent across report modules.
- Keep Firebase web-push credential handling in the existing Firebase messaging service worker and server-side notification function; native APK permissions remain the wrapper's responsibility because this project ships as a website.
- Derive program lifecycle status from the program's local date and time in Asia/Kolkata so no manually editable status can contradict its scheduled datetime.
- Preserve archive protections in database triggers; restore archived records only through the admin-authorized, audited reopen function because deletion cascades can encounter protected child rows.