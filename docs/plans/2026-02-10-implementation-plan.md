# WhatsApp News Chat Scraper - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js WhatsApp scraper that extracts news messages with Hebrew reporter names to CSV with incremental updates.

**Architecture:** Five core modules (client, scraper, parser, state manager, exporter) orchestrated by a main CLI entry point. WhatsApp Web JS handles browser automation with session persistence. TDD approach for testable components.

**Tech Stack:** Node.js 18+, whatsapp-web.js, csv-writer, dotenv, jest (testing)

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `jest.config.js`

**Step 1: Initialize Node.js project**

Run: `cd /Users/admin/projects/news-chat-scraper && npm init -y`

Expected: `package.json` created

**Step 2: Create .gitignore**

Create file `.gitignore`:

```gitignore
# Dependencies
node_modules/

# Environment
.env

# WhatsApp session data
data/.wwebjs_auth/
data/.wwebjs_cache/

# State and logs
data/state.json
logs/

# Output files
data/output/*.csv

# System files
.DS_Store
*.log

# IDE
.vscode/
.idea/
```

**Step 3: Create .env.example**

Create file `.env.example`:

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

**Step 4: Install dependencies**

Run: `npm install whatsapp-web.js csv-writer dotenv qrcode-terminal`

Expected: Dependencies installed, `package-lock.json` created

**Step 5: Install dev dependencies**

Run: `npm install --save-dev jest`

Expected: Jest installed

**Step 6: Create jest config**

Create file `jest.config.js`:

```javascript
module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js'
    ]
};
```

**Step 7: Update package.json scripts**

Modify `package.json` to add scripts section:

```json
{
  "scripts": {
    "start": "node index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Step 8: Create directory structure**

Run: `mkdir -p src data/output logs __tests__`

Expected: Directories created

**Step 9: Commit**

```bash
git add .
git commit -m "chore: initialize project with dependencies and structure"
```

---

## Task 2: State Manager Module

**Files:**
- Create: `src/stateManager.js`
- Create: `__tests__/stateManager.test.js`

**Step 1: Write failing test for loading non-existent state**

Create file `__tests__/stateManager.test.js`:

```javascript
const fs = require('fs');
const path = require('path');
const StateManager = require('../src/stateManager');

describe('StateManager', () => {
    const testStatePath = path.join(__dirname, 'test-state.json');
    let stateManager;

    beforeEach(() => {
        stateManager = new StateManager(testStatePath);
        // Clean up test file if exists
        if (fs.existsSync(testStatePath)) {
            fs.unlinkSync(testStatePath);
        }
    });

    afterEach(() => {
        if (fs.existsSync(testStatePath)) {
            fs.unlinkSync(testStatePath);
        }
    });

    test('loadState returns default state when file does not exist', () => {
        const state = stateManager.loadState();

        expect(state).toEqual({
            chatId: null,
            chatName: null,
            lastProcessedTimestamp: 0,
            lastRunDate: null,
            totalMessagesProcessed: 0
        });
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- stateManager.test.js`

Expected: FAIL - "Cannot find module '../src/stateManager'"

**Step 3: Write minimal implementation**

Create file `src/stateManager.js`:

```javascript
const fs = require('fs');
const path = require('path');

class StateManager {
    constructor(statePath = './data/state.json') {
        this.statePath = statePath;
        this.defaultState = {
            chatId: null,
            chatName: null,
            lastProcessedTimestamp: 0,
            lastRunDate: null,
            totalMessagesProcessed: 0
        };
    }

    loadState() {
        if (!fs.existsSync(this.statePath)) {
            return { ...this.defaultState };
        }

        try {
            const data = fs.readFileSync(this.statePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.warn(`Failed to load state: ${error.message}`);
            return { ...this.defaultState };
        }
    }
}

module.exports = StateManager;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- stateManager.test.js`

Expected: PASS

**Step 5: Write test for saveState**

Add to `__tests__/stateManager.test.js`:

```javascript
    test('saveState creates state file with correct data', () => {
        const testState = {
            chatId: '123456789@g.us',
            chatName: 'Test Chat',
            lastProcessedTimestamp: 1704067200,
            lastRunDate: '2024-01-01T10:30:00Z',
            totalMessagesProcessed: 50
        };

        stateManager.saveState(testState);

        expect(fs.existsSync(testStatePath)).toBe(true);
        const savedData = JSON.parse(fs.readFileSync(testStatePath, 'utf8'));
        expect(savedData).toEqual(testState);
    });
```

**Step 6: Run test to verify it fails**

Run: `npm test -- stateManager.test.js`

Expected: FAIL - "stateManager.saveState is not a function"

**Step 7: Implement saveState**

Add to `src/stateManager.js`:

```javascript
    saveState(state) {
        const dir = path.dirname(this.statePath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        try {
            fs.writeFileSync(
                this.statePath,
                JSON.stringify(state, null, 2),
                'utf8'
            );
            return true;
        } catch (error) {
            console.error(`Failed to save state: ${error.message}`);
            return false;
        }
    }
```

**Step 8: Run test to verify it passes**

Run: `npm test -- stateManager.test.js`

Expected: PASS

**Step 9: Write test for updateState**

Add to `__tests__/stateManager.test.js`:

```javascript
    test('updateState merges new data with existing state', () => {
        const initialState = {
            chatId: '123@g.us',
            chatName: 'Test',
            lastProcessedTimestamp: 100,
            lastRunDate: '2024-01-01',
            totalMessagesProcessed: 10
        };

        stateManager.saveState(initialState);

        stateManager.updateState({
            lastProcessedTimestamp: 200,
            totalMessagesProcessed: 25
        });

        const updated = stateManager.loadState();
        expect(updated.chatId).toBe('123@g.us');
        expect(updated.lastProcessedTimestamp).toBe(200);
        expect(updated.totalMessagesProcessed).toBe(25);
    });
```

**Step 10: Run test to verify it fails**

Run: `npm test -- stateManager.test.js`

Expected: FAIL - "stateManager.updateState is not a function"

**Step 11: Implement updateState**

Add to `src/stateManager.js`:

```javascript
    updateState(updates) {
        const currentState = this.loadState();
        const newState = {
            ...currentState,
            ...updates,
            lastRunDate: new Date().toISOString()
        };
        return this.saveState(newState);
    }
```

**Step 12: Run all stateManager tests**

Run: `npm test -- stateManager.test.js`

Expected: All tests PASS

**Step 13: Commit**

```bash
git add src/stateManager.js __tests__/stateManager.test.js
git commit -m "feat: add state manager with load/save/update functionality"
```

---

## Task 3: Message Parser Module

**Files:**
- Create: `src/parser.js`
- Create: `__tests__/parser.test.js`

**Step 1: Write test for basic Hebrew message parsing**

Create file `__tests__/parser.test.js`:

```javascript
const { parseMessage } = require('../src/parser');

describe('Message Parser', () => {
    test('parses Hebrew message with reporter name', () => {
        const mockMessage = {
            body: 'בן גולדפריינד\nלאחר התנהגותו במשחק מול הפועל ירושלים\nצ\'אט הכתבים N12',
            timestamp: 1704067200,
            author: '+972501234567',
            hasMedia: false
        };

        const result = parseMessage(mockMessage);

        expect(result.reporter).toBe('בן גולדפריינד');
        expect(result.message).toBe('לאחר התנהגותו במשחק מול הפועל ירושלים');
        expect(result.sender).toBe('+972501234567');
        expect(result.hasMedia).toBe(false);
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(result.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- parser.test.js`

Expected: FAIL - "Cannot find module '../src/parser'"

**Step 3: Write minimal implementation**

Create file `src/parser.js`:

```javascript
/**
 * Formats Unix timestamp to YYYY-MM-DD
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
}

/**
 * Formats Unix timestamp to HH:MM:SS
 */
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toTimeString().split(' ')[0];
}

/**
 * Parses WhatsApp message and extracts structured data
 * @param {Object} msg - WhatsApp message object
 * @returns {Object} Parsed message data
 */
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
        hasMedia: msg.hasMedia || false,
        links: links.join('; ')
    };
}

module.exports = {
    parseMessage,
    formatDate,
    formatTime
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- parser.test.js`

Expected: PASS

**Step 5: Write test for message with links**

Add to `__tests__/parser.test.js`:

```javascript
    test('extracts links from message body', () => {
        const mockMessage = {
            body: 'שרה כהן\nחדשות חשובות https://example.com ועוד https://news.co.il/article\nצ\'אט הכתבים',
            timestamp: 1704067200,
            author: '+972509876543',
            hasMedia: false
        };

        const result = parseMessage(mockMessage);

        expect(result.reporter).toBe('שרה כהן');
        expect(result.links).toBe('https://example.com; https://news.co.il/article');
        expect(result.message).toContain('חדשות חשובות');
    });
```

**Step 6: Run test to verify it passes**

Run: `npm test -- parser.test.js`

Expected: PASS (already implemented)

**Step 7: Write test for message without source tag**

Add to `__tests__/parser.test.js`:

```javascript
    test('handles message without source tag', () => {
        const mockMessage = {
            body: 'דני רונן\nפרטים נוספים על האירוע',
            timestamp: 1704067200,
            author: '+972501111111',
            hasMedia: false
        };

        const result = parseMessage(mockMessage);

        expect(result.reporter).toBe('דני רונן');
        expect(result.message).toBe('פרטים נוספים על האירוע');
    });
```

**Step 8: Run test to verify it passes**

Run: `npm test -- parser.test.js`

Expected: PASS

**Step 9: Write test for message with media**

Add to `__tests__/parser.test.js`:

```javascript
    test('detects media presence', () => {
        const mockMessage = {
            body: 'מיכל שמש\nתמונה מהאירוע',
            timestamp: 1704067200,
            author: '+972502222222',
            hasMedia: true
        };

        const result = parseMessage(mockMessage);

        expect(result.hasMedia).toBe(true);
        expect(result.reporter).toBe('מיכל שמש');
    });
```

**Step 10: Run test to verify it passes**

Run: `npm test -- parser.test.js`

Expected: PASS

**Step 11: Write test for malformed message (no reporter)**

Add to `__tests__/parser.test.js`:

```javascript
    test('uses "Unknown" for empty message', () => {
        const mockMessage = {
            body: '',
            timestamp: 1704067200,
            author: '+972503333333',
            hasMedia: false
        };

        const result = parseMessage(mockMessage);

        expect(result.reporter).toBe('Unknown');
        expect(result.message).toBe('');
    });
```

**Step 12: Run all parser tests**

Run: `npm test -- parser.test.js`

Expected: All tests PASS

**Step 13: Commit**

```bash
git add src/parser.js __tests__/parser.test.js
git commit -m "feat: add message parser with Hebrew text and link extraction"
```

---

## Task 4: CSV Exporter Module

**Files:**
- Create: `src/exporter.js`
- Create: `__tests__/exporter.test.js`

**Step 1: Write test for creating new CSV**

Create file `__tests__/exporter.test.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { exportToCSV } = require('../src/exporter');

describe('CSV Exporter', () => {
    const testOutputDir = path.join(__dirname, 'test-output');
    const testCSVPath = path.join(testOutputDir, 'test.csv');

    beforeEach(() => {
        // Create test output directory
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }
        // Clean up test CSV if exists
        if (fs.existsSync(testCSVPath)) {
            fs.unlinkSync(testCSVPath);
        }
    });

    afterEach(() => {
        // Clean up
        if (fs.existsSync(testCSVPath)) {
            fs.unlinkSync(testCSVPath);
        }
        if (fs.existsSync(testOutputDir)) {
            fs.rmdirSync(testOutputDir);
        }
    });

    test('creates new CSV with headers and data', async () => {
        const testData = [
            {
                date: '2024-01-15',
                time: '14:32:00',
                sender: '+972501234567',
                reporter: 'בן גולדפריינד',
                message: 'חדשות חשובות',
                hasMedia: false,
                links: ''
            }
        ];

        await exportToCSV(testData, testCSVPath);

        expect(fs.existsSync(testCSVPath)).toBe(true);
        const content = fs.readFileSync(testCSVPath, 'utf8');
        expect(content).toContain('Date,Time,Sender,Reporter,Message,Has_Media,Links');
        expect(content).toContain('בן גולדפריינד');
        expect(content).toContain('חדשות חשובות');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- exporter.test.js`

Expected: FAIL - "Cannot find module '../src/exporter'"

**Step 3: Write minimal implementation**

Create file `src/exporter.js`:

```javascript
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * Exports parsed message data to CSV
 * @param {Array} data - Array of parsed message objects
 * @param {string} outputPath - Path to output CSV file
 * @returns {Promise<boolean>} Success status
 */
async function exportToCSV(data, outputPath = './data/output/news_chat_data.csv') {
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Check if file exists for append mode
    const fileExists = fs.existsSync(outputPath);

    const csvWriter = createCsvWriter({
        path: outputPath,
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
        append: fileExists
    });

    try {
        await csvWriter.writeRecords(data);
        return true;
    } catch (error) {
        console.error(`Failed to export CSV: ${error.message}`);
        return false;
    }
}

module.exports = {
    exportToCSV
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- exporter.test.js`

Expected: PASS

**Step 5: Write test for append mode**

Add to `__tests__/exporter.test.js`:

```javascript
    test('appends to existing CSV without duplicating headers', async () => {
        const firstBatch = [
            {
                date: '2024-01-15',
                time: '14:32:00',
                sender: '+972501234567',
                reporter: 'בן גולדפריינד',
                message: 'חדשות ראשונות',
                hasMedia: false,
                links: ''
            }
        ];

        const secondBatch = [
            {
                date: '2024-01-15',
                time: '15:45:00',
                sender: '+972509876543',
                reporter: 'שרה כהן',
                message: 'חדשות שניות',
                hasMedia: true,
                links: 'https://example.com'
            }
        ];

        await exportToCSV(firstBatch, testCSVPath);
        await exportToCSV(secondBatch, testCSVPath);

        const content = fs.readFileSync(testCSVPath, 'utf8');
        const lines = content.trim().split('\n');

        // Should have header + 2 data rows
        expect(lines.length).toBe(3);
        expect(lines[0]).toContain('Date,Time,Sender');
        expect(content).toContain('בן גולדפריינד');
        expect(content).toContain('שרה כהן');
    });
```

**Step 6: Run test to verify it passes**

Run: `npm test -- exporter.test.js`

Expected: PASS

**Step 7: Write test for multi-line message handling**

Add to `__tests__/exporter.test.js`:

```javascript
    test('handles multi-line messages with proper escaping', async () => {
        const testData = [
            {
                date: '2024-01-15',
                time: '14:32:00',
                sender: '+972501234567',
                reporter: 'דני רונן',
                message: 'שורה ראשונה\nשורה שנייה\nשורה שלישית',
                hasMedia: false,
                links: ''
            }
        ];

        await exportToCSV(testData, testCSVPath);

        const content = fs.readFileSync(testCSVPath, 'utf8');
        expect(content).toContain('דני רונן');
        // Multi-line content should be properly quoted
        expect(content).toMatch(/".*שורה ראשונה.*שורה שנייה.*"/s);
    });
```

**Step 8: Run all exporter tests**

Run: `npm test -- exporter.test.js`

Expected: All tests PASS

**Step 9: Commit**

```bash
git add src/exporter.js __tests__/exporter.test.js
git commit -m "feat: add CSV exporter with append mode and UTF-8 support"
```

---

## Task 5: Configuration Module

**Files:**
- Create: `config.js`

**Step 1: Create configuration module**

Create file `config.js`:

```javascript
require('dotenv').config();

const config = {
    whatsapp: {
        chatName: process.env.CHAT_NAME || 'צ\'אט הכתבים N12',
        headless: process.env.HEADLESS === 'true',
        dataPath: './data/.wwebjs_auth'
    },
    scraping: {
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.RETRY_DELAY) || 30000,
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: './logs'
    },
    paths: {
        state: './data/state.json',
        output: './data/output/news_chat_data.csv'
    }
};

module.exports = config;
```

**Step 2: Create .env file for local development**

Run: `cp .env.example .env`

Expected: `.env` file created

**Step 3: Commit**

```bash
git add config.js .env.example
git commit -m "feat: add configuration module with environment variables"
```

---

## Task 6: Logger Utility

**Files:**
- Create: `src/logger.js`

**Step 1: Create simple console logger**

Create file `src/logger.js`:

```javascript
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Simple logger with file and console output
 */
class Logger {
    constructor() {
        this.logDir = config.logging.dir;
        this.level = config.logging.level;
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFilePath() {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `scraper_${date}.log`);
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        return `[${timestamp}] ${level}: ${message}`;
    }

    write(level, message) {
        const formatted = this.formatMessage(level, message);

        // Console output with colors
        const colors = {
            INFO: '\x1b[36m',    // Cyan
            WARN: '\x1b[33m',    // Yellow
            ERROR: '\x1b[31m',   // Red
            SUCCESS: '\x1b[32m'  // Green
        };
        const reset = '\x1b[0m';
        console.log(`${colors[level] || ''}${formatted}${reset}`);

        // File output
        try {
            fs.appendFileSync(this.getLogFilePath(), formatted + '\n', 'utf8');
        } catch (error) {
            console.error(`Failed to write log: ${error.message}`);
        }
    }

    info(message) {
        this.write('INFO', message);
    }

    warn(message) {
        this.write('WARN', message);
    }

    error(message) {
        this.write('ERROR', message);
    }

    success(message) {
        this.write('SUCCESS', message);
    }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
```

**Step 2: Commit**

```bash
git add src/logger.js
git commit -m "feat: add logger utility with file and console output"
```

---

## Task 7: WhatsApp Client Module

**Files:**
- Create: `src/client.js`

**Step 1: Create client initialization with retry logic**

Create file `src/client.js`:

```javascript
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');
const logger = require('./logger');

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize WhatsApp client with LocalAuth
 * @returns {Client} Initialized WhatsApp client
 */
function createClient() {
    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: config.whatsapp.dataPath
        }),
        puppeteer: {
            headless: config.whatsapp.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // Event: QR code received
    client.on('qr', (qr) => {
        logger.info('QR Code received. Scan with your phone:');
        qrcode.generate(qr, { small: true });
    });

    // Event: Authentication successful
    client.on('authenticated', () => {
        logger.success('Authentication successful!');
    });

    // Event: Client ready
    client.on('ready', () => {
        logger.success('WhatsApp client is ready!');
    });

    // Event: Authentication failure
    client.on('auth_failure', (msg) => {
        logger.error(`Authentication failure: ${msg}`);
    });

    // Event: Disconnected
    client.on('disconnected', (reason) => {
        logger.warn(`Client disconnected: ${reason}`);
    });

    return client;
}

/**
 * Connect to WhatsApp with retry logic
 * @param {Client} client - WhatsApp client instance
 * @returns {Promise<boolean>} Success status
 */
async function connectWithRetry(client) {
    const maxRetries = config.scraping.maxRetries;
    const retryDelay = config.scraping.retryDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.info(`Connection attempt ${attempt}/${maxRetries}...`);
            await client.initialize();
            return true;
        } catch (error) {
            logger.error(`Attempt ${attempt} failed: ${error.message}`);

            if (attempt < maxRetries) {
                logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
                await sleep(retryDelay);
            }
        }
    }

    throw new Error('Connection failed after maximum retries');
}

/**
 * Find chat by name
 * @param {Client} client - WhatsApp client instance
 * @param {string} chatName - Name of the chat to find
 * @returns {Promise<Chat|null>} Chat object or null
 */
async function findChat(client, chatName) {
    logger.info(`Looking for chat: ${chatName}`);

    const chats = await client.getChats();
    const targetChat = chats.find(chat =>
        chat.name && chat.name.includes(chatName)
    );

    if (!targetChat) {
        logger.error(`Chat not found: ${chatName}`);
        logger.info('Available chats:');
        chats.slice(0, 10).forEach(chat => {
            logger.info(`  - ${chat.name || 'Unnamed'} (${chat.id._serialized})`);
        });
        return null;
    }

    logger.success(`Found chat: ${targetChat.name} (${targetChat.id._serialized})`);
    return targetChat;
}

module.exports = {
    createClient,
    connectWithRetry,
    findChat,
    sleep
};
```

**Step 2: Commit**

```bash
git add src/client.js
git commit -m "feat: add WhatsApp client with retry logic and chat finder"
```

---

## Task 8: Message Scraper Module

**Files:**
- Create: `src/scraper.js`

**Step 1: Create scraper orchestration module**

Create file `src/scraper.js`:

```javascript
const { parseMessage } = require('./parser');
const { exportToCSV } = require('./exporter');
const StateManager = require('./stateManager');
const logger = require('./logger');
const config = require('../config');

/**
 * Scrape messages from a chat
 * @param {Chat} chat - WhatsApp chat object
 * @param {boolean} isFirstRun - Whether this is the first run
 * @returns {Promise<Array>} Parsed messages
 */
async function scrapeMessages(chat, isFirstRun = false) {
    const stateManager = new StateManager(config.paths.state);
    const state = stateManager.loadState();

    logger.info('Fetching messages...');

    let messages;
    if (isFirstRun || state.lastProcessedTimestamp === 0) {
        // First run: fetch all history
        logger.info('First run detected. Fetching full message history...');
        messages = await chat.fetchMessages({ limit: Infinity });
        logger.info(`Fetched ${messages.length} messages from history`);
    } else {
        // Incremental run: fetch recent messages and filter
        logger.info('Incremental run. Fetching recent messages...');
        messages = await chat.fetchMessages({ limit: 100 });

        const unfilteredCount = messages.length;
        messages = messages.filter(msg => msg.timestamp > state.lastProcessedTimestamp);

        logger.info(`Fetched ${unfilteredCount} messages, ${messages.length} are new`);
    }

    if (messages.length === 0) {
        logger.info('No new messages to process');
        return [];
    }

    // Parse messages
    logger.info('Parsing messages...');
    const parsedMessages = [];
    let parseErrors = 0;

    for (const msg of messages) {
        try {
            // Skip messages without body text
            if (!msg.body || msg.body.trim() === '') {
                continue;
            }

            const parsed = parseMessage(msg);
            parsedMessages.push(parsed);
        } catch (error) {
            parseErrors++;
            logger.warn(`Failed to parse message ${msg.id}: ${error.message}`);
        }
    }

    if (parseErrors > 0) {
        logger.warn(`Encountered ${parseErrors} parsing errors`);
    }

    logger.success(`Successfully parsed ${parsedMessages.length} messages`);

    // Update state with latest timestamp
    if (messages.length > 0) {
        const latestTimestamp = Math.max(...messages.map(m => m.timestamp));
        stateManager.updateState({
            chatId: chat.id._serialized,
            chatName: chat.name,
            lastProcessedTimestamp: latestTimestamp,
            totalMessagesProcessed: state.totalMessagesProcessed + parsedMessages.length
        });
        logger.info('State updated successfully');
    }

    return parsedMessages;
}

/**
 * Main scraping workflow
 * @param {Chat} chat - WhatsApp chat object
 * @returns {Promise<Object>} Results summary
 */
async function scrape(chat) {
    const stateManager = new StateManager(config.paths.state);
    const state = stateManager.loadState();
    const isFirstRun = state.lastProcessedTimestamp === 0;

    // Scrape messages
    const parsedMessages = await scrapeMessages(chat, isFirstRun);

    if (parsedMessages.length === 0) {
        return {
            success: true,
            messagesProcessed: 0,
            message: 'No new messages to process'
        };
    }

    // Export to CSV
    logger.info('Exporting to CSV...');
    const exportSuccess = await exportToCSV(parsedMessages, config.paths.output);

    if (!exportSuccess) {
        throw new Error('Failed to export messages to CSV');
    }

    logger.success(`Exported ${parsedMessages.length} messages to ${config.paths.output}`);

    return {
        success: true,
        messagesProcessed: parsedMessages.length,
        outputPath: config.paths.output,
        message: `Successfully processed ${parsedMessages.length} new messages`
    };
}

module.exports = {
    scrape,
    scrapeMessages
};
```

**Step 2: Commit**

```bash
git add src/scraper.js
git commit -m "feat: add message scraper with incremental logic and CSV export"
```

---

## Task 9: Main Entry Point

**Files:**
- Create: `index.js`

**Step 1: Create main CLI entry point**

Create file `index.js`:

```javascript
const { createClient, connectWithRetry, findChat } = require('./src/client');
const { scrape } = require('./src/scraper');
const logger = require('./src/logger');
const config = require('./config');

/**
 * Main execution function
 */
async function main() {
    logger.info('=== WhatsApp News Chat Scraper ===');
    logger.info(`Target chat: ${config.whatsapp.chatName}`);
    logger.info(`Headless mode: ${config.whatsapp.headless}`);

    let client;

    try {
        // Create and connect client
        logger.info('Initializing WhatsApp client...');
        client = createClient();
        await connectWithRetry(client);

        // Find target chat
        const chat = await findChat(client, config.whatsapp.chatName);
        if (!chat) {
            throw new Error('Target chat not found');
        }

        // Scrape messages
        logger.info('Starting message scraping...');
        const result = await scrape(chat);

        // Display results
        logger.success('=== Scraping Complete ===');
        logger.success(result.message);
        if (result.outputPath) {
            logger.info(`Output file: ${result.outputPath}`);
        }

    } catch (error) {
        logger.error('=== Scraping Failed ===');
        logger.error(error.message);
        if (error.stack) {
            logger.error(error.stack);
        }
        process.exit(1);
    } finally {
        // Cleanup
        if (client) {
            logger.info('Destroying client...');
            await client.destroy();
        }
        logger.info('Done.');
    }
}

// Run main function
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { main };
```

**Step 2: Test the entry point structure**

Run: `node index.js --help` (will fail without .env but structure should work)

Expected: Script runs and logs initialization messages

**Step 3: Commit**

```bash
git add index.js
git commit -m "feat: add main entry point with error handling and cleanup"
```

---

## Task 10: Documentation

**Files:**
- Create: `README.md`

**Step 1: Create comprehensive README**

Create file `README.md`:

```markdown
# WhatsApp News Chat Scraper

Automated scraper for extracting news messages from WhatsApp group chats to CSV format. Designed for Hebrew language news groups with reporter attribution.

## Features

- ✅ Automated WhatsApp Web scraping via browser automation
- ✅ Persistent session management (no QR re-scanning)
- ✅ Hebrew text support with proper UTF-8 encoding
- ✅ Incremental scraping (only new messages on subsequent runs)
- ✅ Reporter name extraction from message text
- ✅ Link detection and extraction
- ✅ Media presence indicators
- ✅ CSV export with Excel compatibility
- ✅ Retry logic for connection failures
- ✅ Detailed logging

## Requirements

- **Node.js** 18+
- **npm** 8+
- **WhatsApp** account with access to the target chat

## Installation

```bash
# Clone repository
git clone <repository-url>
cd news-chat-scraper

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your chat name
```

## Configuration

Edit `.env` file:

```env
# WhatsApp Configuration
CHAT_NAME=צ'אט הכתבים N12    # Your chat name (partial match works)
HEADLESS=true                # Set to false for first QR scan

# Scraping Settings
MAX_RETRIES=3
RETRY_DELAY=30000

# Logging
LOG_LEVEL=info
```

## Usage

### First Run (QR Authentication)

```bash
# Set headless to false for QR display
# Edit .env: HEADLESS=false

npm start

# Scan QR code with your phone
# Wait for full history scrape
# Check output: data/output/news_chat_data.csv
```

### Subsequent Runs (Headless)

```bash
# Set headless back to true
# Edit .env: HEADLESS=true

npm start

# Runs in background
# Only scrapes new messages
# Appends to existing CSV
```

### Manual Session Reset

```bash
# If session expires or you want to re-authenticate
rm -rf data/.wwebjs_auth
npm start
```

## Output Format

CSV file at `data/output/news_chat_data.csv`:

| Date       | Time     | Sender         | Reporter        | Message           | Has_Media | Links              |
|------------|----------|----------------|-----------------|-------------------|-----------|-------------------|
| 2024-01-15 | 14:32:00 | +972501234567  | בן גולדפריינד   | חדשות חשובות...   | false     |                   |
| 2024-01-15 | 15:45:12 | +972509876543  | שרה כהן         | ראש הממשלה...     | true      | https://example.com |

## Project Structure

```
news-chat-scraper/
├── src/
│   ├── client.js          # WhatsApp client & connection
│   ├── scraper.js         # Message scraping orchestration
│   ├── parser.js          # Message parsing & extraction
│   ├── stateManager.js    # State persistence
│   ├── exporter.js        # CSV export
│   └── logger.js          # Logging utility
├── data/
│   ├── .wwebjs_auth/      # WhatsApp session (auto-generated)
│   ├── state.json         # Scraper state
│   └── output/            # CSV exports
├── logs/                  # Daily log files
├── __tests__/             # Unit tests
├── index.js               # Main entry point
├── config.js              # Configuration
└── package.json
```

## How It Works

1. **Authentication**: First run displays QR code for WhatsApp Web login
2. **Session Persistence**: Browser session saved locally, reused on subsequent runs
3. **Chat Discovery**: Finds target chat by name (partial match)
4. **Message Fetching**:
   - First run: All message history
   - Subsequent runs: Only new messages since last run
5. **Parsing**: Extracts reporter name (first line), message body, links, media indicators
6. **State Management**: Tracks last processed timestamp to avoid duplicates
7. **Export**: Appends parsed data to CSV with proper Hebrew encoding

## Message Format

Expected WhatsApp message structure:

```
בן גולדפריינד                    ← Reporter name (first line)
לאחר התנהגותו במשחק מול...      ← Message body
צ'אט הכתבים N12                 ← Source tag (optional, filtered out)
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- stateManager.test.js

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Troubleshooting

### QR Code Not Displaying
- Set `HEADLESS=false` in `.env`
- Ensure terminal supports UTF-8

### Chat Not Found
- Check exact chat name in WhatsApp
- Use partial match (e.g., "N12" instead of full name)
- Run with `HEADLESS=false` to see available chats in logs

### Session Expired
- Delete session: `rm -rf data/.wwebjs_auth`
- Re-run with `HEADLESS=false` to re-scan QR

### Hebrew Text Garbled in Excel
- Open CSV with UTF-8 encoding
- Or import data (Data > From Text/CSV > UTF-8)

### No New Messages Found
- Check `data/state.json` for last timestamp
- Verify messages exist in WhatsApp after that timestamp
- Delete state file to re-scrape all history

## Logging

Logs saved to `logs/scraper_YYYY-MM-DD.log`:

```
[2024-01-15 14:30:22] INFO: Client initialized
[2024-01-15 14:30:45] SUCCESS: Authentication successful!
[2024-01-15 14:31:10] INFO: Found chat: צ'אט הכתבים N12
[2024-01-15 14:31:15] INFO: Processing 47 new messages
[2024-01-15 14:31:22] SUCCESS: Exported 46 messages to CSV
```

## Future Enhancements

- [ ] Google Sheets API integration
- [ ] Scheduled execution (cron)
- [ ] Multi-chat support
- [ ] Media file download
- [ ] Real-time monitoring mode
- [ ] Web dashboard

## License

MIT

## Contributing

Pull requests welcome! Please include tests for new features.

## Support

For issues or questions, please open a GitHub issue.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with usage and troubleshooting"
```

---

## Task 11: Final Integration Testing

**Files:**
- Verify: All files created and committed

**Step 1: Verify all tests pass**

Run: `npm test`

Expected: All unit tests PASS

**Step 2: Verify project structure**

Run: `ls -R`

Expected: All directories and files present as designed

**Step 3: Create final .env from example**

Run: `cp .env.example .env`

Expected: `.env` file created for user configuration

**Step 4: Verify dependencies installed**

Run: `npm list --depth=0`

Expected: All dependencies listed without errors

**Step 5: Final commit**

```bash
git add .
git commit -m "chore: finalize project setup for MVP deployment"
```

---

## Task 12: Create Quick Start Guide

**Files:**
- Create: `QUICKSTART.md`

**Step 1: Create quick start guide**

Create file `QUICKSTART.md`:

```markdown
# Quick Start Guide

Get the scraper running in 5 minutes.

## Step 1: Install

```bash
cd news-chat-scraper
npm install
```

## Step 2: Configure

Edit `.env`:

```env
CHAT_NAME=צ'אט הכתבים N12  # Your WhatsApp chat name
HEADLESS=false             # Keep false for first run
```

## Step 3: First Run (QR Authentication)

```bash
npm start
```

- QR code will display in terminal
- Open WhatsApp on your phone
- Go to Settings > Linked Devices > Link a Device
- Scan the QR code
- Wait for scraping to complete

## Step 4: Check Output

```bash
cat data/output/news_chat_data.csv
```

Your messages are now in CSV format!

## Step 5: Subsequent Runs (Headless)

Edit `.env`:

```env
HEADLESS=true  # Change to true
```

Run again:

```bash
npm start
```

Only new messages will be scraped and appended.

## Troubleshooting

**Chat not found?**
- Check chat name matches exactly
- Try partial name (e.g., just "N12")

**Session expired?**
```bash
rm -rf data/.wwebjs_auth
npm start  # Re-scan QR code
```

**Need help?** See [README.md](README.md) for full documentation.
```

**Step 2: Commit**

```bash
git add QUICKSTART.md
git commit -m "docs: add quick start guide for rapid deployment"
```

---

## Summary

This implementation plan covers:

1. ✅ **Project Setup** - Dependencies, structure, configuration
2. ✅ **State Manager** - Load/save/update state with tests
3. ✅ **Message Parser** - Hebrew text parsing with link extraction and tests
4. ✅ **CSV Exporter** - UTF-8 export with append mode and tests
5. ✅ **Configuration** - Environment variables and settings
6. ✅ **Logger** - File and console logging utility
7. ✅ **WhatsApp Client** - Connection with retry logic and chat finder
8. ✅ **Message Scraper** - Incremental scraping orchestration
9. ✅ **Main Entry Point** - CLI with error handling
10. ✅ **Documentation** - Comprehensive README and quick start guide
11. ✅ **Testing** - Unit tests for core modules

## Testing Strategy

**Unit Tests (Jest):**
- State Manager: load/save/update operations
- Message Parser: Hebrew text extraction, link detection
- CSV Exporter: file creation, append mode, encoding

**Manual Integration Tests:**
- First run: QR authentication, full history scrape
- Incremental run: new messages only
- Session persistence: headless mode works
- CSV validation: Hebrew text displays correctly in Excel
- Error scenarios: invalid chat, connection failures

## Success Criteria

- All unit tests pass
- First run successfully authenticates and scrapes history
- Incremental runs append only new messages
- Reporter names correctly extracted from Hebrew text
- CSV properly formatted and Excel-compatible
- Session persists across runs
- Errors handled gracefully with helpful messages

---

**Implementation complete!** Ready to run: `npm start`
