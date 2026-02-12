# Google Sheets Setup Guide

This guide will help you set up Google Sheets integration for the WhatsApp News Chat Scraper.

## Overview

The scraper can export messages directly to Google Sheets instead of CSV files. This requires:
1. A Google Cloud project with Sheets API enabled
2. A service account with credentials
3. A Google Sheet to write to

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Enter project name: `whatsapp-scraper`
4. Click **"Create"**

### 2. Enable Google Sheets API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and press **"Enable"**

### 3. Create Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in details:
   - **Service account name:** `whatsapp-scraper`
   - **Service account ID:** (auto-generated)
4. Click **"Create and Continue"**
5. Skip optional steps, click **"Done"**

### 4. Create Service Account Key

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. A JSON file will download - this is your `credentials.json`

### 5. Move Credentials File

```bash
# Move the downloaded JSON file to your project directory
mv ~/Downloads/whatsapp-scraper-*.json /Users/admin/projects/news-chat-scraper/credentials.json

# Verify it's there
ls -la credentials.json
```

### 6. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"Blank"** to create a new spreadsheet
3. Name it: `WhatsApp News Chat Data`
4. Copy the **spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

### 7. Share Sheet with Service Account

**IMPORTANT:** The service account needs access to your sheet!

1. Open your Google Sheet
2. Click **"Share"** button
3. Add the service account email (from credentials.json):
   - Look for `"client_email"` in credentials.json
   - Example: `whatsapp-scraper@project-id.iam.gserviceaccount.com`
4. Give it **"Editor"** permissions
5. Click **"Send"** (uncheck "Notify people")

### 8. Configure Environment Variables

Edit `.env` file:

```bash
# Add these lines to .env
GOOGLE_SHEET_ID="YOUR_SPREADSHEET_ID_HERE"
GOOGLE_CREDENTIALS_PATH="./credentials.json"
```

Replace `YOUR_SPREADSHEET_ID_HERE` with the ID from step 6.

### 9. Test the Setup

```bash
# Run the scraper manually to test
npm start
```

You should see:
```
[SUCCESS] Google Sheets API initialized successfully
[SUCCESS] Successfully exported to Google Sheets: WhatsApp News Chat Data
[INFO] Sheet URL: https://docs.google.com/spreadsheets/d/...
```

## Troubleshooting

### Error: "Credentials file not found"

**Solution:** Make sure `credentials.json` is in the project root:
```bash
ls -la credentials.json
```

### Error: "GOOGLE_SHEET_ID not configured"

**Solution:** Add the spreadsheet ID to `.env`:
```env
GOOGLE_SHEET_ID="your-spreadsheet-id-here"
```

### Error: "The caller does not have permission"

**Solution:** Share the sheet with the service account email:
1. Open credentials.json
2. Find `"client_email"` value
3. Share your Google Sheet with this email (Editor access)

### Error: "Unable to parse range: Sheet1!A:G"

**Solution:** Make sure your sheet is named "Sheet1" or update the range in `src/sheetsExporter.js`:
```javascript
range: 'YourSheetName!A:G'
```

## Security Notes

### Important: Protect credentials.json

⚠️ **Never commit credentials.json to git!**

The `.gitignore` file should already exclude it:
```bash
# Check if it's ignored
git check-ignore credentials.json
```

If not ignored, add to `.gitignore`:
```bash
echo "credentials.json" >> .gitignore
```

### Service Account Permissions

- The service account only has access to sheets you explicitly share with it
- It cannot access any other files in your Google Drive
- You can revoke access anytime by removing the service account from the sheet

## Switching Between CSV and Google Sheets

### Use Google Sheets (default if configured)

```env
GOOGLE_SHEET_ID="your-spreadsheet-id"
```

### Use CSV (if GOOGLE_SHEET_ID is empty)

```env
GOOGLE_SHEET_ID=""
```

The scraper will automatically use CSV if Google Sheets is not configured.

## Column Structure

The sheet will have these columns:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Date | Time | Sender | Reporter | Message | Has_Media | Links |

Example:
```
10/02/2026 | 14:35 | +972... | בן גולדפריינד | חדשות חשובות | false | https://...
```

## Next Steps

- Set up automated backups of your Google Sheet
- Create a dashboard/chart view in Google Sheets
- Use Google Sheets formulas to analyze the data
- Share the sheet with your team (read-only access)
