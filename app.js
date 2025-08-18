const BASE_URL = "https://vvvk-getto.github.io/smart-qr-link"; 

const LS_KEY = 'smartlinks';

function getLinks() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}
function saveLinks(links) {
  localStorage.setItem(LS_KEY, JSON.stringify(links));
}
function generateId() {
  return 'sl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

function renderLinks() {
  const tbody = document.getElementById('linksTableBody');
  const links = getLinks();
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
}

document.getElementById('generateLinkForm').onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('linkName').value.trim();
  const ios = document.getElementById('iosUrl').value.trim();
  const android = document.getElementById('androidUrl').value.trim();
  if (!name || !ios || !android) return alert('Fill all fields!');
  const links = getLinks();
  links.push({ id: generateId(), name, ios, android, clicks: 0 });
  saveLinks(links);
  renderLinks();
  e.target.reset();
};

document.getElementById('linksTableBody').onclick = function(e) {
  // Handle "Delete" button
  if(e.target.classList.contains('deleteBtn')) {
    const id = e.target.getAttribute('data-id');
    let links = getLinks();
    links = links.filter(link => link.id !== id);
    saveLinks(links);
    renderLinks();
  }
  // Handle Copy to clipboard
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
