#!/usr/bin/env node

const { exportToCSV } = require('./src/exporter');
const fs = require('fs');
const path = require('path');

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

let passed = 0;
let failed = 0;

const testOutputDir = path.join(__dirname, 'data/test-output');
const testCsvPath = path.join(testOutputDir, 'test-export.csv');

function setup() {
  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
  }
}

function cleanup() {
  if (fs.existsSync(testCsvPath)) {
    fs.unlinkSync(testCsvPath);
  }
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${message}`);
    passed++;
  } else {
    console.log(`  ${RED}✗${RESET} ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n' + YELLOW + 'Running CSV Exporter Tests' + RESET + '\n');

  setup();

  // Test 1: Create new CSV with headers and data
  console.log('Test 1: should create new CSV file with headers and data');
  cleanup();
  const messages1 = [
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

  await exportToCSV(messages1, testCsvPath);
  const exists1 = fs.existsSync(testCsvPath);
  assert(exists1, 'File should exist');

  const content1 = fs.readFileSync(testCsvPath, 'utf8');
  const lines1 = content1.trim().split('\n');
  assert(lines1[0] === 'Date,Time,Sender,Reporter,Message,Has_Media,Links', 'Header should be correct');
  assert(content1.includes('בן גולדפריינד'), 'Should contain Hebrew reporter name');
  assert(content1.includes('חדשות חשובות'), 'Should contain Hebrew content');

  // Test 2: Export multiple messages
  console.log('\nTest 2: should export multiple messages correctly');
  cleanup();
  const messages2 = [
    {
      date: '15/01/2024',
      time: '14:32:00',
      sender: '+972501234567',
      reporter: 'בן גולדפריינד',
      content: 'הודעה ראשונה',
      hasMedia: false,
      links: []
    },
    {
      date: '15/01/2024',
      time: '15:45:00',
      sender: '+972509876543',
      reporter: 'דני קושמרו',
      content: 'הודעה שנייה',
      hasMedia: true,
      links: ['https://www.example.com']
    }
  ];

  await exportToCSV(messages2, testCsvPath);
  const content2 = fs.readFileSync(testCsvPath, 'utf8');
  const lines2 = content2.trim().split('\n');
  assert(lines2.length === 3, 'Should have 3 lines (header + 2 data rows)');
  assert(content2.includes('בן גולדפריינד'), 'Should contain first reporter');
  assert(content2.includes('דני קושמרו'), 'Should contain second reporter');

  // Test 3: Handle messages with links
  console.log('\nTest 3: should handle messages with links correctly');
  cleanup();
  const messages3 = [
    {
      date: '15/01/2024',
      time: '16:00:00',
      sender: '+972501234567',
      reporter: 'רועי שרון',
      content: 'הודעה עם קישור',
      hasMedia: false,
      links: ['https://www.ynet.co.il/news/123', 'https://www.mako.co.il/news/456']
    }
  ];

  await exportToCSV(messages3, testCsvPath);
  const content3 = fs.readFileSync(testCsvPath, 'utf8');
  assert(content3.includes('https://www.ynet.co.il/news/123'), 'Should contain first link');
  assert(content3.includes('https://www.mako.co.il/news/456'), 'Should contain second link');

  // Test 4: Append mode without duplicate headers
  console.log('\nTest 4: should append to existing CSV without duplicate headers');
  cleanup();
  const messages4a = [
    {
      date: '15/01/2024',
      time: '14:00:00',
      sender: '+972501234567',
      reporter: 'כתב 1',
      content: 'הודעה ראשונה',
      hasMedia: false,
      links: []
    }
  ];

  await exportToCSV(messages4a, testCsvPath);

  const messages4b = [
    {
      date: '15/01/2024',
      time: '15:00:00',
      sender: '+972509876543',
      reporter: 'כתב 2',
      content: 'הודעה שנייה',
      hasMedia: false,
      links: []
    }
  ];

  await exportToCSV(messages4b, testCsvPath, { append: true });

  const content4 = fs.readFileSync(testCsvPath, 'utf8');
  const lines4 = content4.trim().split('\n');
  assert(lines4.length === 3, 'Should have 3 lines (header + 2 data rows)');

  const headerCount = lines4.filter(line => line.startsWith('Date,Time,Sender')).length;
  assert(headerCount === 1, 'Should have only 1 header');
  assert(content4.includes('כתב 1'), 'Should contain first message');
  assert(content4.includes('כתב 2'), 'Should contain second message');

  // Test 5: Append mode when file doesn't exist
  console.log('\nTest 5: should create new file if append mode used but file does not exist');
  cleanup();
  const messages5 = [
    {
      date: '15/01/2024',
      time: '14:00:00',
      sender: '+972501234567',
      reporter: 'כתב חדש',
      content: 'הודעה חדשה',
      hasMedia: false,
      links: []
    }
  ];

  await exportToCSV(messages5, testCsvPath, { append: true });
  const content5 = fs.readFileSync(testCsvPath, 'utf8');
  const lines5 = content5.trim().split('\n');
  assert(lines5.length === 2, 'Should have header + 1 data row');
  assert(lines5[0] === 'Date,Time,Sender,Reporter,Message,Has_Media,Links', 'Should have header');

  // Test 6: Multi-line messages
  console.log('\nTest 6: should handle multi-line messages with proper escaping');
  cleanup();
  const messages6 = [
    {
      date: '15/01/2024',
      time: '17:00:00',
      sender: '+972501234567',
      reporter: 'נדב איל',
      content: 'שורה ראשונה\nשורה שנייה\nשורה שלישית',
      hasMedia: false,
      links: []
    }
  ];

  await exportToCSV(messages6, testCsvPath);
  const content6 = fs.readFileSync(testCsvPath, 'utf8');
  assert(content6.includes('נדב איל'), 'Should contain reporter name');
  assert(content6.includes('שורה ראשונה'), 'Should contain first line');
  assert(content6.includes('שורה שנייה'), 'Should contain second line');
  assert(content6.includes('שורה שלישית'), 'Should contain third line');

  // Test 7: Messages with quotes and commas
  console.log('\nTest 7: should handle messages with quotes and commas');
  cleanup();
  const messages7 = [
    {
      date: '15/01/2024',
      time: '18:00:00',
      sender: '+972501234567',
      reporter: 'אורית פרל',
      content: 'הודעה עם "ציטוט", ופסיק',
      hasMedia: false,
      links: []
    }
  ];

  await exportToCSV(messages7, testCsvPath);
  const content7 = fs.readFileSync(testCsvPath, 'utf8');
  assert(content7.includes('אורית פרל'), 'Should contain reporter name');
  assert(content7.includes('ציטוט'), 'Should contain quoted text');

  // Test 8: Empty content
  console.log('\nTest 8: should handle empty content gracefully');
  cleanup();
  const messages8 = [
    {
      date: '15/01/2024',
      time: '19:00:00',
      sender: '+972501234567',
      reporter: 'שי גולדשטיין',
      content: '',
      hasMedia: false,
      links: []
    }
  ];

  await exportToCSV(messages8, testCsvPath);
  const content8 = fs.readFileSync(testCsvPath, 'utf8');
  const lines8 = content8.trim().split('\n');
  assert(lines8.length === 2, 'Should have header + 1 data row');
  assert(content8.includes('שי גולדשטיין'), 'Should contain reporter name');

  // Test 9: UTF-8 encoding
  console.log('\nTest 9: should maintain UTF-8 encoding for Hebrew text');
  cleanup();
  const messages9 = [
    {
      date: '15/01/2024',
      time: '20:00:00',
      sender: '+972501234567',
      reporter: 'בן גולדפריינד',
      content: 'טקסט בעברית עם אותיות מיוחדות: א, ב, ג, ד',
      hasMedia: false,
      links: []
    }
  ];

  await exportToCSV(messages9, testCsvPath);
  const content9 = fs.readFileSync(testCsvPath, 'utf8');
  assert(content9.includes('בן גולדפריינד'), 'Should contain Hebrew reporter name');
  assert(content9.includes('טקסט בעברית'), 'Should contain Hebrew text');
  assert(content9.includes('אותיות מיוחדות'), 'Should contain Hebrew special text');

  // Test 10: Empty messages array
  console.log('\nTest 10: should handle empty messages array');
  cleanup();
  const messages10 = [];

  await exportToCSV(messages10, testCsvPath);
  const content10 = fs.readFileSync(testCsvPath, 'utf8');
  const lines10 = content10.trim().split('\n');
  assert(lines10.length === 1, 'Should have only header');
  assert(lines10[0] === 'Date,Time,Sender,Reporter,Message,Has_Media,Links', 'Should have correct header');

  // Test 11: Error handling - invalid path
  console.log('\nTest 11: should throw error for invalid file path');
  const invalidPath = '/invalid/path/that/does/not/exist/file.csv';
  try {
    await exportToCSV([{ date: '15/01/2024', time: '14:00:00', sender: '+972501234567', reporter: 'כתב', content: 'הודעה', hasMedia: false, links: [] }], invalidPath);
    assert(false, 'Should throw error for invalid path');
  } catch (error) {
    assert(true, 'Should throw error for invalid path');
  }

  // Cleanup
  cleanup();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`${GREEN}Passed: ${passed}${RESET}`);
  console.log(`${RED}Failed: ${failed}${RESET}`);
  console.log('='.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error(RED + 'Test suite failed:' + RESET, error);
  process.exit(1);
});
