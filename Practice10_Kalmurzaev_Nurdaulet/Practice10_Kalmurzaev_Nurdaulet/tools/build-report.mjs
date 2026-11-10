// 1) Renders recorded command outputs (docs/practice10/evidence/*.txt) as terminal screenshots.
// 2) Builds the Practice #10 report PDF from docs/practice10/*.md + screenshots.
// Usage: node build-report.mjs
import { chromium } from 'playwright-core';
import { marked } from 'marked';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PROJ = join(ROOT, 'smart-campus-room-checker');
const DOCS = join(PROJ, 'docs', 'practice10');
const EVID = join(DOCS, 'evidence');
const SHOTS = join(ROOT, 'screenshots');
const PDF = join(ROOT, 'Practice10_Kalmurzaev_Nurdaulet_Report.pdf');
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const ev = (f) => readFile(join(EVID, f), 'utf8');
const git = (...args) =>
  '$ git ' + args.join(' ') + '\n' + execFileSync('git', ['-c', 'core.pager=cat', ...args], { cwd: PROJ, encoding: 'utf8' });
const clip = (text, head, tail, file) => {
  const lines = text.trimEnd().split('\n');
  if (lines.length <= head + tail) return text;
  return [...lines.slice(0, head), `… (${lines.length - head - tail} more lines — full output in evidence/${file})`, ...lines.slice(-tail)].join('\n');
};

const TERMINALS = [
  ['t01_task1_baseline_checks', 'Task 01 — baseline checks (p09-final-checkpoint)',
    async () => [await ev('t1-python-tests.txt'), await ev('t1-typecheck.txt'), await ev('t1-lint.txt'), await ev('t1-build.txt')].join('\n')],
  ['t02_task1_missing_test_command', 'Task 01 — located files, scripts, missing npm test',
    async () => (await ev('t1-locate.txt')) + '\n' + (await ev('t1-npm-test.txt'))],
  ['t03_task1_npm_audit_baseline', 'Task 01/03 — npm audit (baseline)', () => ev('t1-npm-audit.txt')],
  ['t04_task3_probe_and_checks', 'Task 03 — read-only UI probe + verification commands',
    async () => (await ev('t3-probe-baseline.txt')) + '\n' + (await ev('t3-verification-commands.txt'))],
  ['t05_task7_regression_before_fix', 'Task 07 — regression tests BEFORE the fix (expected to fail)',
    async () => clip(await ev('t7-regression-before-fix.txt'), 30, 7, 't7-regression-before-fix.txt') + '\n' +
      clip(await ev('t7-python-regression-before-fix.txt'), 4, 14, 't7-python-regression-before-fix.txt')],
  ['t06_task8_m1_diff', 'Task 08 — M1 diff reviewed before approval', async () => clip(await ev('t8-m1-diff.txt'), 75, 22, 't8-m1-diff.txt')],
  ['t07_task8_m1_tests', 'Task 08 — M1 results (tests, checks, behaviour unchanged)',
    async () => (await ev('t8-m1-npm-test.txt')) + '\n' + (await ev('t8-m1-checks.txt')) + '\n' + (await ev('t8-m1-behaviour-unchanged.txt'))],
  ['t08_task8_m2_diff', 'Task 08 — M2 diff (source + Python), reviewed before approval',
    async () => git('show', '--stat', '--format=%h %s', 'e2c42e4') + '\n' + git('show', '--format=', 'e2c42e4', '--', 'src', 'python')],
  ['t09_task8_m2_first_run', 'Task 08 — first run after M2 (1 failure, then message aligned)',
    async () => clip(await ev('t8-m2-first-run-after-fix.txt'), 12, 12, 't8-m2-first-run-after-fix.txt')],
  ['t10_task8_final_tests', 'Task 08 — final: npm test, Python, lint/typecheck/build',
    async () => clip(await ev('t8-m2-regression-after-fix.txt'), 5, 6, 't8-m2-regression-after-fix.txt') + '\n' + (await ev('t8-final-npm-test.txt')) + '\n' +
      (await ev('t8-final-python-tests.txt')) + '\n' + (await ev('t8-final-lint-typecheck-build.txt'))],
  ['t11_task7_8_ui_probe_after', 'Task 07/08 — UI probe after fix + manual UI check log',
    async () => (await ev('t8-probe-after.txt')) + '\n' + (await ev('t7-manual-ui-check.txt'))],
  ['t12_task8_npm_audit_after', 'Task 08 — npm audit after (runtime 0; dev tool chain R5/R9)', () => ev('t8-npm-audit-after.txt')],
  ['t13_task6_agents_md_commit', 'Task 06 — approved AGENTS.md patch applied', async () => git('show', '--stat', '1c14022')],
  ['t14_git_log', 'Checkpoint, isolated branch and commits', async () => git('log', '--oneline', '--decorate', '--graph', '--all')],
];

const executablePath = ['/usr/bin/chromium', '/usr/bin/google-chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath, headless: true });

// ---- 1. terminal screenshots ----
const termPage = await browser.newPage({ viewport: { width: 900, height: 200 }, deviceScaleFactor: 2 });
for (const [png, label, get] of TERMINALS) {
  const text = (await get()).replace(/\x1b\[[0-9;]*m/g, '').replaceAll('/home/saintholly/Downloads', '~').replaceAll('/home/saintholly', '~');
  const body = esc(text.trimEnd())
    .replace(/^(\$ .*)$/gm, '<span class="cmd">$1</span>')
    .replace(/^(\+(?!\+\+).*)$/gm, '<span class="add">$1</span>')
    .replace(/^(-(?!--).*)$/gm, '<span class="del">$1</span>')
    .replace(/^(\s*✓.*|OK|.*\.\.\. ok|.*: OK|.*Tests\s+\d+ passed.*|.*Test Files\s+\d+ passed.*|found 0 vulnerabilities)$/gm, '<span class="pass">$1</span>')
    .replace(/^(\s*×.*|\s*→ expected.*|FAILED.*|.*\d+ failed.*|.*FAIL .*|AssertionError.*|npm error.*|.*Severity: (high|critical))$/gm, '<span class="fail">$1</span>')
    .replace(/^(\[exit code: \d+\]|.*vulnerabilities \(.*\))$/gm, '<span class="sum">$1</span>');
  await termPage.setContent(`<html><body style="margin:0;background:#fff">
    <div id="t" style="width:880px;margin:10px;border-radius:8px;overflow:hidden;font:12px 'DejaVu Sans Mono',monospace;box-shadow:0 0 0 1px #2b3040">
      <div style="background:#2b3040;color:#c9d1e3;padding:6px 10px;font-family:sans-serif;font-size:11px">
        <span style="color:#ff5f57">●</span> <span style="color:#febc2e">●</span> <span style="color:#28c840">●</span>
        &nbsp; recorded output · ~/Practice10_Kalmurzaev_Nurdaulet/smart-campus-room-checker — ${esc(label)}</div>
      <pre style="margin:0;background:#151924;color:#d7dce8;padding:10px 12px;white-space:pre-wrap;word-break:break-all;line-height:1.35">${body}</pre>
    </div>
    <style>.cmd{color:#7fb4ff;font-weight:bold}.pass{color:#5fd38d}.fail{color:#ff6b6b}.sum{color:#ffd166}.add{color:#5fd38d}.del{color:#ff8a8a}</style></body></html>`);
  await termPage.locator('#t').screenshot({ path: join(SHOTS, png + '.png') });
}
await termPage.close();

// ---- 2. report ----
const fig = (name, caption) => `<figure><img src="file://${join(SHOTS, name)}.png"><figcaption>${esc(caption)}</figcaption></figure>`;
const SECTIONS = [
  ['01-baseline.md', [['t01_task1_baseline_checks', 'Baseline checks: Python 10/10, typecheck, lint, build'], ['t02_task1_missing_test_command', 'Located files and scripts; npm test missing'], ['t14_git_log', 'Checkpoint tag on main and the isolated mitigation branch']]],
  ['02-ai-risk-review.md', []],
  ['03-challenge-findings.md', [['t04_task3_probe_and_checks', 'Read-only probe and verification commands (baseline)'], ['ui02_before_R1_fractional_660.5_accepted', 'Baseline: start 660.5 is shown as 11:00 and reported Available (R1 confirmed)'], ['ui03_before_R2_now_2000_misleading', 'Baseline: now = 2000 accepted; message shows impossible time 33:20 (R2 confirmed)'], ['t03_task1_npm_audit_baseline', 'npm audit on the baseline (AI-04 / R5)']]],
  ['04-risk-register.md', []],
  ['05-agent-readiness-audit.md', []],
  ['06-agents-md-audit.md', [['t13_task6_agents_md_commit', 'Approved AGENTS.md patch committed separately']]],
  ['07-08-verification-and-mitigations.md', [
    ['t05_task7_regression_before_fix', 'Targeted regression tests fail before the fix (TS 10 failed, Python 1 failed)'],
    ['t06_task8_m1_diff', 'M1 diff reviewed before approval'], ['t07_task8_m1_tests', 'M1: 15/15 tests, checks pass, UI behaviour identical'],
    ['t08_task8_m2_diff', 'M2 diff reviewed before approval'], ['t09_task8_m2_first_run', 'First run after M2: one failing assertion (message wording), fixed'],
    ['t10_task8_final_tests', 'Final: regression 17/17, all 32/32, Python 12/12, lint/typecheck/build OK'],
    ['t11_task7_8_ui_probe_after', 'UI probe after mitigations + manual UI check (desktop/mobile, overflow 0 px)'],
    ['t12_task8_npm_audit_after', 'npm audit after: runtime 0; dev tool chain advisories (R5, new R9)'],
    ['ui01_before_desktop_660-720_available', 'Before — desktop: 660–720 Available (AC4 touching endpoint)'],
    ['ui04_before_mobile_375_overlap', 'Before — mobile 375 px: overlap rejected (AC4)'],
    ['ui05_after_R1_fractional_rejected', 'After — 660.5 rejected with AC1 message'],
    ['ui06_after_R2_now_-30_rejected', 'After — now = −30 rejected with AC1 message'],
    ['ui07_after_desktop_660-720_available', 'After — control case 660–720 still Available'],
    ['ui08_after_mobile_375_overlap', 'After — mobile 375 px: clear AC4 feedback, no horizontal overflow'],
    ['ui09_after_mobile_375_blocked', 'After — mobile 375 px: blocked room rejected (AC3)']]],
  ['09-background-agent.md', []],
  ['10-release-decision.md', []],
  ['11-optional-agent-review-checklist-prompt.md', []],
];
let body = '';
for (const [md, figs] of SECTIONS) {
  body += `<section>${marked.parse(await readFile(join(DOCS, md), 'utf8'))}${figs.length ? '<div class="figs">' + figs.map(([n, c]) => fig(n, c)).join('') + '</div>' : ''}</section>`;
}
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Practice work #10 — Kalmurzaev Nurdaulet</title><style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font: 10.5pt/1.45 'DejaVu Sans', Arial, sans-serif; color: #1d2330; }
  h1 { font-size: 17pt; color: #312e81; border-bottom: 2px solid #c7d2fe; padding-bottom: 4px; margin-top: 0; }
  h2 { font-size: 13pt; color: #3730a3; margin-top: 16px; }
  h3 { font-size: 11.5pt; }
  section { page-break-before: always; }
  .cover { text-align: center; padding-top: 70mm; page-break-before: avoid; }
  .cover h1 { border: 0; font-size: 24pt; }
  .cover table { margin: 18px auto; text-align: left; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 8.4pt; }
  th, td { border: 1px solid #cfd5e3; padding: 3px 5px; vertical-align: top; }
  th { background: #eef2ff; }
  code { font: 8.6pt 'DejaVu Sans Mono', monospace; background: #f1f3f8; padding: 0 2px; border-radius: 3px; }
  pre { background: #f6f7fb; border: 1px solid #dde2ee; padding: 8px; white-space: pre-wrap; font-size: 8pt; }
  pre code { background: none; }
  blockquote { border-left: 3px solid #a5b4fc; margin: 6px 0; padding: 2px 10px; color: #374151; background: #f8f9ff; }
  figure { margin: 10px 0 14px; page-break-inside: avoid; text-align: center; }
  figure img { max-width: 100%; max-height: 225mm; border: 1px solid #d0d5e2; }
  figcaption { font-size: 8.5pt; color: #4b5563; margin-top: 3px; }
</style></head><body>
<div class="cover">
  <h1>Practice work #10<br><span style="font-size:15pt;color:#4338ca">Review AI-assisted software for risks</span></h1>
  <p>Smart Campus Room Availability Checker — Room 304 (Innovation Lab)</p>
  <table>
    <tr><th>Student</th><td>Kalmurzaev Nurdaulet</td></tr>
    <tr><th>Course</th><td>Software Engineering</td></tr>
    <tr><th>Date</th><td>10 November 2026</td></tr>
    <tr><th>AI tool</th><td>Claude Code (Claude Opus 5.5), read-only review + reviewed minimal patches</td></tr>
    <tr><th>Repository</th><td>local git repo <code>smart-campus-room-checker</code> — tag <code>p09-final-checkpoint</code>, branch <code>p10/risk-mitigations</code></td></tr>
    <tr><th>Release decision</th><td><b>CONDITIONAL</b></td></tr>
  </table>
  <p style="font-size:9pt;color:#555;max-width:140mm;margin:20px auto">All data is fictional. No real personal data, secrets or external services are used.
  Every test result in this report comes from a command that was actually run. The raw outputs are in <code>docs/practice10/evidence/</code>.</p>
</div>
${body}</body></html>`;
const htmlPath = join(ROOT, 'tools', 'report.build.html');
await writeFile(htmlPath, html);
const page = await browser.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.pdf({ path: PDF, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">Practice #10 — Kalmurzaev Nurdaulet — <span class="pageNumber"></span>/<span class="totalPages"></span></div>' });
await browser.close();
console.log('terminal screenshots:', TERMINALS.length, '\nreport:', PDF);
