import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, loadApp, row, analyzeRows, MON, FRI, SAT, SUN } from './load-app.mjs';

const pick = r => ({ code: r.ActualShiftCode, in: r.ActualTimeIn, dateOut: r.ActualDateOut, out: r.ActualTimeOut, issue: r.Issue });

test('page script loads and every inline handler exists', () => {
  const app = loadApp();
  const handlers = new Set([...html.matchAll(/on(?:click|change|keydown|input)="(\w+)\(/g)].map(m => m[1]));
  assert.ok(handlers.size > 0);
  for (const h of handlers) assert.equal(app.run(`typeof ${h}`), 'function', `${h} is not defined`);
});

test('embedded master: 314 HR codes, all timed, names agree with times', () => {
  const app = loadApp();
  assert.equal(app.run('EMBEDDED_MASTER.length'), 314);
  assert.equal(app.run('master.filter(m => m.startMin == null || m.endMin == null).length'), 0);
  assert.equal(app.run('masterMismatches(EMBEDDED_MASTER).length'), 0);
  assert.equal(app.run("shiftByCode('HK9E').start + '-' + shiftByCode('HK9E').end"), '09:00-18:00');
  // "24.00" starts are written 23:59 in the HR file and must count as midnight.
  assert.equal(app.run("shiftByCode('HK24A').startMin + '/' + shiftByCode('HK24A').duration"), '0/360');
});

test('clock times round to the nearest half hour, :15/:45 up', () => {
  const app = loadApp();
  const r = t => app.run(`fmtMin(roundToHalfHour(parseTime(${JSON.stringify(t)})))`);
  assert.equal(r('08:14'), '08:00');
  assert.equal(r('08:15'), '08:30');
  assert.equal(r('08:27'), '08:30');
  assert.equal(r('08:45'), '09:00');
  assert.equal(r('18:01'), '18:00');
  assert.equal(r('23:50'), '00:00');
});

test('weekday: shift starts at rounded clock-in with a 9h span', () => {
  const app = loadApp();
  const [a, b, c] = analyzeRows(app, [
    row(MON, { plan: 'HK8E', fin: '08:45', fout: '18:02' }),
    row(MON, { plan: 'HK8E', fin: '08:27', fout: '17:35' }),
    row(MON, { plan: 'HK9E', fin: '09:00', fout: '21:00' }),
  ]);
  assert.equal(a.ActualShiftCode, 'HK9E');
  assert.equal(b.ActualShiftCode, 'HK85E');
  assert.equal(c.ActualShiftCode, 'HK9E');
  assert.match(c.Issue, /Possible Overtime/);
});

test('planned shift wins when it fits; out-only rows follow the plan or the out', () => {
  const app = loadApp();
  const [plan, noPlanFit, onPlan] = analyzeRows(app, [
    row(MON, { plan: 'HK9E', fout: '18:01' }),
    row(MON, { plan: 'HK8E', fout: '18:01' }),   // HK8E ends 16:30, so pick by the out
    row(MON, { plan: 'HK85E', fin: '08:20', fout: '17:40' }),
  ]);
  assert.deepEqual([plan.ActualShiftCode, plan.ActualTimeIn], ['HK9E', '09:00']);
  assert.deepEqual([noPlanFit.ActualShiftCode, noPlanFit.ActualTimeIn], ['HK9E', '09:00']);
  assert.equal(onPlan.ActualShiftCode, 'HK85E');
  assert.equal(onPlan.Issue, 'No Issue');
});

test('weekend: 5h or 6h by clock-out (default 5h); Friday night into Saturday stays 9h', () => {
  const app = loadApp();
  const [five, six, sunInOnly, fri] = analyzeRows(app, [
    row(SAT, { plan: 'HK8E', fin: '08:00', fout: '13:05' }),
    row(SAT, { plan: 'HK8E', fin: '08:00', fout: '14:10' }),
    row(SUN, { plan: 'HK8E', fin: '08:50' }),
    row(FRI, { plan: 'HK22B', fin: '22:00', fout: '07:02', foutDate: SAT }),
  ]);
  assert.equal(five.ActualShiftCode, 'HK8B');
  assert.equal(six.ActualShiftCode, 'HK8H');
  assert.deepEqual([sunInOnly.ActualShiftCode, sunInOnly.ActualTimeOut], ['HK9E1', '14:00']);
  assert.deepEqual([fri.ActualShiftCode, fri.ActualDateOut], ['HK22B', SAT]);
});

test('planned day off: no punch stays OFF, a punch gets a Libur code', () => {
  const app = loadApp();
  const [off, worked, evening] = analyzeRows(app, [
    row(MON, { plan: 'OFF' }),
    row(SAT, { plan: 'OFF', fin: '08:00', fout: '13:00' }),
    row(MON, { plan: 'OFF', fin: '18:55', fout: '00:05', foutDate: '04-08-2026' }),
  ]);
  assert.deepEqual([off.ActualShiftCode, off.Issue], ['OFF', 'No Issue']);
  assert.deepEqual([worked.ActualShiftCode, worked.Issue], ['HK8BOFF', 'Overtime Holiday']);
  assert.equal(evening.ActualShiftCode, 'HK19COFF');
});

test('editing one clock time realigns the other, code and description', () => {
  const app = loadApp();
  analyzeRows(app, [row(MON, { plan: 'HK8E', fin: '08:45', fout: '18:02' })]);
  app.run("setFieldTimeDate(0, 'ActualTimeIn', '08:27')");
  let r = app.run('rows[0]');
  assert.deepEqual(pick(r), { code: 'HK85E', in: '08:27', dateOut: MON, out: '17:30', issue: r.Issue });
  assert.match(r.ActualShiftDesc, /08\.30 - 17\.30/);

  app.run("setFieldTimeDate(0, 'ActualTimeOut', '18:01')");
  r = app.run('rows[0]');
  assert.deepEqual([r.ActualShiftCode, r.ActualTimeIn, r.ActualTimeOut], ['HK9E', '09:00', '18:01']);

  app.run("setFieldTimeDate(0, 'ActualTimeIn', '19:00')");
  r = app.run('rows[0]');
  assert.equal(r.ActualDateOut, '04-08-2026', 'overnight shift moves the out-date to the next day');
});

test('Excel cells: time fractions, 00:00 as 0, date serials and regional date text', () => {
  const app = loadApp();
  const t = v => app.run(`cellTime(${JSON.stringify(v)})`);
  const d = v => app.run(`cellDate(${JSON.stringify(v)})`);
  assert.equal(t(0.8125), '19:30');
  assert.equal(t(0), '00:00');
  for (const s of ['19.30', '7:30 PM', '19:30:00']) assert.equal(app.run(`fmtMin(parseTime(cellTime(${JSON.stringify(s)})))`), '19:30', s);
  assert.equal(d(46237), '03-08-2026');
  for (const s of ['03-08-2026', '03/08/2026', '3/8/2026', '03.08.2026', '2026-08-03']) assert.equal(d(s), '03-08-2026', s);
  assert.equal(d('08/13/2026'), '13-08-2026', 'month-first only when day-first is impossible');

  const r = app.run(`mapAttendance({ Date: 46237, 'Planned Time Out': 0, 'Finger Time In': 0.6597222222, 'Finger Time Out': 0 })`);
  assert.deepEqual([r.Date, r.PlannedTimeOut, r.FingerTimeIn, r.FingerTimeOut], ['03-08-2026', '00:00', '15:50', '00:00']);
});

test('master upload check flags time columns that drifted from the names', () => {
  const app = loadApp();
  const shifted = app.run(`EMBEDDED_MASTER.slice(0, 10).map((m, i, a) => ({ ...m, end: a[(i + 1) % a.length].end }))`);
  assert.ok(app.run(`masterMismatches(${JSON.stringify(shifted)}).length`) > 0);
});

test('saved master: v2 is restored, pre-fix v1 (raw fractions) is discarded', () => {
  const list = [{ code: 'X1', desc: 'Hari Kerja 08.00 - 17.00', start: '08:00', end: '17:00' }];
  const v2 = loadApp({ storage: { 'dsvsora.master.v2': JSON.stringify({ list, source: { name: 'm.xlsx', date: '26/09/2026' } }) } });
  assert.equal(v2.run('master.length'), 1);

  const v1 = loadApp({ storage: { 'dsvsora.master': JSON.stringify({ list: [{ code: 'HK7A', desc: 'x', start: '0.2916', end: '0.5' }] }) } });
  assert.equal(v1.run('master.length'), 314);
  assert.ok(!('dsvsora.master' in v1.store));
});
