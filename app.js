// Works both locally and on GitHub Pages: derive base from wherever index.html is served
const BASE_URL = location.origin + location.pathname.replace(/[^/]*$/, '');

const $ = id => document.getElementById(id);
let activeTab = 'app';          // 'app' | 'web'
let allLinks = [];              // latest snapshot from Firebase
let pendingDeleteId = null;

/* ---------- helpers ---------- */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function generateId() {
  return 'sl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}
function shareUrlFor(id) {
  return BASE_URL + 'redirect.html?id=' + encodeURIComponent(id);
}
function makeQr(value, size) {
  // Always plain black on white so it scans reliably and prints cleanly
  return new QRious({ value, size, background: '#ffffff', foreground: '#000000', level: 'M', padding: Math.round(size * 0.06) });
}
function safeFileName(name) {
  return (name || 'qr').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'qr';
}
let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
function copyText(text) {
  const done = () => toast('Link copied to clipboard');
  if (navigator.clipboard) return navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const t = document.createElement('textarea');
  t.style.position = 'fixed'; t.style.opacity = '0';
  t.value = text;
  document.body.appendChild(t);
  t.select();
  try { document.execCommand('copy'); done(); } catch { toast('Copy failed'); }
  document.body.removeChild(t);
}
function openModal(id) { $(id).hidden = false; }
function closeModal(id) { $(id).hidden = true; }

/* ---------- tabs ---------- */
const COPY = {
  app: {
    title: 'Create a dynamic app link',
    hint: 'One link & QR that sends Android users to Play Store and iPhone users to the App Store.',
    list: 'Your app links'
  },
  web: {
    title: 'Create a web QR',
    hint: 'A trackable short link & QR for any website URL. Change the destination anytime — the QR stays the same.',
    list: 'Your web QRs'
  }
};
function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.seg-btn').forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on);
  });
  $('createTitle').textContent = COPY[tab].title;
  $('createHint').textContent = COPY[tab].hint;
  $('listTitle').textContent = COPY[tab].list;
  $('appFields').hidden = tab !== 'app';
  $('webFields').hidden = tab !== 'web';
  $('iosUrl').required = $('androidUrl').required = tab === 'app';
  $('webUrl').required = tab === 'web';
  renderLinks();
}
document.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

/* ---------- data ---------- */
db.ref('links').on('value', snap => {
  const val = snap.val() || {};
  allLinks = Object.keys(val)
    .map(k => ({ ...val[k], id: k, type: val[k].type || 'app' }))  // legacy links have no type → app
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  renderLinks();
});

/* ---------- render ---------- */
function renderLinks() {
  const list = $('linkList');
  const links = allLinks.filter(l => l.type === activeTab);
  $('listCount').textContent = links.length;
  $('emptyState').hidden = links.length > 0;
  list.innerHTML = '';

  links.forEach(link => {
    const shareUrl = shareUrlFor(link.id);
    const uniq = link.uniqueDevices ? Object.values(link.uniqueDevices) : [];
    const isApp = link.type === 'app';

    const dest = isApp
      ? `<a class="dest-chip" href="${esc(link.ios)}" target="_blank" rel="noopener"><b>iOS</b><span>${esc(link.ios)}</span></a>
         <a class="dest-chip" href="${esc(link.android)}" target="_blank" rel="noopener"><b>Android</b><span>${esc(link.android)}</span></a>`
      : `<a class="dest-chip" href="${esc(link.url)}" target="_blank" rel="noopener"><b>Opens</b><span>${esc(link.url)}</span></a>`;

    const stats = isApp
      ? `<div class="stat hl"><b>${link.scans || 0}</b><span>Total scans</span></div>
         <div class="stat"><b>${link.androidRedirects || 0}</b><span>Android</span></div>
         <div class="stat"><b>${link.iosRedirects || 0}</b><span>iOS</span></div>
         <div class="stat"><b>${uniq.length}</b><span>Unique devices</span></div>
         <div class="stat"><b>${uniq.filter(v => v === 'android').length}</b><span>Unique Android</span></div>
         <div class="stat"><b>${uniq.filter(v => v === 'ios').length}</b><span>Unique iOS</span></div>`
      : `<div class="stat hl"><b>${link.scans || 0}</b><span>Total scans</span></div>
         <div class="stat"><b>${uniq.length}</b><span>Unique devices</span></div>
         <div class="stat"><b>${uniq.filter(v => v === 'android').length}</b><span>Android</span></div>
         <div class="stat"><b>${uniq.filter(v => v === 'ios').length}</b><span>iOS</span></div>
         <div class="stat"><b>${uniq.filter(v => v === 'other').length}</b><span>Desktop / other</span></div>`;

    const card = document.createElement('article');
    card.className = 'card link-card';
    card.innerHTML = `
      <div class="qr-box">
        <img alt="QR code for ${esc(link.name)}">
        <button class="btn btn-ghost btn-sm" data-act="download" data-id="${esc(link.id)}">
          <svg viewBox="0 0 24 24"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>Download
        </button>
      </div>
      <div class="link-body">
        <div class="link-top">
          <div class="link-name">
            <h3 title="${esc(link.name)}">${esc(link.name)}</h3>
            <span class="type-badge">${isApp ? 'App' : 'Web'}</span>
          </div>
          <div class="link-actions">
            <button class="btn-icon" title="Edit" data-act="edit" data-id="${esc(link.id)}">
              <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
            </button>
            <button class="btn-icon danger" title="Delete" data-act="delete" data-id="${esc(link.id)}">
              <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v7M14 10v7"/></svg>
            </button>
          </div>
        </div>
        <div class="short-row">
          <a href="${esc(shareUrl)}" target="_blank" rel="noopener">${esc(shareUrl)}</a>
          <button class="btn btn-sm" data-act="copy" data-url="${esc(shareUrl)}">
            <svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>Copy
          </button>
        </div>
        <div class="dest-row">${dest}</div>
        <div class="stats">${stats}</div>
      </div>`;
    card.querySelector('.qr-box img').src = makeQr(shareUrl, 224).toDataURL();
    list.appendChild(card);
  });
}

/* ---------- create ---------- */
$('createForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('linkName').value.trim();
  const base = { id: generateId(), name, type: activeTab, createdAt: Date.now(), scans: 0, uniqueDevices: {} };
  const link = activeTab === 'app'
    ? { ...base, ios: $('iosUrl').value.trim(), android: $('androidUrl').value.trim(), androidRedirects: 0, iosRedirects: 0 }
    : { ...base, url: $('webUrl').value.trim() };

  const btn = $('createBtn');
  btn.disabled = true;
  db.ref('links/' + link.id).set(link)
    .then(() => { e.target.reset(); toast('Link created'); })
    .catch(() => toast('Could not save link'))
    .finally(() => { btn.disabled = false; });
});

/* ---------- card actions ---------- */
$('linkList').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const { act, id, url } = btn.dataset;
  const link = allLinks.find(l => l.id === id);

  if (act === 'copy') copyText(url);

  if (act === 'download' && link) {
    const a = document.createElement('a');
    a.href = makeQr(shareUrlFor(link.id), 1024).toDataURL('image/png');
    a.download = safeFileName(link.name) + '-qr.png';
    document.body.appendChild(a); a.click(); a.remove();
  }

  if (act === 'edit' && link) {
    $('editId').value = link.id;
    $('editName').value = link.name || '';
    $('editAppFields').hidden = link.type !== 'app';
    $('editWebFields').hidden = link.type !== 'web';
    $('editIos').required = $('editAndroid').required = link.type === 'app';
    $('editWeb').required = link.type === 'web';
    $('editIos').value = link.ios || '';
    $('editAndroid').value = link.android || '';
    $('editWeb').value = link.url || '';
    openModal('editModal');
    $('editName').focus();
  }

  if (act === 'delete' && link) {
    pendingDeleteId = link.id;
    $('deleteText').innerHTML = `<b>${esc(link.name)}</b> will be removed. Its QR code and short link will stop working immediately. This can't be undone.`;
    openModal('deleteModal');
  }
});

/* ---------- edit ---------- */
$('editForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('editId').value;
  const link = allLinks.find(l => l.id === id);
  if (!link) return;
  const patch = { name: $('editName').value.trim() };
  if (link.type === 'app') { patch.ios = $('editIos').value.trim(); patch.android = $('editAndroid').value.trim(); }
  else { patch.url = $('editWeb').value.trim(); }
  db.ref('links/' + id).update(patch)
    .then(() => { closeModal('editModal'); toast('Changes saved'); })
    .catch(() => toast('Could not save changes'));
});

/* ---------- delete ---------- */
$('confirmDeleteBtn').addEventListener('click', () => {
  if (!pendingDeleteId) return;
  db.ref('links/' + pendingDeleteId).remove()
    .then(() => toast('Link deleted'))
    .catch(() => toast('Could not delete link'));
  pendingDeleteId = null;
  closeModal('deleteModal');
});

/* ---------- modal close (cancel / backdrop / Esc) ---------- */
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('[data-close]')) { ov.hidden = true; pendingDeleteId = null; }
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(ov => { ov.hidden = true; });
});

setTab('app');
