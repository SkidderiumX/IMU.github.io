/* IMU-Web homepage: last GitHub release box. No emoji in UI strings. */
(function () {
  'use strict';

  var API_LATEST = 'https://api.github.com/repos/SkidderiumX/InjectMyau-Unarchive/releases/latest';
  var FALLBACK = './releases.json';

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

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return iso; }
  }

  function renderRelease(box, rel, source) {
    var srcEl = document.getElementById('release-source');
    if (srcEl) srcEl.textContent = '· ' + source;
    if (!rel) {
      box.innerHTML = '<p class="status">No releases found.</p>';
      return;
    }
    var assets = (rel.assets || []).map(function (a) {
      return '<tr><td><a href="' + esc(a.browser_download_url) + '">' + esc(a.name) +
        '</a></td><td class="num">' + esc(a.download_count == null ? 0 : a.download_count) + '</td></tr>';
    }).join('');
    box.innerHTML =
      '<div class="card-head"><h3>' + esc(rel.name || rel.tag_name) + '</h3>' +
      ' <span class="tag">' + esc(rel.tag_name) + '</span>' +
      ' <span class="date">' + esc(fmtDate(rel.published_at)) + '</span></div>' +
      (rel.body ? '<pre class="notes">' + esc(String(rel.body).slice(0, 1200)) + '</pre>' : '') +
      (assets ? '<table class="assets"><thead><tr><th>Asset</th><th style="text-align:right">Downloads</th></tr></thead><tbody>' +
        assets + '</tbody></table>' : '<p class="status">No attached files.</p>') +
      '<div class="card-foot"><a href="' + esc(rel.html_url) + '">View on GitHub</a></div>';
  }

  async function init() {
    var box = document.getElementById('last-release-box');
    if (!box) return;
    try {
      var res = await fetch(API_LATEST, { headers: { Accept: 'application/vnd.github+json' } });
      if (res.ok) {
        renderRelease(box, await res.json(), 'live');
        return;
      }
    } catch (e) { /* fall through */ }
    try {
      var fres = await fetch(FALLBACK, { cache: 'no-store' });
      var data = await fres.json();
      renderRelease(box, Array.isArray(data) ? data[0] : data, 'offline snapshot');
    } catch (e) {
      box.innerHTML = '<p class="status">Could not load release data.</p>';
    }
  }

  init();
})();
