// Test setup file
import { jest } from '@jest/globals';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock console methods globally to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global timeout for all tests
jest.setTimeout(30000);

// Cleanup after all tests complete
afterAll(async () => {
  // Give time for connections to close gracefully
  await new Promise(resolve => setTimeout(resolve, 500));
});
