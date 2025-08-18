const firebaseConfig = {
 apiKey: "AIzaSyCHDfcLYGqDwUY0tuDQTiQpmP3n0EsORJU",
 authDomain: "fir-test-project-7b84e.firebaseapp.com",
 databaseURL: "https://fir-test-project-7b84e-default-rtdb.firebaseio.com",
 projectId: "fir-test-project-7b84e",
 storageBucket: "fir-test-project-7b84e.firebasestorage.app",
 messagingSenderId: "593405735328",
 appId: "1:593405735328:web:364d3f999efb2be43034c5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Generate/remember a browserId for unique devices
function getBrowserId() {
  let id = localStorage.getItem('smartlink_browser_id');
  if (!id) {
    id = 'bid_' + Math.random().toString(36).substr(2,10) + Date.now();
    localStorage.setItem('smartlink_browser_id', id);
  }
  return id;
}

function getQuery(param) {
  return new URLSearchParams(window.location.search).get(param);
}
const id = getQuery('id');
const browserId = getBrowserId();

if (!id) {
  document.getElementById('message').innerText = 'Invalid link!';
} else {
  db.ref('links/' + id).once('value', snap => {
    const link = snap.val();
    if (!link) {
      document.getElementById('message').innerText = 'Link not found or deleted!';
    } else {
      // Track total scans
      db.ref('links/' + id + '/scans').set((link.scans || 0) + 1);
      setTimeout(() => {
        const ua = navigator.userAgent || navigator.vendor;
        let deviceType = '';
        if (/android/i.test(ua)) {
          deviceType = 'android';
          db.ref('links/' + id + '/androidRedirects').set((link.androidRedirects || 0) + 1);
        } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
          deviceType = 'ios';
          db.ref('links/' + id + '/iosRedirects').set((link.iosRedirects || 0) + 1);
        } else { deviceType = 'other'; }

        // Mark uniqueDevices
        if (deviceType === "android" || deviceType === "ios") {
          db.ref('links/' + id + '/uniqueDevices/' + browserId).set(deviceType);
        }

        if (deviceType === 'android') window.location.href = link.android;
        else if (deviceType === 'ios') window.location.href = link.ios;
        else document.getElementById('message').innerHTML =
          '<b>Device not recognized as Android or iOS.<br>' +
          'Use these links:</b><br>' +
          '<a href="' + link.ios + '">iOS App Store</a> &bull; <a href="' + link.android + '">Google Play Store</a>';
      }, 1500);
    }
  });
}
