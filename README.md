# dsvsora

**Shift Control Room** (`index.html`) — client-side attendance reconciliation tool. Upload an Excel/CSV attendance export, it matches fingerprint clock-ins against the 314 embedded shift codes, flags mismatches/overtime/missing punches, and exports the corrected sheet back to Excel. Nothing leaves the browser — no backend, no server calls.

Live at GitHub Pages once enabled: Settings → Pages → Deploy from branch `main` / `(root)`.

`combined_attendance_control_engine.html` is the original single-file draft, kept for reference.