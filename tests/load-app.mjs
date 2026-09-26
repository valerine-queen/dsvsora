// Loads the inline <script> of index.html into a sandbox with just enough DOM/localStorage
// stubbed for the logic to run, so tests exercise the exact code the page ships.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

export function loadApp({ storage = {} } = {}) {
  const els = {};
  const el = () => ({ textContent: '', value: '', innerHTML: '', hidden: false, open: false, style: {},
    classList: { toggle() {} }, addEventListener() {} });
  const store = { ...storage };
  const ctx = vm.createContext({
    document: {
      getElementById: id => (els[id] ??= el()),
      querySelectorAll: () => [],
    },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    alert() {}, confirm: () => true, setTimeout() {}, clearTimeout() {},
    XLSX: {},
  });
  vm.runInContext(script, ctx, { filename: 'index.html<script>' });
  const run = code => vm.runInContext(code, ctx);
  return { run, store, els };
}

// A Monday/Friday/Saturday/Sunday in Aug 2026, in the dd-mm-yyyy the page uses.
export const MON = '03-08-2026', FRI = '07-08-2026', SAT = '08-08-2026', SUN = '09-08-2026';

// Builds an attendance row the way an upload does (through mapAttendance).
export function row(date, { plan, fin, fout, finDate = date, foutDate = date } = {}) {
  return {
    Date: date, Position: 'Tester', 'Planned Shift': plan ?? '', 'Planned Date In': date,
    'Finger Date In': fin != null ? finDate : '', 'Finger Time In': fin ?? '',
    'Finger Date Out': fout != null ? foutDate : '', 'Finger Time Out': fout ?? '',
  };
}

// Loads rows into the app, renders twice (analyze must be stable across renders) and returns them.
export function analyzeRows(app, rawRows) {
  app.run(`rows = ${JSON.stringify(rawRows)}.map(mapAttendance); render(); render();`);
  return app.run('rows');
}
