# DSV SORA

**DSV SORA (Synchronized Operational Record Automation)** (`index.html`) — client-side attendance reconciliation tool. Upload an Excel/CSV attendance export, it matches fingerprint clock-ins against the embedded shift codes (159) or an uploaded master — the uploaded one is remembered in that browser (localStorage) until "Reset to embedded", flags mismatches/overtime/missing punches, and exports the corrected sheet back to Excel. Nothing leaves the browser — no backend, no server calls.

Clock-in/out times are rounded to the nearest half hour, :15 and :45 roll up (08:14 → 08:00, 08:27 → 08:30, 08:45 → 09:00, 18:01 → 18:00). The shift is then picked from the rounded times:

- The planned shift wins if it starts at the rounded clock-in and ends within 30 minutes of the rounded clock-out (either may be missing).
- Otherwise: the shift starting at the clock-in (or, with only a clock-out, ending at it) with the standard length — 9 hours (8h + break) on weekdays, 5 or 6 hours when clocking in on Saturday/Sunday (whichever fits the clock-out, default 5). A Friday shift running into Saturday counts as a weekday shift.
- A missing clock-in/out is filled from the chosen shift (only out 18:01 → in 09:00).

If the planned shift is a day off (OFF / Libur) but there is a clock-in, the match is made against the "Hari Libur" variants (e.g. `HK19AOFF`) instead of the regular "Hari Kerja" shifts, and the row is flagged Overtime Holiday.

Editing Actual Time In picks the shift that starts at that time and sets Actual Time Out to its end (and vice versa); the shift code, description and out-date follow. Ties go to the shift closest in length to the current one.

Live: https://valerine-queen.github.io/dsvsora/ — redeploys automatically on every push to `main`.

`combined_attendance_control_engine.html` is the original single-file draft, kept for reference.
