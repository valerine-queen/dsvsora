# DSV SORA

**DSV SORA (Synchronized Operational Record Automation)** (`index.html`) — client-side attendance reconciliation tool. Upload an Excel/CSV attendance export, it matches fingerprint clock-ins against the 314 embedded shift codes, flags mismatches/overtime/missing punches, and exports the corrected sheet back to Excel. Nothing leaves the browser — no backend, no server calls.

Clock-in/out times are rounded to the nearest hour before shift matching: up to 30 minutes past the hour stays on that hour, more than 30 rounds up (e.g. 14:38 → 15:00, 23:05 → 23:00).

Live: https://valerine-queen.github.io/dsvsora/ — redeploys automatically on every push to `main`.

`combined_attendance_control_engine.html` is the original single-file draft, kept for reference.
