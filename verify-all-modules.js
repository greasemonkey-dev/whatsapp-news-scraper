#!/usr/bin/env node

/**
 * Standalone Module Verification Script
 * Tests all modules without Jest to verify functionality
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, testName) {
  if (condition) {
    log(`  ✓ ${testName}`, 'green');
    passCount++;
  } else {
    log(`  ✗ ${testName}`, 'red');
    failCount++;
  }
}

async function cleanup(filepath) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

async function testStateManager() {
  log('\n📦 Testing State Manager Module...', 'cyan');

  const StateManager = require('./src/stateManager');
  const testPath = path.join(__dirname, 'test-state-verify.json');

  try {
    await cleanup(testPath);

    const manager = new StateManager(testPath);

    // Test 1: Load default state
    const defaultState = await manager.loadState();
    assert(defaultState.lastProcessedTimestamp === 0, 'loads default state with timestamp 0');
    assert(defaultState.totalMessagesProcessed === 0, 'loads default state with 0 messages');

    // Test 2: Save state
    const testState = {
      chatId: '123@g.us',
      chatName: 'Test Chat',
      lastProcessedTimestamp: 1000,
      lastRunDate: '2024-01-01',
      totalMessagesProcessed: 50
    };
    await manager.saveState(testState);
    assert(fs.existsSync(testPath), 'creates state file');

    // Test 3: Load saved state
    const loaded = await manager.loadState();
    assert(loaded.chatId === '123@g.us', 'loads saved chatId');
    assert(loaded.lastProcessedTimestamp === 1000, 'loads saved timestamp');

    // Test 4: Update state
    await manager.updateState({ lastProcessedTimestamp: 2000 });
    const updated = await manager.loadState();
    assert(updated.lastProcessedTimestamp === 2000, 'updates timestamp');
    assert(updated.chatId === '123@g.us', 'preserves other fields');
    assert(updated.lastRunDate !== null, 'auto-updates lastRunDate');

    await cleanup(testPath);
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    failCount++;
  }
}

async function testParser() {
  log('\n🔤 Testing Parser Module...', 'cyan');

  const { parseMessage, formatDate, formatTime } = require('./src/parser');

  try {
    // Test 1: Basic parsing
    const msg = {
      body: 'בן גולדפריינד\nחדשות חשובות\nצ\'אט הכתבים N12',
      timestamp: 1704067200,
      author: '+972501234567',
      hasMedia: false
    };

    const result = parseMessage(msg.body, msg.timestamp, msg.hasMedia);
    assert(result.reporter === 'בן גולדפריינד', 'extracts Hebrew reporter name');
    assert(result.content === 'חדשות חשובות', 'extracts message content');
    assert(result.hasMedia === false, 'handles media flag');

    // Test 2: Link extraction
    const msgWithLinks = {
      body: 'שרה כהן\nחדשות https://example.com ועוד https://test.com',
      timestamp: 1704067200,
      hasMedia: false
    };

    const resultWithLinks = parseMessage(msgWithLinks.body, msgWithLinks.timestamp, msgWithLinks.hasMedia);
    assert(Array.isArray(resultWithLinks.links), 'links is an array');
    assert(resultWithLinks.links.length === 2, 'extracts both links');

    // Test 3: Date formatting
    const date = formatDate(1704067200);
    assert(date.match(/^\d{2}\/\d{2}\/\d{4}$/), 'formats date correctly');

    // Test 4: Time formatting
    const time = formatTime(1704067200);
    assert(time.match(/^\d{2}:\d{2}$/), 'formats time correctly');

  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    failCount++;
  }
}

async function testExporter() {
  log('\n📊 Testing CSV Exporter Module...', 'cyan');

  const { exportToCSV } = require('./src/exporter');
  const testDir = path.join(__dirname, 'test-export-verify');
  const testPath = path.join(testDir, 'test.csv');

  try {
    // Cleanup
    if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
    if (fs.existsSync(testDir)) fs.rmdirSync(testDir);

    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const testData = [
      {
        date: '15/01/2024',
        time: '14:32:00',
        sender: '+972501234567',
        reporter: 'בן גולדפריינד',
        content: 'חדשות חשובות',
        hasMedia: false,
        links: []
      }
    ];

    // Test 1: Create CSV
    await exportToCSV(testData, testPath);
    assert(fs.existsSync(testPath), 'creates CSV file');

    // Test 2: Check content
    const content = fs.readFileSync(testPath, 'utf8');
    assert(content.includes('Date,Time,Sender'), 'includes headers');
    assert(content.includes('בן גולדפריינד'), 'preserves Hebrew text');
    assert(content.includes('חדשות חשובות'), 'includes message content');

    // Test 3: Append mode
    const moreData = [
      {
        date: '15/01/2024',
        time: '15:00:00',
        sender: '+972509876543',
        reporter: 'שרה כהן',
        content: 'עוד חדשות',
        hasMedia: true,
        links: ['https://example.com']
      }
    ];

    await exportToCSV(moreData, testPath, { append: true });
    const appendedContent = fs.readFileSync(testPath, 'utf8');
    const lines = appendedContent.trim().split('\n');
    assert(lines.length === 3, 'appends without duplicate headers (1 header + 2 data rows)');

    // Cleanup
    if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
    if (fs.existsSync(testDir)) fs.rmdirSync(testDir);

  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    failCount++;
  }
}

async function testConfig() {
  log('\n⚙️  Testing Configuration Module...', 'cyan');

  try {
    const config = require('./src/config');

    assert(config.whatsapp !== undefined, 'has whatsapp config');
    assert(config.scraping !== undefined, 'has scraping config');
    assert(config.logging !== undefined, 'has logging config');
    assert(config.paths !== undefined, 'has paths config');
    assert(typeof config.whatsapp.headless === 'boolean', 'headless is boolean');
    assert(typeof config.scraping.maxRetries === 'number', 'maxRetries is number');

  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    failCount++;
  }
}

async function testLogger() {
  log('\n📝 Testing Logger Module...', 'cyan');

  try {
    const logger = require('./src/logger');

    assert(typeof logger.info === 'function', 'has info method');
    assert(typeof logger.warn === 'function', 'has warn method');
    assert(typeof logger.error === 'function', 'has error method');
    assert(typeof logger.success === 'function', 'has success method');

    // Test logging (output will appear)
    log('  Testing log output:', 'yellow');
    logger.info('Test info message');
    logger.success('Test success message');

  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    failCount++;
  }
}

async function runAllTests() {
  log('═══════════════════════════════════════════', 'cyan');
  log('  WhatsApp Scraper Module Verification', 'cyan');
  log('═══════════════════════════════════════════', 'cyan');

  await testStateManager();
  await testParser();
  await testExporter();
  await testConfig();
  await testLogger();

  log('\n═══════════════════════════════════════════', 'cyan');
  log(`  Results: ${passCount} passed, ${failCount} failed`,
    failCount === 0 ? 'green' : 'red');
  log('═══════════════════════════════════════════', 'cyan');

  if (failCount === 0) {
    log('\n✅ All modules verified successfully!', 'green');
    log('The WhatsApp scraper is ready to use.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Please review the output above.', 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
