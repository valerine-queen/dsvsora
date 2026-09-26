# DSV SORA

**DSV SORA (Synchronized Operational Record Automation)** (`index.html`) — client-side attendance reconciliation tool. Upload an Excel/CSV attendance export, it matches fingerprint clock-ins against the 314 embedded shift codes (HR EmployeeScheduleUpload master, Oktober 2026) or an uploaded master — the uploaded one is remembered in that browser (localStorage) until "Reset to embedded", flags mismatches/overtime/missing punches, and exports the corrected sheet back to Excel. Nothing leaves the browser — no backend, no server calls.

The actual shift is picked with the planned schedule as the reference (`Planned Shift` may be a code like `HK85E` or the HR shift name like `Hari Kerja  08.30 - 17.30`; the planned times are the fallback):

- **Clock-in:** early, or less than 30 minutes late → the planned shift. 30 minutes to 2 hours late → the shift starting at the clock-in rounded **up** to :00/:30 (07:46 → 08:00, 09:22 → 09:30) with the planned length.
- **Only a clock-out:** within 2 hours of the planned end → the planned shift (overtime / leaving early doesn't change it).
- **More than 2 hours from the plan** (or no plan) → the most likely shift: starting at the rounded-up clock-in, or ending at the clock-out rounded to the nearest half hour (:15/:45 up), with the standard length — 9 hours (8h + break) on weekdays, 5 or 6 hours when clocking in on Saturday/Sunday (whichever fits the clock-out, default 5). A Friday shift running into Saturday counts as a weekday shift. An early-morning clock-out alone reads as the end of a night shift that began the evening before (its date in is the day before).
- The missing clock-in/out is filled from the chosen shift; the fingerprint times themselves are never changed.

If the planned shift is a day off (OFF / Libur) but there is a clock-in, the match is made against the "Hari Libur" variants (e.g. `HK19AOFF`) instead of the regular "Hari Kerja" shifts, and the row is flagged Overtime Holiday.

Uploads accept .xlsx from Excel or Google Sheets: time cells stored as Excel fractions (incl. 00:00), text times like `19.30` / `7:30 PM`, and dates as serials, `dd-mm-yyyy`, `dd/mm/yyyy` or `yyyy-mm-dd` (normalised to `dd-mm-yyyy`, day-first when ambiguous).

Editing Actual Time In picks the shift that starts at that time and sets Actual Time Out to its end (and vice versa); the shift code, description and out-date follow. It uses the same rules as a one-sided punch above.

Live: https://valerine-queen.github.io/dsvsora/ — redeploys automatically on every push to `main`.

`combined_attendance_control_engine.html` is the original single-file draft, kept for reference.

## Making changes

`main` is production — every push to it goes live on GitHub Pages. So changes go through a branch first:

1. Work on a branch (`git checkout -b fix-something`), push it, open a pull request.
2. **Tests** run automatically on every push (`.github/workflows/test.yml`). Locally: `node --test tests/` (Node 20+, no install needed). The tests load the real `<script>` from `index.html` and check the shift-matching rules, Excel cell parsing and saved-master handling.
3. **Preview** the branch with real data before merging: `https://raw.githack.com/valerine-queen/dsvsora/<branch>/index.html` (the Actions run summary also links the exact commit).
4. Merge the PR only when tests are green and the preview checks out.

When a rule changes, change its test in `tests/logic.test.mjs` in the same PR.
