const { exportToCSV } = require('../src/exporter');
const fs = require('fs');
const path = require('path');

describe('CSV Exporter', () => {
  const testOutputDir = path.join(__dirname, '../data/test-output');
  const testCsvPath = path.join(testOutputDir, 'test-export.csv');

  // Setup: Create test output directory
  beforeAll(() => {
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  // Cleanup: Remove test file after each test
  afterEach(() => {
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
  });

  // Cleanup: Remove test directory after all tests
  afterAll(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('exportToCSV - new file creation', () => {
    test('should create new CSV file with headers and data', async () => {
      const messages = [
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

      await exportToCSV(messages, testCsvPath);

      // Verify file exists
      expect(fs.existsSync(testCsvPath)).toBe(true);

      // Read and verify content
      const content = fs.readFileSync(testCsvPath, 'utf8');
      const lines = content.trim().split('\n');

      // Check header
      expect(lines[0]).toBe('Date,Time,Sender,Reporter,Message,Has_Media,Links');

      // Check data row
      expect(lines[1]).toContain('15/01/2024');
      expect(lines[1]).toContain('14:32:00');
      expect(lines[1]).toContain('+972501234567');
      expect(lines[1]).toContain('בן גולדפריינד');
      expect(lines[1]).toContain('חדשות חשובות');
      expect(lines[1]).toContain('false');
    });

    test('should export multiple messages correctly', async () => {
      const messages = [
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

      await exportToCSV(messages, testCsvPath);

      const content = fs.readFileSync(testCsvPath, 'utf8');
      const lines = content.trim().split('\n');

      // Should have header + 2 data rows
      expect(lines.length).toBe(3);
      expect(lines[1]).toContain('בן גולדפריינד');
      expect(lines[2]).toContain('דני קושמרו');
    });

    test('should handle messages with links correctly', async () => {
      const messages = [
        {
          date: '15/01/2024',
          time: '16:00:00',
          sender: '+972501234567',
          reporter: 'רועי שרון',
          content: 'הודעה עם קישור https://www.ynet.co.il/news/123',
          hasMedia: false,
          links: ['https://www.ynet.co.il/news/123', 'https://www.mako.co.il/news/456']
        }
      ];

      await exportToCSV(messages, testCsvPath);

      const content = fs.readFileSync(testCsvPath, 'utf8');
      const lines = content.trim().split('\n');

      // Links should be formatted as comma-separated in the Links column
      expect(lines[1]).toContain('https://www.ynet.co.il/news/123');
      expect(lines[1]).toContain('https://www.mako.co.il/news/456');
    });
  });

  describe('exportToCSV - append mode', () => {
    test('should append to existing CSV without duplicate headers', async () => {
      // First export
      const messages1 = [
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

      await exportToCSV(messages1, testCsvPath);

      // Second export (append mode)
      const messages2 = [
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

      await exportToCSV(messages2, testCsvPath, { append: true });

      const content = fs.readFileSync(testCsvPath, 'utf8');
      const lines = content.trim().split('\n');

      // Should have header + 2 data rows (no duplicate header)
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('Date,Time,Sender,Reporter,Message,Has_Media,Links');
      expect(lines[1]).toContain('כתב 1');
      expect(lines[2]).toContain('כתב 2');

      // Count headers (should only be 1)
      const headerCount = lines.filter(line => line.startsWith('Date,Time,Sender')).length;
      expect(headerCount).toBe(1);
    });

    test('should create new file if append mode used but file does not exist', async () => {
      const messages = [
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

      // File doesn't exist, but append mode is true
      await exportToCSV(messages, testCsvPath, { append: true });

      // Should create file with headers
      const content = fs.readFileSync(testCsvPath, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(2); // header + 1 data row
      expect(lines[0]).toBe('Date,Time,Sender,Reporter,Message,Has_Media,Links');
    });
  });

  describe('exportToCSV - multi-line message handling', () => {
    test('should handle multi-line messages with proper escaping', async () => {
      const messages = [
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

      await exportToCSV(messages, testCsvPath);

      const content = fs.readFileSync(testCsvPath, 'utf8');

      // Verify file exists and contains data
      expect(content).toContain('נדב איל');
      expect(content).toContain('שורה ראשונה');
      expect(content).toContain('שורה שנייה');
      expect(content).toContain('שורה שלישית');
    });

    test('should handle messages with quotes and commas', async () => {
      const messages = [
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

      await exportToCSV(messages, testCsvPath);

      const content = fs.readFileSync(testCsvPath, 'utf8');

      // CSV should properly escape quotes and commas
      expect(content).toContain('אורית פרל');
      expect(content).toContain('ציטוט');
    });

    test('should handle empty content gracefully', async () => {
      const messages = [
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

      await exportToCSV(messages, testCsvPath);

      const content = fs.readFileSync(testCsvPath, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(2); // header + 1 data row
      expect(lines[1]).toContain('שי גולדשטיין');
    });
  });

  describe('exportToCSV - UTF-8 encoding', () => {
    test('should maintain UTF-8 encoding for Hebrew text', async () => {
      const messages = [
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

      await exportToCSV(messages, testCsvPath);

      // Read with UTF-8 encoding explicitly
      const content = fs.readFileSync(testCsvPath, 'utf8');

      // Verify Hebrew characters are preserved
      expect(content).toContain('בן גולדפריינד');
      expect(content).toContain('טקסט בעברית');
      expect(content).toContain('אותיות מיוחדות');
    });
  });

  describe('exportToCSV - error handling', () => {
    test('should throw error for invalid file path', async () => {
      const messages = [
        {
          date: '15/01/2024',
          time: '14:00:00',
          sender: '+972501234567',
          reporter: 'כתב',
          content: 'הודעה',
          hasMedia: false,
          links: []
        }
      ];

      const invalidPath = '/invalid/path/that/does/not/exist/file.csv';

      await expect(exportToCSV(messages, invalidPath)).rejects.toThrow();
    });

    test('should handle empty messages array', async () => {
      const messages = [];

      await exportToCSV(messages, testCsvPath);

      // Should create file with just headers
      const content = fs.readFileSync(testCsvPath, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(1); // Only header
      expect(lines[0]).toBe('Date,Time,Sender,Reporter,Message,Has_Media,Links');
    });
  });
});
