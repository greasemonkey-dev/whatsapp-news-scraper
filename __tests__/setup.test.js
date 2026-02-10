/**
 * Basic setup test to verify Jest configuration
 */

describe('Project Setup', () => {
  test('should pass basic Jest setup test', () => {
    expect(true).toBe(true);
  });

  test('should have access to Node.js environment', () => {
    expect(process.env).toBeDefined();
  });
});
