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

function getQuery(param) {
  return new URLSearchParams(window.location.search).get(param);
}

const id = getQuery('id');
if (!id) {
  document.getElementById('message').innerText = 'Invalid link!';
} else {
  db.ref('links/' + id).once('value', snap => {
    const link = snap.val();
    if (!link) {
      document.getElementById('message').innerText = 'Link not found or deleted!';
    } else {
      // Increment click count and update
      db.ref('links/' + id + '/clicks').set((link.clicks || 0) + 1);
      setTimeout(() => {
        const ua = navigator.userAgent || navigator.vendor;
        if (/android/i.test(ua)) window.location.href = link.android;
        else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) window.location.href = link.ios;
        else document.getElementById('message').innerHTML =
          '<b>This device is not recognized as Android or iOS.<br>' +
          'Use these links:</b><br>' +
          '<a href="' + link.ios + '">iOS App Store</a> &bull; <a href="' + link.android + '">Google Play Store</a>';
      }, 1500);
    }
  });
}
