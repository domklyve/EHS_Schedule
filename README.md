# EHS Schedule PWA

A simple installable web app to show the current period and schedule at **Ellensburg High School (2025–2026)**.  
Works on **Android**, **iPhone/iPad (via Safari)**, and desktop.

## 🚀 Features
- Shows which period is happening now, and when it ends
- Highlights the **current period**
- Auto-detects the correct schedule (A/B/C/Assembly) by weekday, with manual override
- Works offline (cached with a service worker)
- Installable as a PWA (appears like a native app)
- Custom icons and footer attribution

## 📱 Install Instructions

### Android
1. Open Chrome and go to:  
   [https://domklyve.github.io/EHS_Schedule/](https://domklyve.github.io/EHS_Schedule/)
2. Tap **⋮ → Add to Home Screen → Install app**.
3. You’ll get an **EHS Schedule** icon on your home screen.

### iPhone/iPad
1. Open Safari and go to:  
   [https://domklyve.github.io/EHS_Schedule/](https://domklyve.github.io/EHS_Schedule/)
2. Tap the **Share** button → **Add to Home Screen**.
3. You’ll get an **EHS Schedule** icon on your home screen.

### Desktop (optional)
Open the site in Chrome/Edge → click the **install icon** in the address bar.

## 🔄 Updating
- App updates are automatic when you reload the page.
- If you don’t see changes, **refresh** in the browser or **Clear site data** in browser settings.

## 🛠 Development
- `index.html` contains the UI layout and styles.
- `app.js` contains the schedule logic.
- `service-worker.js` handles caching and offline support.
- `manifest.json` defines app metadata and icons.
- Icons (`icon-128.png`, `icon-192.png`, `icon-512.png`) provide the app logo.

## 🙋 Credits
Built by **Dominic Klyve** with help from GPT-5.  
Open source for anyone at EHS who wants to use it!
