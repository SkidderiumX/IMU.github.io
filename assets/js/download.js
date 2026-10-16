/* Shared logic for /beta, /betachangelog, /release, /releasechangelog.
 * Lists files from a drop folder in the Pages repo and downloads them.
 * Configure via <body data-*> attributes on each route page.
 * No emoji in UI strings.
 */
(function () {
  'use strict';

  var body = document.body;
  var REPO = body.getAttribute('data-repo') || 'SkidderiumX/IMU.github.io';
  var DIR = body.getAttribute('data-dir') || 'beta/dll';
  var KIND = body.getAttribute('data-kind') || 'dll'; // 'dll' | 'changelog'
  var LOCAL_BASE = body.getAttribute('data-local-base') || 'dll/';
  var MANIFEST_URL = body.getAttribute('data-manifest') || 'dll/manifest.json';
  var AUTO = body.getAttribute('data-auto') === '1';

  var statusEl = document.getElementById('status');
  var listEl = document.getElementById('file-list');
  var cancelBtn = document.getElementById('cancel-auto');

  var SKIP = { '.gitkeep': 1, 'readme.md': 1, 'manifest.json': 1 };
  var DLL_EXT = /\.(dll|exe|jar)$/i;
  var LOG_EXT = /\.(txt|md)$/i;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function fmtBytes(n) {
    if (n === null || n === undefined) return 'size unknown';
    var u = ['B', 'KB', 'MB', 'GB'];
    var i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (n >= 100 ? Math.round(n) : n.toFixed(1)) + ' ' + u[i];
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function keepFile(name) {
    if (!name || SKIP[name.toLowerCase()]) return false;
    return KIND === 'dll' ? DLL_EXT.test(name) : LOG_EXT.test(name);
  }

  function fromApi(items) {
    return items
      .filter(function (it) { return it && it.type === 'file' && keepFile(it.name); })
      .map(function (it) {
        return { name: it.name, size: it.size, url: it.download_url || it.html_url };
      });
  }

  function fromManifest(names) {
    return (names || [])
      .filter(keepFile)
      .map(function (name) {
        return { name: name, size: null, url: LOCAL_BASE + encodeURIComponent(name) };
      });
  }

  async function loadFiles() {
    // 1. GitHub Contents API (automatic: any uploaded file appears, no manifest edit needed).
    try {
      var res = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + DIR, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (res.ok) {
        var items = await res.json();
        var files = fromApi(Array.isArray(items) ? items : []);
        if (files.length) return { files: files, source: 'repository listing' };
      }
    } catch (e) { /* fall through to manifest */ }

    // 2. Local manifest fallback (DLL folders only; changelog folders have no
    //    manifest - any .txt name works via the repository listing above).
    if (KIND === 'dll') {
      try {
        var mres = await fetch(MANIFEST_URL, { cache: 'no-store' });
        if (mres.ok) {
          var manifest = await mres.json();
          var mfiles = fromManifest(manifest && manifest.files);
          return { files: mfiles, source: 'manifest.json' };
        }
      } catch (e) { /* fall through */ }
    }

    return { files: [], source: 'none' };
  }

  function renderList(files) {
    if (!listEl) return;
    if (!files.length) {
      listEl.innerHTML = '<p class="status">No files published yet. Upload to the ' +
        esc(DIR) + '/ folder in the site repository.</p>';
      return;
    }
    listEl.innerHTML = files.map(function (f) {
      return '<div class="staged-item"><b>' + esc(f.name) + '</b> · ' + esc(fmtBytes(f.size)) +
        '<br /><a class="btn" href="' + esc(f.url) + '" download>Download ' + esc(f.name) + '</a></div>';
    }).join('');
  }

  async function renderPreviews(files) {
    var prev = document.getElementById('preview');
    if (!prev || KIND !== 'changelog') return;
    if (!files.length) { prev.innerHTML = ''; return; }
    var first = files[0];
    try {
      var res = await fetch(first.url, { cache: 'no-store' });
      var text = res.ok ? await res.text() : '';
      prev.innerHTML = '<h2>Latest: ' + esc(first.name) + '</h2><pre class="notes">' +
        esc(text.slice(0, 8000) || '(empty file)') + '</pre>' +
        '<p><a class="btn" href="' + esc(first.url) + '" download>Download ' + esc(first.name) + '</a></p>';
    } catch (e) {
      prev.innerHTML = '';
    }
  }

  function autoDownload(files) {
    if (!AUTO || !files.length) return;
    var cancelled = false;
    if (cancelBtn) {
      cancelBtn.hidden = false;
      cancelBtn.addEventListener('click', function () {
        cancelled = true;
        cancelBtn.hidden = true;
        setStatus('Automatic download cancelled. Use a Download button below.');
      });
    }
    setStatus('Starting download of ' + files[0].name + ' in 3 seconds...');
    setTimeout(function () {
      if (cancelled) return;
      var a = document.createElement('a');
      a.href = files[0].url;
      a.download = files[0].name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); }, 2000);
      setStatus('Download started: ' + files[0].name + ' (' + files.length + ' file(s) total).');
    }, 3000);
  }

  async function init() {
    setStatus('Loading file list...');
    var result = await loadFiles();
    if (!result.files.length) {
      setStatus('No files found (checked ' + result.source + ').');
    } else {
      setStatus(result.files.length + ' file(s) via ' + result.source + '.');
    }
    renderList(result.files);
    await renderPreviews(result.files);
    autoDownload(result.files);
  }

  var navToggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.links');
  if (navToggle && links) {
    navToggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  init();
})();
