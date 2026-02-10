# WhatsApp News Chat Scraper - Design Document

**Date**: 2026-02-10
**Project**: news-chat-scraper
**Purpose**: Automated scraping of WhatsApp news group messages to CSV with incremental updates

---

## Overview

A Node.js application that scrapes messages from a WhatsApp news group chat using whatsapp-web.js, extracts reporter names from Hebrew text, and exports structured data to CSV format. Designed for manual MVP execution with architecture supporting future scheduled automation.

---

## Requirements

### Functional Requirements
- Automated browser-based scraping via WhatsApp Web
- Headless operation with persistent session management
- Extract rich message data: sender, timestamp, text, media indicators, links, reactions
- Parse reporter names from Hebrew message text (first line extraction)
- Simple flat CSV output structure
- Incremental scraping: full history on first run, only new messages subsequently
- Retry logic with fallback for connection failures

### Non-Functional Requirements
- Proper UTF-8 Hebrew text encoding
- Session persistence (2-4 weeks typical lifespan)
- Detailed logging for debugging and monitoring
- Graceful error handling with partial progress preservation
- Architecture supports future scheduling enhancement

---

## Technology Stack

- **Runtime**: Node.js 18+
- **WhatsApp Automation**: whatsapp-web.js (built on Puppeteer)
- **CSV Export**: csv-writer library
- **Configuration**: dotenv
- **Logging**: winston or simple console logging

---

## Architecture

### Component Overview

1. **WhatsApp Client** (`src/client.js`)
   - Initializes whatsapp-web.js with LocalAuth strategy
   - Handles QR code authentication on first run
   - Manages session persistence in `data/.wwebjs_auth/`
   - Implements connection retry logic

2. **Message Scraper** (`src/scraper.js`)
   - Identifies target chat by name
   - Fetches messages (full history or incremental)
   - Filters based on last processed timestamp
   - Orchestrates parsing and export pipeline

3. **Message Parser** (`src/parser.js`)
   - Extracts reporter name from first line of Hebrew text
   - Parses message body (excluding reporter and source tag)
   - Detects media presence and extracts links
   - Handles reactions/replies if available

4. **State Manager** (`src/stateManager.js`)
   - Tracks last processed message timestamp
   - Stores metadata: chat ID, total messages processed, last run date
   - Persists state to `data/state.json`

5. **CSV Exporter** (`src/exporter.js`)
   - Writes data to single CSV file in append mode
   - UTF-8 with BOM for Excel compatibility
   - Handles multi-line messages with proper escaping

### Project Structure

```
news-chat-scraper/
├── src/
│   ├── client.js           # WhatsApp client initialization
│   ├── scraper.js          # Message scraping orchestration
│   ├── parser.js           # Message parsing & reporter extraction
│   ├── stateManager.js     # State persistence
│   └── exporter.js         # CSV export logic
├── data/
│   ├── .wwebjs_auth/       # WhatsApp session (auto-created)
│   ├── state.json          # Last processed timestamp & metadata
│   └── output/             # CSV exports
│       └── news_chat_data.csv
├── logs/                   # Daily log files
├── config.js               # Configuration settings
├── index.js                # Entry point CLI
├── package.json
├── .env                    # Environment variables
├── .gitignore
└── README.md
```

---

## Detailed Design

### 1. Authentication Flow

**Initial Setup (First Run):**
1. User runs `node index.js`
2. whatsapp-web.js initializes with LocalAuth
3. QR code displayed in terminal (headless: false for first run)
4. User scans with phone
5. Session automatically saved to `data/.wwebjs_auth/`
6. Subsequent runs use saved session (headless: true)

**Session Management:**
```javascript
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './data/.wwebjs_auth'
    }),
    puppeteer: {
        headless: process.env.HEADLESS === 'true',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});
```

**Session Expiration Handling:**
- If session invalid: clear cache, prompt QR re-scan
- Max 3 retry attempts with 30-second intervals
- Log all authentication events

### 2. Message Scraping Logic

**Chat Identification:**
```javascript
const chats = await client.getChats();
const targetChat = chats.find(chat =>
    chat.name.includes(process.env.CHAT_NAME)
);
```

**First Run (Full History):**
```javascript
const messages = await chat.fetchMessages({ limit: Infinity });
// Process all messages
// Save last timestamp to state
```

**Incremental Runs:**
```javascript
const state = loadState();
const messages = await chat.fetchMessages({ limit: 100 });
const newMessages = messages.filter(msg =>
    msg.timestamp > state.lastProcessedTimestamp
);
// Process only new messages
// Update state with latest timestamp
```

**State Structure (`data/state.json`):**
```json
{
  "chatId": "123456789@g.us",
  "chatName": "צ'אט הכתבים N12",
  "lastProcessedTimestamp": 1704067200,
  "lastRunDate": "2024-01-15T14:32:00Z",
  "totalMessagesProcessed": 1247
}
```

### 3. Message Parsing

**Input Message Format:**
```
בן גולדפריינד
לאחר התנהגותו במשחק מול הפועל ירושלים...
צ'אט הכתבים N12
```

**Parser Logic:**
```javascript
function parseMessage(msg) {
    const lines = msg.body.split('\n').filter(line => line.trim());

    // Extract reporter (first line)
    const reporter = lines[0]?.trim() || 'Unknown';

    // Check if last line is source tag
    const lastLine = lines[lines.length - 1];
    const isSourceTag = lastLine?.includes('צ\'אט') ||
                        lastLine?.includes('N12');

    // Message body (between reporter and source tag)
    const messageLines = isSourceTag
        ? lines.slice(1, -1)
        : lines.slice(1);
    const messageBody = messageLines.join('\n');

    // Extract links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = messageBody.match(urlRegex) || [];

    return {
        date: formatDate(msg.timestamp),
        time: formatTime(msg.timestamp),
        sender: msg.author || msg.from,
        reporter: reporter,
        message: messageBody,
        hasMedia: msg.hasMedia,
        links: links.join('; ')
    };
}
```

**Data Extraction:**
- **Date/Time**: Convert `msg.timestamp` (Unix) to readable format
- **Sender**: WhatsApp ID (phone number or contact)
- **Reporter**: First line of message text
- **Message**: Content excluding reporter and source tag
- **Has_Media**: Boolean from `msg.hasMedia`
- **Links**: Regex-extracted URLs, semicolon-separated

### 4. CSV Export

**Output Format:**
```csv
Date,Time,Sender,Reporter,Message,Has_Media,Links
2024-01-15,14:32:00,+972501234567,בן גולדפריינד,"לאחר התנהגותו במשחק...",false,""
2024-01-15,15:45:12,+972509876543,שרה כהן,"ראש הממשלה הודיע...",true,"https://example.com"
```

**Export Strategy:**
- **Single file**: `data/output/news_chat_data.csv`
- **Append mode**: Add new rows on incremental runs
- **UTF-8 BOM**: Ensure Excel compatibility with Hebrew text
- **Quote escaping**: Handle multi-line messages

**Implementation:**
```javascript
const csvWriter = createCsvWriter({
    path: './data/output/news_chat_data.csv',
    header: [
        {id: 'date', title: 'Date'},
        {id: 'time', title: 'Time'},
        {id: 'sender', title: 'Sender'},
        {id: 'reporter', title: 'Reporter'},
        {id: 'message', title: 'Message'},
        {id: 'hasMedia', title: 'Has_Media'},
        {id: 'links', title: 'Links'}
    ],
    encoding: 'utf8',
    append: fileExists('./data/output/news_chat_data.csv')
});
```

### 5. Error Handling & Retry Logic

**Error Categories:**

1. **Authentication Errors**
   - Clear session cache
   - Prompt QR re-scan
   - Exit with instructions

2. **Connection Errors**
   - Retry up to 3 times (30-second intervals)
   - Save partial progress before retry
   - Log detailed error information

3. **Chat Not Found**
   - List available chats
   - Exit with helpful error message

4. **Parsing Errors**
   - Log warning with message ID
   - Skip problematic message
   - Continue processing remaining messages

**Retry Implementation:**
```javascript
async function connectWithRetry(client, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await client.initialize();
            return true;
        } catch (error) {
            logger.error(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            if (attempt < maxRetries) {
                await sleep(30000);
            }
        }
    }
    throw new Error('Connection failed after max retries');
}
```

### 6. Logging

**Log Levels**: INFO, WARN, ERROR, SUCCESS

**Daily Log Files**: `logs/scraper_YYYY-MM-DD.log`

**Sample Log Output:**
```
[2024-01-15 14:30:22] INFO: Client initialized
[2024-01-15 14:30:45] INFO: Session loaded successfully
[2024-01-15 14:31:10] INFO: Found chat: צ'אט הכתבים N12
[2024-01-15 14:31:15] INFO: Processing 47 new messages
[2024-01-15 14:31:18] WARN: Failed to parse message ID xyz123
[2024-01-15 14:31:22] INFO: Exported 46 messages to CSV
[2024-01-15 14:31:22] SUCCESS: Scraping completed. 46 new messages added.
```

---

## Configuration

**Environment Variables (`.env`):**
```env
# WhatsApp Configuration
CHAT_NAME=צ'אט הכתבים N12
HEADLESS=true

# Scraping Settings
MAX_RETRIES=3
RETRY_DELAY=30000

# Logging
LOG_LEVEL=info
```

---

## Usage

**First Run:**
```bash
npm install
node index.js
# Scan QR code when prompted
# Wait for full history scrape
# Check data/output/news_chat_data.csv
```

**Subsequent Runs:**
```bash
node index.js
# Runs headless, scrapes only new messages
# Appends to existing CSV
```

**Manual Session Reset:**
```bash
rm -rf data/.wwebjs_auth
node index.js
# Re-scan QR code
```

---

## Future Enhancements (Out of MVP Scope)

- Scheduled execution via cron or node-cron
- Google Sheets API integration for direct upload
- Web dashboard for monitoring
- Message sentiment analysis
- Multi-chat support
- Media file download and archival
- Real-time monitoring mode

---

## Dependencies

```json
{
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "csv-writer": "^1.6.0",
    "dotenv": "^16.0.3",
    "qrcode-terminal": "^0.12.0"
  }
}
```

---

## Success Criteria

- ✅ First run successfully scrapes full chat history
- ✅ Subsequent runs append only new messages
- ✅ Reporter names correctly extracted from Hebrew text
- ✅ CSV properly formatted with Hebrew characters (Excel-compatible)
- ✅ Session persists across runs (no re-authentication needed)
- ✅ Graceful error handling with detailed logs
- ✅ Manual execution completes in under 5 minutes for typical chat history

---

## Edge Cases & Considerations

1. **Messages without reporter name**: Log warning, use "Unknown"
2. **Multi-line reporter names**: Only use first line
3. **Media-only messages**: Handle missing text gracefully
4. **Deleted messages**: Won't appear in fetch, skip naturally
5. **Large chat history**: May take 10+ minutes on first run
6. **Hebrew encoding in terminal**: May display incorrectly, but CSV will be correct
7. **Session expires during scrape**: Retry logic will handle reconnection

---

## Testing Strategy

1. **Manual Testing**:
   - First run with QR authentication
   - Incremental run verification
   - Hebrew text encoding validation in Excel
   - Session persistence across restarts

2. **Error Testing**:
   - Disconnect internet mid-scrape (retry logic)
   - Invalid chat name (error handling)
   - Corrupted state file (recovery)

3. **Data Validation**:
   - Verify all messages captured
   - Check reporter extraction accuracy
   - Confirm no duplicates on incremental runs

---

**End of Design Document**
