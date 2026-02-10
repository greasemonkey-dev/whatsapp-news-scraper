const { parseMessage, formatDate, formatTime } = require('../src/parser');

describe('Message Parser', () => {
  describe('parseMessage', () => {
    test('should parse basic Hebrew message with reporter name', () => {
      const messageText = `בן גולדפריינד
לאחר התנהגותו במשחק מול ארצות הברית, שחקן הכדורסל האמריקאי נענש בהשעיה של משחק אחד.
צ'אט הכתבים N12`;

      const timestamp = new Date('2024-02-10T14:30:00Z').getTime() / 1000;

      const result = parseMessage(messageText, timestamp);

      expect(result.reporter).toBe('בן גולדפריינד');
      expect(result.content).toBe('לאחר התנהגותו במשחק מול ארצות הברית, שחקן הכדורסל האמריקאי נענש בהשעיה של משחק אחד.');
      expect(result.date).toBe('10/02/2024');
      expect(result.time).toBe('14:30');
      expect(result.links).toEqual([]);
      expect(result.hasMedia).toBe(false);
    });

    test('should extract links from message content', () => {
      const messageText = `דני קושמרו
ראש הממשלה נתניהו נפגש עם נשיא ארה"ב.
מידע נוסף: https://www.example.com/news/article
https://www.ynet.co.il/news/123456
צ'אט הכתבים`;

      const timestamp = new Date('2024-02-10T15:00:00Z').getTime() / 1000;

      const result = parseMessage(messageText, timestamp);

      expect(result.reporter).toBe('דני קושמרו');
      expect(result.links).toEqual([
        'https://www.example.com/news/article',
        'https://www.ynet.co.il/news/123456'
      ]);
      expect(result.content).toContain('https://www.example.com/news/article');
    });

    test('should parse message without source tag', () => {
      const messageText = `רועי שרון
דיווח חדש מזירת האירועים בעזה.
המצב בשטח ממשיך להתפתח.`;

      const timestamp = new Date('2024-02-10T16:00:00Z').getTime() / 1000;

      const result = parseMessage(messageText, timestamp);

      expect(result.reporter).toBe('רועי שרון');
      expect(result.content).toBe('דיווח חדש מזירת האירועים בעזה.\nמצב בשטח ממשיך להתפתח.');
      expect(result.date).toBe('10/02/2024');
      expect(result.time).toBe('16:00');
    });

    test('should detect media in messages', () => {
      const messageText = `אורית פרל
תמונה מזירת האירועים
[צילום: רויטרס]
צ'אט הכתבים`;

      const timestamp = new Date('2024-02-10T17:00:00Z').getTime() / 1000;
      const hasMedia = true; // This would be passed from the message object

      const result = parseMessage(messageText, timestamp, hasMedia);

      expect(result.reporter).toBe('אורית פרל');
      expect(result.hasMedia).toBe(true);
    });

    test('should handle empty or malformed messages', () => {
      const timestamp = new Date('2024-02-10T18:00:00Z').getTime() / 1000;

      // Empty message
      const result1 = parseMessage('', timestamp);
      expect(result1.reporter).toBe('');
      expect(result1.content).toBe('');
      expect(result1.links).toEqual([]);

      // Only whitespace
      const result2 = parseMessage('   \n  \n  ', timestamp);
      expect(result2.reporter).toBe('');
      expect(result2.content).toBe('');

      // Null/undefined
      const result3 = parseMessage(null, timestamp);
      expect(result3.reporter).toBe('');
      expect(result3.content).toBe('');

      const result4 = parseMessage(undefined, timestamp);
      expect(result4.reporter).toBe('');
      expect(result4.content).toBe('');
    });

    test('should handle message with only reporter name', () => {
      const messageText = `שי גולדשטיין`;
      const timestamp = new Date('2024-02-10T19:00:00Z').getTime() / 1000;

      const result = parseMessage(messageText, timestamp);

      expect(result.reporter).toBe('שי גולדשטיין');
      expect(result.content).toBe('');
      expect(result.links).toEqual([]);
    });

    test('should handle multiline content correctly', () => {
      const messageText = `נדב איל
שורה ראשונה של התוכן
שורה שנייה של התוכן
שורה שלישית של התוכן
צ'אט הכתבים`;

      const timestamp = new Date('2024-02-10T20:00:00Z').getTime() / 1000;

      const result = parseMessage(messageText, timestamp);

      expect(result.reporter).toBe('נדב איל');
      expect(result.content).toBe('שורה ראשונה של התוכן\nשורה שנייה של התוכן\nשורה שלישית של התוכן');
    });

    test('should filter out different source tag variations', () => {
      const messageText1 = `כתב 1
תוכן הודעה
קבוצת כתבים`;

      const messageText2 = `כתב 2
תוכן הודעה
chat reporters`;

      const timestamp = new Date('2024-02-10T21:00:00Z').getTime() / 1000;

      const result1 = parseMessage(messageText1, timestamp);
      expect(result1.content).toBe('תוכן הודעה');
      expect(result1.content).not.toContain('קבוצת');

      const result2 = parseMessage(messageText2, timestamp);
      expect(result2.content).toBe('תוכן הודעה');
      expect(result2.content).not.toContain('chat');
    });
  });

  describe('formatDate', () => {
    test('should format timestamp to DD/MM/YYYY', () => {
      const timestamp = new Date('2024-02-10T14:30:00Z').getTime() / 1000;
      expect(formatDate(timestamp)).toBe('10/02/2024');
    });

    test('should handle different dates correctly', () => {
      const timestamp = new Date('2024-12-25T08:15:30Z').getTime() / 1000;
      expect(formatDate(timestamp)).toBe('25/12/2024');
    });

    test('should pad single digit day and month', () => {
      const timestamp = new Date('2024-01-05T08:15:30Z').getTime() / 1000;
      expect(formatDate(timestamp)).toBe('05/01/2024');
    });
  });

  describe('formatTime', () => {
    test('should format timestamp to HH:MM', () => {
      const timestamp = new Date('2024-02-10T14:30:00Z').getTime() / 1000;
      expect(formatTime(timestamp)).toBe('14:30');
    });

    test('should handle different times correctly', () => {
      const timestamp = new Date('2024-02-10T08:05:00Z').getTime() / 1000;
      expect(formatTime(timestamp)).toBe('08:05');
    });

    test('should pad single digit hour and minute', () => {
      const timestamp = new Date('2024-02-10T03:07:00Z').getTime() / 1000;
      expect(formatTime(timestamp)).toBe('03:07');
    });
  });
});
