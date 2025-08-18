// Get linkId from ?id= in URL
function getQuery(param) {
  return new URLSearchParams(window.location.search).get(param);
}

const id = getQuery('id');
if (!id) {
  document.getElementById('message').innerText = 'Invalid link!';
} else {
  const links = JSON.parse(localStorage.getItem('smartlinks') || '[]');
  const link = links.find(l => l.id === id);
  if (!link) {
    document.getElementById('message').innerText = 'Link not found or deleted!';
  } else {
    // Count the click
    link.clicks = (link.clicks || 0) + 1;
    localStorage.setItem('smartlinks', JSON.stringify(links));
    // Detect device and redirect
    setTimeout(() => {
      const ua = navigator.userAgent || navigator.vendor;
      if (/android/i.test(ua)) window.location.href = link.android;
      else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) window.location.href = link.ios;
      else document.getElementById('message').innerHTML = 
        '<b>Not a phone?</b><br><a href="'+link.ios+'">iOS</a> | <a href="'+link.android+'">Android</a>';
    }, 1500);
  }
}
