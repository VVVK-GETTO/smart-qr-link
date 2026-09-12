# Smart Link

Dynamic app links (one QR → App Store or Play Store depending on device) and trackable web QRs.
Static site on GitHub Pages, data in Firebase Realtime Database.

- **Admin panel:** https://vvvk-getto.github.io/smart-qr-link/ (password protected)
- **Redirect page:** `redirect.html?id=<link-id>` (public — this is what the QR encodes)

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080/index.html
```

No build step. Uses the same Firebase project as production.

## Admin password

The admin panel is locked behind a password. The password is not stored in the code — only its
SHA-256 hash (`PASSWORD_HASH` in `app.js`). To change it:

```sh
printf 'smartlink:%s' 'NEW_PASSWORD' | shasum -a 256
```

Paste the resulting hash into `PASSWORD_HASH` and push. Unlocked state is remembered per browser;
use **Sign out** in the top bar to lock again.

## Files

| File | Purpose |
|---|---|
| `index.html`, `app.js`, `style.css` | Admin panel (login gate, create / edit / delete, QR download, stats) |
| `redirect.html`, `redirect.js` | Public loader + device-based redirect, increments scan counters |
| `firebase-config.js` | Shared Firebase web config |
