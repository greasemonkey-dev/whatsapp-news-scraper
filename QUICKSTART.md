# Quick Start Guide

Get the WhatsApp News Chat Scraper running in 5 minutes.

## Step 1: Install

```bash
cd news-chat-scraper
npm install
```

## Step 2: Configure

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Edit `.env` with your chat name:

```env
CHAT_NAME="צ'אט הכתבים N12"  # Replace with your WhatsApp chat name
HEADLESS=false                 # Keep false for first run
```

## Step 3: First Run (QR Authentication)

Start the scraper:

```bash
npm start
```

**What happens:**
- A browser window opens automatically
- QR code displays in the terminal
- Open WhatsApp on your phone
- Go to Settings > Linked Devices > Link a Device
- Scan the QR code
- Wait for scraping to complete (session is saved for future runs)

**Expected output:**
```
========================================
  WhatsApp News Chat Scraper
========================================

[INFO] Starting scraper application
[INFO] Target chat: "צ'אט הכתבים N12"
[INFO] QR code displayed in terminal
[INFO] Client is ready!
[SUCCESS] Scraping completed successfully
```

## Step 4: Check Output

View your scraped messages:

```bash
cat data/output/messages_*.csv
```

Your messages are now in CSV format with columns:
- `reporter` - Sender name
- `content` - Message text
- `date` - DD/MM/YYYY format
- `time` - HH:MM format
- `links` - Extracted URLs
- `hasMedia` - Media attachment indicator

## Step 5: Subsequent Runs (Headless)

After first authentication, you can run in headless mode for automation.

Edit `.env`:

```env
HEADLESS=true  # Change to true
```

Run again:

```bash
npm start
```

Only new messages will be scraped and appended to the CSV file.

## Troubleshooting

### Chat not found?
- Check that `CHAT_NAME` matches exactly (including special characters)
- Try copying the exact name from WhatsApp Web
- Enable debug logging: `LOG_LEVEL="debug"` in `.env`

### Session expired?
Delete the session and re-authenticate:

```bash
rm -rf .wwebjs_auth/
npm start  # Re-scan QR code
```

### Hebrew text garbled in CSV?
Open the CSV with UTF-8 encoding:
- **Google Sheets:** File > Import > Upload (auto-detects UTF-8)
- **Excel:** Import Data > From Text/CSV > File Origin: UTF-8
- **LibreOffice:** Open with Character Set: Unicode (UTF-8)

### No new messages?
Reset state to re-process all messages:

```bash
rm data/state.json
npm start
```

### Browser won't open?
Check that `HEADLESS=false` is set in `.env` file.

## Next Steps

**Need help?** See [README.md](README.md) for:
- Full documentation
- Advanced configuration options
- Message format details
- Comprehensive troubleshooting
- Testing and development guides

**Check logs:** View detailed logs in `logs/scraper_YYYY-MM-DD.log`

**Run tests:** Verify everything works with `npm test`

---

**You're all set!** The scraper will now track new messages automatically on each run.
