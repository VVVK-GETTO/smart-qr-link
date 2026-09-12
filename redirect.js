const $ = id => document.getElementById(id);
const MIN_LOADER_MS = 900; // keep the loader visible long enough to feel intentional, not flicker

function show(stage) {
  ['loading', 'choose', 'error'].forEach(s => { $(s).hidden = s !== stage; });
}

// Generate/remember a browserId for unique devices
function getBrowserId() {
  try {
    let id = localStorage.getItem('smartlink_browser_id');
    if (!id) {
      id = 'bid_' + Math.random().toString(36).substr(2, 10) + Date.now();
      localStorage.setItem('smartlink_browser_id', id);
    }
    return id;
  } catch { return 'bid_anon'; }
}

function detectDevice() {
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  // iPadOS 13+ reports as Mac; touch support gives it away
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  return 'other';
}

const id = new URLSearchParams(location.search).get('id');
const browserId = getBrowserId();
const device = detectDevice();
const startedAt = Date.now();

function afterMinDelay(fn) {
  setTimeout(fn, Math.max(0, MIN_LOADER_MS - (Date.now() - startedAt)));
}

if (!id) {
  $('errorTitle').textContent = 'Invalid link';
  $('errorText').textContent = 'This URL is missing a link id.';
  show('error');
} else {
  db.ref('links/' + id).once('value').then(snap => {
    const link = snap.val();
    if (!link) { show('error'); return; }

    const type = link.type || 'app';
    const inc = firebase.database.ServerValue.increment(1);
    const updates = { scans: inc };
    if (type === 'app' && device === 'android') updates.androidRedirects = inc;
    if (type === 'app' && device === 'ios') updates.iosRedirects = inc;
    // Unique devices: app links only care about mobile; web links track everything
    if (type === 'web' || device !== 'other') updates['uniqueDevices/' + browserId] = device;

    const tracked = db.ref('links/' + id).update(updates).catch(() => {});

    let target = null;
    if (type === 'web') target = link.url;
    else if (device === 'android') target = link.android;
    else if (device === 'ios') target = link.ios;

    if (target) {
      $('loadingText').textContent = type === 'web' ? 'Opening the page' : (device === 'ios' ? 'Opening the App Store' : 'Opening Google Play');
      tracked.then(() => afterMinDelay(() => { location.replace(target); }));
    } else {
      // App link on desktop/unknown device → let them choose
      $('chooseTitle').textContent = link.name ? 'Get ' + link.name : 'Get the app';
      $('iosBtn').href = link.ios || '#';
      $('androidBtn').href = link.android || '#';
      afterMinDelay(() => show('choose'));
    }
  }).catch(() => {
    $('errorTitle').textContent = 'Something went wrong';
    $('errorText').textContent = 'Please check your connection and try again.';
    show('error');
  });
}
