const API = 'https://api.github.com/repos/SkidderiumX/InjectMyau-Unarchive/releases?per_page=20';
const FALLBACK = './releases.json';

const $ = (s) => document.querySelector(s);
const releasesEl = $('#releases');
const statusEl = $('#status');
const qEl = $('#q');
const filterEl = $('#filter');
const sortEl = $('#sort');

let all = [];

document.getElementById('year').textContent = String(new Date().getFullYear());

const navToggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.links');
navToggle?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

function fmtBytes(n) {
  if (!n && n !== 0) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 100 ? 0 : 1)} ${u[i]}`;
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function downloads(r) {
  return (r.assets || []).reduce((s, a) => s + (a.download_count || 0), 0);
}

async function load(fromApi = true) {
  statusEl.textContent = 'Loading releases from GitHub API…';
  releasesEl.innerHTML = '';
  let data = null;
  let source = 'api';
  if (fromApi) {
    try {
      const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
      if (res.status === 403) throw new Error('GitHub API rate-limited — showing cached snapshot.');
      if (!res.ok) throw new Error('API ' + res.status);
      data = await res.json();
    } catch (e) {
      console.warn(e);
      statusEl.textContent = e.message + ' Loading local snapshot…';
      source = 'cache';
    }
  }
  if (!data) {
    source = 'cache';
    const res = await fetch(FALLBACK);
    data = await res.json();
  }
  all = Array.isArray(data) ? data : [];
  $('#rate-note').textContent = source === 'cache' ? '· offline snapshot' : '· live';
  render();
}

function render() {
  const q = qEl.value.trim().toLowerCase();
  const f = filterEl.value;
  const sort = sortEl.value;

  let list = [...all];
  if (f === 'assets') list = list.filter((r) => (r.assets || []).length > 0);
  if (f === 'prerelease') list = list.filter((r) => r.prerelease);
  if (q) {
    list = list.filter((r) =>
      [r.tag_name, r.name, r.body, ...(r.assets || []).map((a) => a.name)]
        .join('\n').toLowerCase().includes(q)
    );
  }
  if (sort === 'oldest') list.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
  else if (sort === 'downloads') list.sort((a, b) => downloads(b) - downloads(a));
  else list.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  // stats (always global)
  const totalDl = all.reduce((s, r) => s + downloads(r), 0);
  const latest = [...all].sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0];
  $('#stat-releases').textContent = String(all.length);
  $('#stat-downloads').textContent = String(totalDl);
  $('#stat-latest').textContent = latest ? (latest.name || latest.tag_name) : '—';
  $('#stat-updated').textContent = latest ? fmtDate(latest.published_at) : '—';
  if (latest) $('#latest-btn').href = latest.html_url;

  statusEl.textContent = `${list.length} / ${all.length} releases`;
  releasesEl.innerHTML = list.map((r, i) => card(r, i === 0 && sort === 'newest')).join('') || '<p class="status">No matches.</p>';
}

function card(r, isLatest) {
  const assets = (r.assets || []).map((a) => `
    <tr>
      <td><a href="${a.browser_download_url}">${escapeHtml(a.name)}</a></td>
      <td class="num">${fmtBytes(a.size)}</td>
      <td class="num">${a.download_count ?? 0}</td>
      <td><a href="${a.browser_download_url}">⬇</a></td>
    </tr>`).join('');

  return `
  <article class="card ${isLatest ? 'latest' : ''}">
    <div class="card-head">
      <h2>${escapeHtml(r.name || r.tag_name)}</h2>
      <span class="tag">${escapeHtml(r.tag_name)}</span>
      ${isLatest ? '<span class="badge latest">latest</span>' : ''}
      ${r.prerelease ? '<span class="badge pre">prerelease</span>' : ''}
      <span class="date">${fmtDate(r.published_at)} · ${downloads(r)} downloads</span>
    </div>
    ${r.body ? `<pre class="notes">${escapeHtml(r.body.slice(0, 2000))}</pre>` : ''}
    ${assets ? `<table class="assets"><thead><tr><th>Asset</th><th style="text-align:right">Size</th><th style="text-align:right">DL</th><th></th></tr></thead><tbody>${assets}</tbody></table>` : '<p class="status">No binaries — source only.</p>'}
    <div class="card-foot">
      <a href="${r.html_url}">GitHub release →</a>
      ${r.zipball_url ? `<a href="${r.zipball_url}">source .zip</a>` : ''}
      ${r.tarball_url ? `<a href="${r.tarball_url}">source .tar.gz</a>` : ''}
    </div>
  </article>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

qEl.addEventListener('input', render);
filterEl.addEventListener('change', render);
sortEl.addEventListener('change', render);
$('#refresh').addEventListener('click', () => load(true));

// ---- Pre-posting channel (invite-gated DLL pre-upload) ----
// Code format: IMU_AC_<RL|B>_<alphanum 12..32>, e.g. IMU_AC_RL_aaabbbccc111222333
// NOTE: static site = client-side gate only (obfuscation). Use a backend for real access control.
const INVITE_RE = /^IMU_AC_(RL|B)_([A-Za-z0-9]{12,32})$/;
const PREVIEW_KEY = 'IMU_AC_RL_PREVIEWKEYAC1';
const LS_INVITE = 'imu_invite';
const LS_STAGED = 'imu_staged';

const inviteInput = $('#invite-code');
const inviteMsg = $('#invite-msg');
const prePanel = $('#pre-panel');
const channelBadge = $('#channel-badge');
const channelDesc = $('#channel-desc');

function parseInvite(code) {
  const c = String(code || '').trim();
  if (c === PREVIEW_KEY) return { kind: 'RL', token: 'PREVIEWKEYAC1', channel: 'release', preview: true };
  const m = c.match(INVITE_RE);
  if (!m) return null;
  return { kind: m[1], token: m[2], channel: m[1] === 'RL' ? 'release' : 'beta', preview: false };
}

function setInvite(code, silent) {
  const p = parseInvite(code);
  if (!p) {
    if (!silent) {
      inviteMsg.textContent = 'Invalid code. Expected IMU_AC_RL_… (18 chars) or IMU_AC_B_…';
      prePanel.hidden = true;
    }
    return null;
  }
  localStorage.setItem(LS_INVITE, code.trim());
  inviteMsg.textContent = p.preview ? 'Preview mode — view only, staging disabled.' : `Unlocked ${p.channel} channel.`;
  channelBadge.textContent = p.preview ? 'PREVIEW · view only' : (p.channel === 'release' ? 'RL · release' : 'B · beta');
  channelBadge.className = 'badge ' + (p.preview ? 'pre' : (p.channel === 'release' ? 'rl' : 'beta'));
  channelDesc.textContent = `code …_${p.token.slice(-4)} · stored locally only`;
  prePanel.hidden = false;
  renderPreAssets();
  renderStaged();
  if (typeof renderStagedLogs === 'function') renderStagedLogs();
  if (typeof renderPredlLinks === 'function') renderPredlLinks();
  return p;
}

function renderPreAssets() {
  const box = $('#pre-assets');
  if (!box) return;
  const code = localStorage.getItem(LS_INVITE) || '';
  const p = parseInvite(code);
  if (!p) { box.textContent = 'Unlock to view.'; return; }
  // Beta channel sees beta/prerelease + beta dlls; Release channel sees all dlls.
  const dlls = [];
  all.forEach((r) => {
    (r.assets || []).forEach((a) => {
      if (/\.dll$/i.test(a.name)) {
        if (p.channel === 'beta' && !r.prerelease && !/beta/i.test(a.name + r.tag_name)) return;
        dlls.push({ release: r.tag_name, ...a });
      }
    });
  });
  if (!dlls.length) { box.textContent = 'No DLLs in this channel yet.'; return; }
  box.innerHTML = `<table class="assets"><thead><tr><th>DLL</th><th>Release</th><th style="text-align:right">Size</th><th></th></tr></thead><tbody>` +
    dlls.map((d) => `<tr><td>${escapeHtml(d.name)}</td><td><code>${escapeHtml(d.release)}</code></td><td class="num">${fmtBytes(d.size)}</td><td><a href="${d.browser_download_url}">⬇</a></td></tr>`).join('') +
    `</tbody></table>`;
}

function getStaged() {
  try { return JSON.parse(localStorage.getItem(LS_STAGED) || '[]'); }
  catch { return []; }
}
function setStaged(list) {
  localStorage.setItem(LS_STAGED, JSON.stringify(list));
  renderStaged();
}

const stagedBlobs = new Map();
function downloadFile(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

function renderStaged() {
  const box = $('#staged-list');
  if (!box) return;
  const list = getStaged();
  box.innerHTML = list.length ? list.map((s, i) => `
    <div class="staged-item">
      <b>${escapeHtml(s.name)}</b> · ${fmtBytes(s.size)} · ${escapeHtml(s.channel)} · <code>${escapeHtml((s.sha256 || '').slice(0, 16))}…</code><br />
      <span class="status">${escapeHtml(s.notes || '')} · staged ${escapeHtml(s.stagedAt || '')} · code …_${escapeHtml((s.codeSuffix || '').slice(-4))}</span><br />
      <button class="btn" data-del="${i}">Remove</button>
      ${stagedBlobs.has(s.sha256) ? `<button class="btn" data-dl="${escapeHtml(s.sha256)}">⬇ Download</button>` : ''}
    </div>`).join('') : '<p class="status">Nothing staged yet. Pick a .dll/.exe/.jar above.</p>';
  box.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    const l = getStaged(); const [rm] = l.splice(Number(b.dataset.del), 1); if (rm?.sha256) stagedBlobs.delete(rm.sha256); setStaged(l); renderPredlLinks();
  }));
  box.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', () => {
    const sha = b.dataset.dl;
    const entry = getStaged().find((x) => x.sha256 === sha);
    const blob = stagedBlobs.get(sha);
    if (entry && blob) downloadFile(entry.name, blob);
  }));
}

async function sha256Hex(buf) {
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

$('#invite-unlock')?.addEventListener('click', () => setInvite(inviteInput.value));
$('#invite-lock')?.addEventListener('click', () => {
  localStorage.removeItem(LS_INVITE);
  inviteInput.value = '';
  inviteMsg.textContent = 'Locked.';
  prePanel.hidden = true;
});
inviteInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') setInvite(inviteInput.value); });

let pendingFiles = [];
const dropzone = $('#dropzone');
const fileInput = $('#dll-file');
const dzFile = $('#dz-file');

function setPending(files) {
  pendingFiles = [...(files || [])].filter((f) => /\.(dll|exe|jar)$/i.test(f.name)).slice(0, 10);
  if (dzFile) dzFile.textContent = pendingFiles.length
    ? pendingFiles.map((f) => `${f.name} (${fmtBytes(f.size)})`).join(' · ')
    : '';
}

dropzone?.addEventListener('click', (e) => {
  if (e.target.closest('#browse-btn') || e.target === dropzone || e.target.closest('.dz-icon')) fileInput?.click();
});
$('#browse-btn')?.addEventListener('click', (e) => { e.stopPropagation(); fileInput?.click(); });
dropzone?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); } });
fileInput?.addEventListener('change', () => setPending(fileInput.files));
['dragenter', 'dragover'].forEach((ev) => dropzone?.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((ev) => dropzone?.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone?.addEventListener('drop', (e) => {
  const files = e.dataTransfer?.files;
  if (files?.length) { setPending(files); $('#stage-msg').textContent = `${pendingFiles.length} file(s) ready — click Stage file(s).`; }
});

$('#stage-btn')?.addEventListener('click', async () => {
  const msg = $('#stage-msg');
  const code = localStorage.getItem(LS_INVITE) || '';
  const p = parseInvite(code);
  if (!p) { msg.textContent = 'Unlock with invite code first.'; return; }
  if (p.preview) { msg.textContent = 'Preview key — view only. Use a full RL/B key to stage files.'; return; }
  const files = pendingFiles.length ? pendingFiles : [...(fileInput?.files || [])];
  if (!files.length) { msg.textContent = 'Drag a .dll / .exe / .jar into the field or Select from desktop first.'; return; }
  const notes = $('#dll-notes').value.trim().slice(0, 200);
  const list = getStaged();
  for (const f of files) {
    if (!/\.(dll|exe|jar)$/i.test(f.name)) continue;
    if (f.size > 100 * 1024 * 1024) { msg.textContent = `${f.name}: too large (>100MB), skipped.`; continue; }
    msg.textContent = `Hashing ${f.name}…`;
    const buf = await f.arrayBuffer();
    const sha = await sha256Hex(buf);
    stagedBlobs.set(sha, f.slice(0, f.size, f.type || 'application/octet-stream'));
    list.unshift({ name: f.name, size: f.size, sha256: sha, channel: p.channel, codeSuffix: p.token.slice(-4), notes, stagedAt: new Date().toISOString() });
  }
  setStaged(list);
  renderPredlLinks();
  msg.textContent = `Staged ${files.length} file(s) — metadata kept locally; attach the real file(s) to a GitHub release to publish.`;
  pendingFiles = [];
  if (fileInput) fileInput.value = '';
  if (dzFile) dzFile.textContent = '';
  $('#dll-notes').value = '';
});

$('#export-json')?.addEventListener('click', async () => {
  const payload = { repo: 'SkidderiumX/InjectMyau-Unarchive', exportedAt: new Date().toISOString(), staged_dlls: getStaged(), staged_changelogs: getStagedLogs(), staged: getStaged() };
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
  $('#stage-msg').textContent = 'Staging JSON (DLLs + changelogs) copied to clipboard.';
});

$('#clear-staged')?.addEventListener('click', () => setStaged([]));

// ---- Channel B: changelogs upload (same invite key) ----
const LS_LOGS = 'imu_staged_logs';
let pendingLogs = [];
const dropzoneLog = $('#dropzone-log');
const logInput = $('#log-file');
const dzLogFile = $('#dz-log-file');

function getStagedLogs() {
  try { return JSON.parse(localStorage.getItem(LS_LOGS) || '[]'); }
  catch { return []; }
}
function setStagedLogs(list) {
  localStorage.setItem(LS_LOGS, JSON.stringify(list));
  renderStagedLogs();
  if (typeof renderPredlLinks === 'function') renderPredlLinks();
}
function renderStagedLogs() {
  const box = $('#staged-logs');
  if (!box) return;
  const list = getStagedLogs();
  box.innerHTML = list.length ? list.map((s, i) => `
    <div class="staged-item">
      <b>${escapeHtml(s.version || s.name)}</b> · ${escapeHtml(s.name)} · ${fmtBytes(s.size)} · ${escapeHtml(s.channel)}<br />
      <pre class="notes">${escapeHtml((s.body || '').slice(0, 500))}</pre>
      <span class="status">${escapeHtml(s.notes || '')} · staged ${escapeHtml(s.stagedAt || '')} · code …_${escapeHtml((s.codeSuffix || '').slice(-4))}</span><br />
      <button class="btn" data-dellog="${i}">Remove</button>
    </div>`).join('') : '<p class="status">Nothing staged yet. Drop a .md / .txt changelog above.</p>';
  box.querySelectorAll('[data-dellog]').forEach((b) => b.addEventListener('click', () => {
    const l = getStagedLogs(); l.splice(Number(b.dataset.dellog), 1); setStagedLogs(l);
  }));
}
function setPendingLogs(files) {
  pendingLogs = [...(files || [])].filter((f) => /\.(md|txt|json)$/i.test(f.name)).slice(0, 10);
  if (dzLogFile) dzLogFile.textContent = pendingLogs.length
    ? pendingLogs.map((f) => `${f.name} (${fmtBytes(f.size)})`).join(' · ')
    : '';
}
dropzoneLog?.addEventListener('click', (e) => {
  if (e.target.closest('#browse-log-btn') || e.target === dropzoneLog || e.target.closest('.dz-icon')) logInput?.click();
});
$('#browse-log-btn')?.addEventListener('click', (e) => { e.stopPropagation(); logInput?.click(); });
dropzoneLog?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logInput?.click(); } });
logInput?.addEventListener('change', () => setPendingLogs(logInput.files));
['dragenter', 'dragover'].forEach((ev) => dropzoneLog?.addEventListener(ev, (e) => { e.preventDefault(); dropzoneLog.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((ev) => dropzoneLog?.addEventListener(ev, (e) => { e.preventDefault(); dropzoneLog.classList.remove('dragover'); }));
dropzoneLog?.addEventListener('drop', (e) => {
  const files = e.dataTransfer?.files;
  if (files?.length) { setPendingLogs(files); $('#log-msg').textContent = `${pendingLogs.length} changelog(s) ready — click Stage changelog(s).`; }
});
$('#stage-log-btn')?.addEventListener('click', async () => {
  const msg = $('#log-msg');
  const code = localStorage.getItem(LS_INVITE) || '';
  const p = parseInvite(code);
  if (!p) { msg.textContent = 'Unlock with invite code first.'; return; }
  if (p.preview) { msg.textContent = 'Preview key — view only. Use a full RL/B key to stage changelogs.'; return; }
  const files = pendingLogs.length ? pendingLogs : [...(logInput?.files || [])];
  if (!files.length) { msg.textContent = 'Drag a .md / .txt changelog into the field or Select from desktop first.'; return; }
  const version = $('#log-version').value.trim().slice(0, 80);
  const notes = $('#log-notes').value.trim().slice(0, 200);
  const list = getStagedLogs();
  for (const f of files) {
    if (f.size > 2 * 1024 * 1024) { msg.textContent = `${f.name}: too large (>2MB), skipped.`; continue; }
    const text = await f.text();
    const buf = new TextEncoder().encode(text).buffer;
    const sha = await sha256Hex(buf);
    list.unshift({ name: f.name, size: f.size, sha256: sha, channel: p.channel, codeSuffix: p.token.slice(-4), version: version || f.name.replace(/\.(md|txt|json)$/i, ''), notes, body: text.slice(0, 5000), stagedAt: new Date().toISOString() });
  }
  setStagedLogs(list);
  msg.textContent = `Staged ${files.length} changelog(s) — copy staging JSON to publish.`;
  pendingLogs = [];
  if (logInput) logInput.value = '';
  if (dzLogFile) dzLogFile.textContent = '';
});
$('#clear-logs')?.addEventListener('click', () => { setStagedLogs([]); renderPredlLinks(); });

// ---- Pre-download: downloadable link built from pre-posting ----
function channelDllLinks() {
  const code = localStorage.getItem(LS_INVITE) || '';
  const p = parseInvite(code);
  if (!p) return [];
  const out = [];
  all.forEach((r) => {
    (r.assets || []).forEach((a) => {
      if (/\.dll$/i.test(a.name)) {
        if (p.channel === 'beta' && !r.prerelease && !/beta/i.test(a.name + r.tag_name)) return;
        out.push({ file: a.name, release: r.tag_name, url: a.browser_download_url, size: a.size });
      }
    });
  });
  return out;
}
function buildPreBundle() {
  const code = localStorage.getItem(LS_INVITE) || '';
  const p = parseInvite(code);
  return {
    repo: 'SkidderiumX/InjectMyau-Unarchive',
    exportedAt: new Date().toISOString(),
    channel: p?.preview ? 'preview' : (p?.channel || null),
    preview: !!p?.preview,
    staged_dlls: getStaged(),
    staged_changelogs: getStagedLogs(),
    channel_dll_links: channelDllLinks(),
  };
}
function renderPredlLinks() {
  const box = $('#predl-links');
  const msg = $('#predl-msg');
  if (!box) return;
  const code = localStorage.getItem(LS_INVITE) || '';
  const p = parseInvite(code);
  if (!p) { box.innerHTML = ''; if (msg) msg.textContent = 'Unlock with invite code to build pre-downloads.'; return; }
  const dlls = getStaged();
  const logs = getStagedLogs();
  const links = channelDllLinks();
  const sessionFiles = dlls.filter((d) => stagedBlobs.has(d.sha256));
  box.innerHTML =
    (sessionFiles.map((d) => `<div class="staged-item"><b>${escapeHtml(d.name)}</b> · session file · ${fmtBytes(d.size)}<br /><button class="btn" data-predl="${escapeHtml(d.sha256)}">⬇ Download file</button></div>`).join('') +
    links.slice(0, 10).map((l) => `<div class="staged-item"><b>${escapeHtml(l.file)}</b> · <code>${escapeHtml(l.release)}</code><br /><a class="btn" href="${l.url}">⬇ ${escapeHtml(l.file)}</a></div>`).join('') +
    (logs.length ? `<div class="staged-item"><b>Changelogs bundle</b> · ${logs.length} entries<br /><button class="btn" id="predl-md-inline">⬇ Download .md</button></div>` : '')) ||
    '<p class="status">Nothing downloadable yet — stage DLLs/changelogs above.</p>';
  if (msg) msg.textContent = p.preview
    ? `Preview: ${links.length} channel DLL link(s). Staging disabled.`
    : `${sessionFiles.length} session file(s) · ${dlls.length} staged DLL(s) · ${logs.length} changelog(s) · ${links.length} channel link(s).`;
  box.querySelectorAll('[data-predl]').forEach((b) => b.addEventListener('click', () => {
    const e = getStaged().find((x) => x.sha256 === b.dataset.predl);
    const blob = stagedBlobs.get(b.dataset.predl);
    if (e && blob) downloadFile(e.name, blob);
  }));
  $('#predl-md-inline')?.addEventListener('click', () => $('#dl-logs-md')?.click());
}
$('#dl-bundle')?.addEventListener('click', () => {
  const msg = $('#predl-msg');
  const p = parseInvite(localStorage.getItem(LS_INVITE) || '');
  if (!p) { msg.textContent = 'Unlock with invite code first.'; return; }
  downloadFile('pre-bundle.json', new Blob([JSON.stringify(buildPreBundle(), null, 2)], { type: 'application/json' }));
  msg.textContent = 'Pre-bundle .json downloaded (DLLs + changelogs + channel links).';
});
$('#dl-logs-md')?.addEventListener('click', () => {
  const msg = $('#predl-msg');
  const p = parseInvite(localStorage.getItem(LS_INVITE) || '');
  if (!p) { msg.textContent = 'Unlock with invite code first.'; return; }
  const logs = getStagedLogs();
  if (!logs.length) { msg.textContent = 'No staged changelogs to download.'; return; }
  const md = `# Pre-posting changelogs — ${new Date().toISOString()}\n\n` + logs.map((l) => `## ${l.version || l.name}\n\n${l.body || ''}\n\n_${l.notes || ''} · ${l.channel} · ${l.stagedAt}_\n`).join('\n---\n\n');
  downloadFile('pre-changelogs.md', new Blob([md], { type: 'text/markdown' }));
  msg.textContent = `Changelogs .md downloaded (${logs.length}).`;
});
$('#copy-pre-link')?.addEventListener('click', async () => {
  const msg = $('#predl-msg');
  const p = parseInvite(localStorage.getItem(LS_INVITE) || '');
  if (!p) { msg.textContent = 'Unlock with invite code first.'; return; }
  const b = buildPreBundle();
  const link = `${location.origin}${location.pathname}#pre-channel`;
  const text = `${link}\nchannel=${b.channel}${b.preview ? ' (preview)' : ''} · dlls=${b.staged_dlls.length} · changelogs=${b.staged_changelogs.length} · links=${b.channel_dll_links.length} · exported=${b.exportedAt}`;
  await navigator.clipboard.writeText(text).catch(() => {});
  msg.textContent = 'Pre link copied (channel + counts, no secret key included).';
});
$('#pre-dl-btn')?.addEventListener('click', () => { setTimeout(renderPredlLinks, 50); });

// ---- ACKEY.md vault: save / load all saved keys ----
const LS_KEYS = 'imu_saved_keys';
const ACKEY_RE = /IMU_AC_(?:RL|B)_[A-Za-z0-9]{12,32}/g;

function getSavedKeys() {
  try { return JSON.parse(localStorage.getItem(LS_KEYS) || '[]'); }
  catch { return []; }
}
function setSavedKeys(list) {
  localStorage.setItem(LS_KEYS, JSON.stringify(list));
  renderSavedKeys();
}
function renderSavedKeys() {
  const box = $('#saved-keys');
  if (!box) return;
  const list = getSavedKeys();
  box.innerHTML = list.length ? list.map((k, i) => {
    const p = parseInvite(k.code);
    const ch = !p ? 'invalid' : (p.preview ? 'preview' : p.channel);
    return `<div class="staged-item"><b>${escapeHtml(k.label || ch)}</b> · <code>${escapeHtml(k.code)}</code> · ${escapeHtml(ch)}<br />
      <span class="status">${escapeHtml(k.savedAt || '')}</span><br />
      <button class="btn" data-use="${i}">Use</button> <button class="btn" data-delkey="${i}">Delete</button></div>`;
  }).join('') : '<p class="status">No saved keys yet.</p>';
  box.querySelectorAll('[data-use]').forEach((b) => b.addEventListener('click', () => {
    const k = getSavedKeys()[Number(b.dataset.use)];
    if (k) { inviteInput.value = k.code; setInvite(k.code); }
  }));
  box.querySelectorAll('[data-delkey]').forEach((b) => b.addEventListener('click', () => {
    const l = getSavedKeys(); l.splice(Number(b.dataset.delkey), 1); setSavedKeys(l);
  }));
}

function buildACKEYmd() {
  const rows = getSavedKeys().map((k) => {
    const p = parseInvite(k.code);
    const ch = !p ? 'invalid' : (p.preview ? 'release (preview)' : p.channel);
    return `| ${k.label || ch} | \`${k.code}\` | ${ch} | ${k.savedAt || ''} |`;
  }).join('\n');
  return `# ACKEY.md — InjectMyau Pre-posting Invite Keys\n\n> Exported ${new Date().toISOString()}. Keep private — do not commit real keys publicly.\n\n## Format\n\n\`\`\`\nIMU_AC_<RL|B>_<alphanum 12..32>\n\`\`\`\n\nPreview (view-only): \`IMU_AC_RL_PREVIEWKEYAC1\`\n\n## Saved keys\n\n| Label | Code | Channel | SavedAt |\n|-------|------|---------|---------|\n${rows || '| preview | `IMU_AC_RL_PREVIEWKEYAC1` | release (preview) | — |'}\n`;
}

$('#save-key')?.addEventListener('click', () => {
  const msg = $('#ackey-msg');
  const code = (inviteInput.value || localStorage.getItem(LS_INVITE) || '').trim();
  const p = parseInvite(code);
  if (!p) { msg.textContent = 'No valid key in invite box to save.'; return; }
  const list = getSavedKeys();
  if (list.some((k) => k.code === code)) { msg.textContent = 'Key already saved.'; return; }
  list.unshift({ code, label: p.preview ? 'preview' : p.channel, savedAt: new Date().toISOString() });
  setSavedKeys(list);
  msg.textContent = `Saved ${p.preview ? 'preview' : p.channel} key …_${p.token.slice(-4)}.`;
});

$('#export-ackey')?.addEventListener('click', async () => {
  const md = buildACKEYmd();
  await navigator.clipboard.writeText(md).catch(() => {});
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ACKEY.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  $('#ackey-msg').textContent = 'ACKEY.md exported (download + clipboard).';
});

$('#import-ackey-btn')?.addEventListener('click', () => $('#import-ackey')?.click());
$('#import-ackey')?.addEventListener('change', async (e) => {
  const msg = $('#ackey-msg');
  const f = e.target.files?.[0];
  if (!f) return;
  const text = await f.text();
  const found = [...new Set(text.match(ACKEY_RE) || [])];
  if (!found.length) { msg.textContent = 'No IMU_AC_ keys found in file.'; return; }
  const list = getSavedKeys();
  let added = 0;
  for (const code of found) {
    if (!list.some((k) => k.code === code)) {
      const p = parseInvite(code);
      list.push({ code, label: p?.preview ? 'preview' : (p?.channel || 'imported'), savedAt: new Date().toISOString() });
      added++;
    }
  }
  setSavedKeys(list);
  msg.textContent = `Loaded ${added} new / ${found.length} found from ${f.name}.`;
  e.target.value = '';
});

// restore session + hook channel dlls into main render
(function initPre() {
  const saved = localStorage.getItem(LS_INVITE) || '';
  if (saved) { inviteInput.value = saved; setInvite(saved, false); }
  renderSavedKeys();
  renderStaged();
  renderStagedLogs();
  if (typeof renderPredlLinks === 'function') renderPredlLinks();
  const origRender = render;
  render = function (...a) { origRender(...a); renderPreAssets(); };
})();

load(true);
