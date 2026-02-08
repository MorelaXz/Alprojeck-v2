# Alprojeck v2

WhatsApp Bot Multi-Device dengan Baileys v7.3.2

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Start bot
npm start

# 3. Enter phone number (with country code)
# Example: 628xxxxx

# 4. Link device
# WhatsApp > Settings > Linked Devices > Link a Device
# Enter pairing code from terminal
```

## Configuration

Edit `config.js`:

```javascript
global.owner = ['628xxxxx'];  // Your number
global.prefa = ['', '!', '.', ',', '🐤', '🗿'];
```

## What's Fixed

✅ **TypeError: Cannot read properties of undefined**
- Fixed optional chaining di `System/message.js`
- Semua property access sekarang aman

✅ **Newsletter/Channel Messages**
- Auto-filtered di `utama.js` line 125
- Bot tidak crash saat terima pesan channel

✅ **Media Download Failures**
- Retry mechanism 3x attempts
- Fallback ke direct URL download
- Better error logging


✅ **Admin Detection**
- Support format @lid
- Proper bypass untuk group admin

## Quick Fix

```bash
# Bot tidak jalan?
rm -rf session/
npm start

# Dependencies error?
rm -rf node_modules/ package-lock.json
npm install
```

## Production

```bash
# Using PM2
npm install -g pm2
pm2 start utama.js --name alprojeck
pm2 save

# Using Screen
screen -S alprojeck
npm start
# Ctrl+A then D to detach
```

---

**Version:** 2.0.0  
**Node.js:** >= 18.0.0
