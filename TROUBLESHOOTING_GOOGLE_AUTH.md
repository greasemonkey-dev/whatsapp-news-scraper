# Troubleshooting Google Service Account Key Download

## Common Issues

### Issue 1: Download Blocked by Browser

**Solution:**
1. Check browser downloads bar (bottom of browser)
2. Allow the download if prompted
3. Check browser's download folder
4. Try different browser (Chrome recommended for Google Cloud Console)

### Issue 2: Can't Find "Add Key" Button

**Steps:**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click on the service account name (not checkbox)
3. Click "KEYS" tab at the top
4. Click "ADD KEY" → "Create new key"
5. Select JSON
6. Click CREATE

### Issue 3: Service Account Not Created

**Create service account first:**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click "+ CREATE SERVICE ACCOUNT" at top
3. Enter name: `whatsapp-scraper`
4. Click "CREATE AND CONTINUE"
5. Skip role selection (click CONTINUE)
6. Click DONE
7. Now follow "Issue 2" steps above

### Issue 4: No Permission to Create Keys

**Solution:**
- You need to be Project Owner or Editor
- Or have "Service Account Key Admin" role
- Contact your Google Cloud admin if you don't have permissions

## Alternative: Use Existing Credentials

If you have credentials.json from another project:

1. **Check if it has Sheets API enabled:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search "Google Sheets API"
   - Enable if not already enabled

2. **Copy existing credentials:**
   ```bash
   cp /path/to/existing/credentials.json ./credentials.json
   ```

## Alternative: Manual JSON Creation (Advanced)

If you can see the service account email but can't download key:

1. Create a new service account in a different project
2. Or contact support

## Step-by-Step with Screenshots

### Step 1: Navigate to Service Accounts
```
https://console.cloud.google.com/iam-admin/serviceaccounts
```
You should see a list of service accounts.

### Step 2: Create Service Account
Click the blue "+ CREATE SERVICE ACCOUNT" button at the top.

### Step 3: Fill Details
- Service account name: `whatsapp-scraper`
- Service account ID: (auto-filled)
- Click "CREATE AND CONTINUE"

### Step 4: Skip Permissions
- Click "CONTINUE" (no role needed)
- Click "DONE"

### Step 5: Create Key
- Click on the newly created service account name
- Click "KEYS" tab
- Click "ADD KEY" dropdown
- Select "Create new key"
- Choose "JSON"
- Click "CREATE"
- File should download automatically

### Step 6: Locate Downloaded File
```bash
# macOS
ls -la ~/Downloads/*.json | tail -1

# The file name looks like:
# project-name-abc123-1234567890ab.json
```

## Still Having Issues?

### Option 1: Check Console Permissions
```
Go to: https://console.cloud.google.com/iam-admin/iam
Check if your user has "Editor" or "Owner" role
```

### Option 2: Enable Pop-ups
Some browsers block the JSON download as a pop-up.
- Check browser address bar for blocked pop-up icon
- Allow pop-ups from console.cloud.google.com

### Option 3: Try Incognito/Private Mode
Sometimes browser extensions block downloads.
- Open Google Cloud Console in incognito mode
- Try creating the key again

### Option 4: Use gcloud CLI
If you have gcloud installed:

```bash
# Authenticate
gcloud auth login

# Create key via CLI
gcloud iam service-accounts keys create credentials.json \
  --iam-account=whatsapp-scraper@PROJECT_ID.iam.gserviceaccount.com

# Replace PROJECT_ID with your actual project ID
```

## What's Your Exact Issue?

Please specify:
- [ ] Button "Add Key" not visible
- [ ] Download starts but file disappears
- [ ] Permission denied error
- [ ] Service account creation fails
- [ ] Other (describe):
