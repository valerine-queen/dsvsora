# DSV SORA

**DSV SORA (Synchronized Operational Record Automation)** (`index.html`) — client-side attendance reconciliation tool. Upload an Excel/CSV attendance export, it matches fingerprint clock-ins against the embedded shift codes (159) or an uploaded master — the uploaded one is remembered in that browser (localStorage) until "Reset to embedded", flags mismatches/overtime/missing punches, and exports the corrected sheet back to Excel. Nothing leaves the browser — no backend, no server calls.

Clock-in/out times are rounded to the nearest hour before shift matching: up to 30 minutes past the hour stays on that hour, more than 30 rounds up (e.g. 14:38 → 15:00, 23:05 → 23:00).

If the planned shift is a day off (OFF / Libur) but there is a clock-in, the match is made against the "Hari Libur" variants (e.g. `HK19AOFF`) instead of the regular "Hari Kerja" shifts, and the row is flagged Overtime Holiday.

Editing Actual Time In picks the shift that starts at that time and sets Actual Time Out to its end (and vice versa); the shift code, description and out-date follow. Ties go to the shift closest in length to the current one.

Live: https://valerine-queen.github.io/dsvsora/ — redeploys automatically on every push to `main`.

`combined_attendance_control_engine.html` is the original single-file draft, kept for reference.
