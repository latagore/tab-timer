# Tab Timers ⏱️

A simple Chrome extension that lets you set per-tab timers. Perfect for long-running automated work (builds, uploads, scripts, etc.) — set a timer, forget it, and get a notification when it’s done. Clicking the notification or timer takes you straight back to the tab.

---

## Features
- ✅ **Per-tab timers**: Each timer is tied to the tab you started it from.  
- 🔔 **HTML5 notifications**: When a timer finishes, you’ll get a desktop notification.  
- 👆 **One-click return**: Click a timer or its notification to jump right back to that tab.  
- 📋 **Popup view**: The extension popup shows **active timers** (with live countdowns) and **completed timers**.  
- 🗑️ **Management**: Remove individual timers, or clear all completed ones in one click.  
- 💾 **Persistent storage**: Timers survive popup closes and browser restarts.

---

## Installation
1. Clone or download this repository, or [download the ZIP release](#).  
2. Open Chrome and go to `chrome://extensions/`.  
3. Enable **Developer mode** (toggle in the top right).  
4. Click **Load unpacked** and select the project folder.  
5. Pin the extension from the extensions menu (puzzle icon) for quick access.

---

## Usage
1. Open a tab with the work you want to track.  
2. Click the extension icon → enter minutes/seconds (optionally a label).  
3. Start the timer. It will appear in **Active timers** with a live countdown.  
4. When the timer expires:  
   - You’ll get a **desktop notification**.  
   - Clicking the notification (or the timer in the popup) will focus the original tab.  
5. Manage timers in the popup (remove, clear completed).

---

## Permissions
- `tabs` – to focus the original tab when the timer is clicked.  
- `alarms` – to schedule reliable background wake-ups.  
- `notifications` – to show HTML5 desktop notifications.  
- `storage` – to persist timers across restarts.

---

## File Overview
- **manifest.json** – Extension configuration (Manifest V3).  
- **background.js** – Handles timers, alarms, storage, and notifications.  
- **popup.html / popup.js / popup.css** – UI for creating and managing timers.  
- **icon128.png** *(optional)* – Extension icon (replace or remove reference in `background.js`).  

---

## Notes
- Chrome will prompt you for notification permission the first time a timer finishes.  
- If the tab is closed before the timer ends, focusing it will do nothing (but the notification will still show).  
- Works on Chromium-based browsers (Chrome, Edge, Brave, etc.) that support Manifest V3.  

---

## License
MIT License – feel free to use, modify, and share.
