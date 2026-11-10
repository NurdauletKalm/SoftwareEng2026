import { useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, Lock, ShieldCheck, Unlock, XCircle } from 'lucide-react';
import { type Booking, type CheckResult, DAY_MINUTES, canBook, parseMinutes, toHHMM } from './lib/availability';

// Fictional, read-only datasets for Room 304 (no real people, no database).
const DATASETS: Record<string, { name: string; bookings: Booking[] }> = {
  single: {
    name: 'Single booking [(600, 660)]',
    bookings: [{ start: 600, end: 660, label: 'Robotics Club (fictional)' }],
  },
  multiple: {
    name: 'Multiple bookings [(600, 660), (780, 840)]',
    bookings: [
      { start: 600, end: 660, label: 'Robotics Club (fictional)' },
      { start: 780, end: 840, label: 'Study Group B (fictional)' },
    ],
  },
};

const PRESETS = [
  { label: '660 → 720', start: 660, end: 720, hint: 'AC4 touching endpoint' },
  { label: '630 → 690', start: 630, end: 690, hint: 'AC4 overlap' },
  { label: '720 → 840', start: 720, end: 840, hint: 'AC2 exactly 120 min' },
  { label: '720 → 841', start: 720, end: 841, hint: 'AC2 121 min' },
  { label: '540 → 570', start: 540, end: 570, hint: 'AC1 starts now' },
];

export default function App() {
  const [nowInput, setNowInput] = useState('540');
  const [blocked, setBlocked] = useState(false);
  const [datasetKey, setDatasetKey] = useState<keyof typeof DATASETS>('single');
  const [startInput, setStartInput] = useState('660');
  const [endInput, setEndInput] = useState('720');
  const [result, setResult] = useState<CheckResult | null>(null);

  const bookings = DATASETS[datasetKey].bookings;
  const now = parseMinutes(nowInput);
  const start = parseMinutes(startInput);
  const end = parseMinutes(endInput);

  const runCheck = () => {
    setResult(canBook(start, end, now, blocked, bookings));
  };

  const applyPreset = (s: number, e: number) => {
    setStartInput(String(s));
    setEndInput(String(e));
    setResult(null);
  };

  const sorted = [...bookings].sort((a, b) => a.start - b.start);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-indigo-600 text-white">
        <div className="mx-auto max-w-5xl px-4 py-5 flex items-center gap-3">
          <CalendarClock className="h-8 w-8 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Room 304 — Innovation Lab</h1>
            <p className="text-indigo-100 text-sm">Smart Campus Room Availability Checker · fictional data · read-only</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 lg:grid-cols-3">
        {/* Test conditions */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" /> Test Conditions
          </h2>
          <label className="block text-sm font-medium mb-1" htmlFor="now">
            Current time <code>now</code> (minutes, 0–1439)
          </label>
          <div className="flex items-center gap-2 mb-4">
            <input
              id="now"
              type="number"
              min={0}
              max={1439}
              value={nowInput}
              onChange={(e) => {
                setNowInput(e.target.value);
                setResult(null);
              }}
              className="w-28 rounded-lg border border-slate-300 px-3 py-2"
            />
            <span className="text-xs rounded bg-slate-100 px-2 py-1">{toHHMM(now)}</span>
          </div>

          <p className="text-sm font-medium mb-1">Room status</p>
          <button
            id="toggle-blocked"
            onClick={() => {
              setBlocked(!blocked);
              setResult(null);
            }}
            className={`w-full mb-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              blocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {blocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {blocked ? 'Blocked' : 'Open'}
          </button>

          <label className="block text-sm font-medium mb-1" htmlFor="dataset">
            Existing bookings dataset (read-only)
          </label>
          <select
            id="dataset"
            value={datasetKey}
            onChange={(e) => {
              setDatasetKey(e.target.value as keyof typeof DATASETS);
              setResult(null);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(DATASETS).map(([key, ds]) => (
              <option key={key} value={key}>
                {ds.name}
              </option>
            ))}
          </select>
        </section>

        {/* Check form + result */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Check a Time Request</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="start">
                Start (minutes)
              </label>
              <input
                id="start"
                type="number"
                value={startInput}
                onChange={(e) => {
                  setStartInput(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <span className="text-xs text-slate-500">= {toHHMM(start)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="end">
                End (minutes)
              </label>
              <input
                id="end"
                type="number"
                value={endInput}
                onChange={(e) => {
                  setEndInput(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <span className="text-xs text-slate-500">= {toHHMM(end)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                title={p.hint}
                onClick={() => applyPreset(p.start, p.end)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            id="check"
            onClick={runCheck}
            className="w-full sm:w-auto rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Check availability
          </button>

          {result && (
            <div
              id="result"
              role="status"
              className={`mt-4 rounded-lg border p-4 flex items-start gap-3 ${
                result.available ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
              }`}
            >
              {result.available ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
              )}
              <div>
                <p className={`font-bold ${result.available ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {result.available ? 'Available' : 'Unavailable'}
                  {!result.available && <span className="ml-2 text-xs font-normal">({result.rule})</span>}
                </p>
                <p className="text-sm">{result.message}</p>
              </div>
            </div>
          )}
        </section>

        {/* Timeline */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-3">
          <h2 className="font-semibold mb-3">Day Timeline (00:00–24:00)</h2>
          <div className="relative h-10 rounded-lg bg-slate-100 overflow-hidden">
            <div className="absolute inset-y-0 bg-slate-300/70" style={{ left: 0, width: `${(now / DAY_MINUTES) * 100}%` }} />
            {sorted.map((b) => (
              <div
                key={b.start}
                className="absolute inset-y-1 rounded bg-rose-400"
                style={{ left: `${(b.start / DAY_MINUTES) * 100}%`, width: `${((b.end - b.start) / DAY_MINUTES) * 100}%` }}
                title={`${toHHMM(b.start)}–${toHHMM(b.end)}`}
              />
            ))}
            {!Number.isNaN(start) && !Number.isNaN(end) && end > start && (
              <div
                className="absolute inset-y-3 rounded bg-indigo-500/70"
                style={{ left: `${(start / DAY_MINUTES) * 100}%`, width: `${((end - start) / DAY_MINUTES) * 100}%` }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>

          <h3 className="mt-4 text-sm font-medium">
            Existing bookings <span className="text-slate-500">({bookings.length} slot{bookings.length === 1 ? '' : 's'} · read-only)</span>
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {sorted.map((b) => (
              <li key={b.start} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                {toHHMM(b.start)}–{toHHMM(b.end)} · [{b.start}, {b.end}) · {b.label}
              </li>
            ))}
          </ul>
        </section>

        {/* Rules */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-3">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> Acceptance Rules
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            <li><b>AC1</b> — whole minutes, 0 ≤ start &lt; end ≤ 1440, start &gt; now.</li>
            <li><b>AC2</b> — duration end − start ≤ 120 minutes.</li>
            <li><b>AC3</b> — a blocked room rejects every request.</li>
            <li><b>AC4</b> — overlap rejected; touching endpoints allowed.</li>
            <li><b>AC5</b> — clear Available / Unavailable; bookings never mutated.</li>
            <li><b>AC6</b> — readable feedback and a usable mobile layout.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
