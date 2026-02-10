const StateManager = require('../src/stateManager');
const fs = require('fs').promises;
const path = require('path');

describe('StateManager', () => {
  const testStateDir = path.join(__dirname, '../data');
  const testStatePath = path.join(testStateDir, 'scraper-state.json');
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager(testStatePath);
  });

  afterEach(async () => {
    // Clean up test state file if it exists
    try {
      await fs.unlink(testStatePath);
    } catch (error) {
      // File doesn't exist, ignore
    }
  });

  describe('loadState', () => {
    test('should return default state when file does not exist', async () => {
      const state = await stateManager.loadState();

      expect(state).toEqual({
        chatId: null,
        chatName: null,
        lastProcessedTimestamp: null,
        lastRunDate: null,
        totalMessagesProcessed: 0
      });
    });

    test('should load existing state from file', async () => {
      const existingState = {
        chatId: '123456789@c.us',
        chatName: 'Test News Chat',
        lastProcessedTimestamp: 1707580800000,
        lastRunDate: '2024-02-10T12:00:00.000Z',
        totalMessagesProcessed: 42
      };

      // Create state file
      await fs.writeFile(testStatePath, JSON.stringify(existingState, null, 2));

      const state = await stateManager.loadState();
      expect(state).toEqual(existingState);
    });

    test('should handle corrupted state file gracefully', async () => {
      // Write invalid JSON
      await fs.writeFile(testStatePath, 'invalid json content');

      const state = await stateManager.loadState();

      // Should return default state when file is corrupted
      expect(state).toEqual({
        chatId: null,
        chatName: null,
        lastProcessedTimestamp: null,
        lastRunDate: null,
        totalMessagesProcessed: 0
      });
    });
  });

  describe('saveState', () => {
    test('should save state to file with proper formatting', async () => {
      const stateToSave = {
        chatId: '987654321@c.us',
        chatName: 'Another News Chat',
        lastProcessedTimestamp: 1707667200000,
        lastRunDate: '2024-02-11T12:00:00.000Z',
        totalMessagesProcessed: 100
      };

      await stateManager.saveState(stateToSave);

      // Verify file was created
      const fileContent = await fs.readFile(testStatePath, 'utf8');
      const savedState = JSON.parse(fileContent);
      expect(savedState).toEqual(stateToSave);
    });

    test('should create state directory if it does not exist', async () => {
      const newDir = path.join(__dirname, '../data/test-dir');
      const newStatePath = path.join(newDir, 'state.json');
      const newStateManager = new StateManager(newStatePath);

      const stateToSave = {
        chatId: '111222333@c.us',
        chatName: 'Test Chat',
        lastProcessedTimestamp: 1707580800000,
        lastRunDate: '2024-02-10T12:00:00.000Z',
        totalMessagesProcessed: 5
      };

      await newStateManager.saveState(stateToSave);

      // Verify file was created
      const fileContent = await fs.readFile(newStatePath, 'utf8');
      const savedState = JSON.parse(fileContent);
      expect(savedState).toEqual(stateToSave);

      // Cleanup
      await fs.unlink(newStatePath);
      await fs.rmdir(newDir);
    });

    test('should overwrite existing state file', async () => {
      const initialState = {
        chatId: 'old@c.us',
        chatName: 'Old Chat',
        lastProcessedTimestamp: 1000000000000,
        lastRunDate: '2023-01-01T00:00:00.000Z',
        totalMessagesProcessed: 10
      };

      const newState = {
        chatId: 'new@c.us',
        chatName: 'New Chat',
        lastProcessedTimestamp: 2000000000000,
        lastRunDate: '2024-01-01T00:00:00.000Z',
        totalMessagesProcessed: 20
      };

      await stateManager.saveState(initialState);
      await stateManager.saveState(newState);

      const fileContent = await fs.readFile(testStatePath, 'utf8');
      const savedState = JSON.parse(fileContent);
      expect(savedState).toEqual(newState);
    });
  });

  describe('updateState', () => {
    test('should merge new data with existing state', async () => {
      const existingState = {
        chatId: '123456789@c.us',
        chatName: 'News Chat',
        lastProcessedTimestamp: 1707580800000,
        lastRunDate: '2024-02-10T12:00:00.000Z',
        totalMessagesProcessed: 50
      };

      await stateManager.saveState(existingState);

      const updates = {
        lastProcessedTimestamp: 1707667200000,
        lastRunDate: '2024-02-11T12:00:00.000Z',
        totalMessagesProcessed: 75
      };

      await stateManager.updateState(updates);

      const updatedState = await stateManager.loadState();
      expect(updatedState).toEqual({
        chatId: '123456789@c.us',
        chatName: 'News Chat',
        lastProcessedTimestamp: 1707667200000,
        lastRunDate: '2024-02-11T12:00:00.000Z',
        totalMessagesProcessed: 75
      });
    });

    test('should merge with default state if file does not exist', async () => {
      const updates = {
        chatId: '999888777@c.us',
        chatName: 'New Chat',
        lastProcessedTimestamp: 1707753600000,
        totalMessagesProcessed: 10
      };

      await stateManager.updateState(updates);

      const updatedState = await stateManager.loadState();
      expect(updatedState).toEqual({
        chatId: '999888777@c.us',
        chatName: 'New Chat',
        lastProcessedTimestamp: 1707753600000,
        lastRunDate: null,
        totalMessagesProcessed: 10
      });
    });

    test('should handle partial updates', async () => {
      const existingState = {
        chatId: '123456789@c.us',
        chatName: 'News Chat',
        lastProcessedTimestamp: 1707580800000,
        lastRunDate: '2024-02-10T12:00:00.000Z',
        totalMessagesProcessed: 50
      };

      await stateManager.saveState(existingState);

      // Only update totalMessagesProcessed
      const updates = {
        totalMessagesProcessed: 100
      };

      await stateManager.updateState(updates);

      const updatedState = await stateManager.loadState();
      expect(updatedState).toEqual({
        chatId: '123456789@c.us',
        chatName: 'News Chat',
        lastProcessedTimestamp: 1707580800000,
        lastRunDate: '2024-02-10T12:00:00.000Z',
        totalMessagesProcessed: 100
      });
    });
  });
});
