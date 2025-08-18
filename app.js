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

const BASE_URL = "https://vvvk-getto.github.io/smart-qr-link/"; 
function generateId() {
  return 'sl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

function getLinks(callback) {
  db.ref('links').once('value', snap => {
    const val = snap.val() || {};
    const arr = Object.keys(val).map(k => ({ id: k, ...val[k] }));
    callback(arr);
  });
}
function saveLink(link, callback) {
  db.ref('links/' + link.id).set(link, callback);
}
function deleteLink(id, callback) {
  db.ref('links/' + id).remove(callback);
}

function renderLinks() {
  getLinks(function(links) {
    const tbody = document.getElementById('linksTableBody');
    tbody.innerHTML = '';
    links.forEach(link => {
      const shareUrl = `${BASE_URL}/redirect.html?id=${encodeURIComponent(link.id)}`;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${link.name}</td>
        <td>
          <a href="redirect.html?id=${encodeURIComponent(link.id)}" target="_blank">${shareUrl}</a>
          <button class="copyBtn" data-url="${shareUrl}">Copy</button>
        </td>
        <td class="qrCell"></td>
        <td><a href="${link.ios}" target="_blank">iOS</a></td>
        <td><a href="${link.android}" target="_blank">Android</a></td>
        <td>${link.clicks || 0}</td>
        <td><button class="deleteBtn" data-id="${link.id}">Delete</button></td>
      `;
      tbody.appendChild(row);

      // Generate QR code for the share link in the QR cell
      const qrCell = row.querySelector('.qrCell');
      const qr = new QRious({
        value: shareUrl,
        size: 80,
        background: 'white',
        foreground: '#3b82f6',
        level: 'M'
      });
      const img = document.createElement('img');
      img.src = qr.toDataURL();
      img.alt = "QR";
      img.width = 80;
      qrCell.appendChild(img);
    });
  });
}

document.getElementById('generateLinkForm').onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('linkName').value.trim();
  const ios = document.getElementById('iosUrl').value.trim();
  const android = document.getElementById('androidUrl').value.trim();
  if (!name || !ios || !android) return alert('Fill all fields!');
  const newLink = { id: generateId(), name, ios, android, clicks: 0 };
  saveLink(newLink, renderLinks);
  e.target.reset();
};

document.getElementById('linksTableBody').onclick = function(e) {
  // Handle delete
  if(e.target.classList.contains('deleteBtn')) {
    const id = e.target.getAttribute('data-id');
    deleteLink(id, renderLinks);
  }
  // Handle copy
  if(e.target.classList.contains('copyBtn')) {
    const url = e.target.getAttribute('data-url');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied!'))
        .catch(() => fallbackCopyTextToClipboard(url));
    } else {
      fallbackCopyTextToClipboard(url);
    }
  }
};
function fallbackCopyTextToClipboard(text) {
  const tempInput = document.createElement('input');
  tempInput.style.position = 'fixed';
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand('copy');
    alert('Link copied!');
  } catch (err) {
    alert('Copy failed');
  }
  document.body.removeChild(tempInput);
}

renderLinks();
