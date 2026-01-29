const { test, describe, it, mock, beforeEach } = require('node:test');
const assert = require('node:assert');
const Module = require('module');

// Create spies for the methods we want to observe
const queryMock = mock.fn();
const releaseMock = mock.fn();
const connectMock = mock.fn(async () => ({
  query: queryMock,
  release: releaseMock
}));

// Mock the Pool class
class MockPool {
  constructor(config) {
    this.config = config;
  }
  connect = connectMock;
}

// Intercept CommonJS require to mock 'pg'
// We use mock.method on Module.prototype.require to handle the import of 'pg' inside points.js
const originalRequire = Module.prototype.require;
mock.method(Module.prototype, 'require', function(path) {
  if (path === 'pg') {
    return { Pool: MockPool };
  }
  return originalRequire.apply(this, arguments);
});

// Now require the module under test
const points = require('../points');

describe('Points Module', () => {

  beforeEach(() => {
    // Reset call counts between tests
    queryMock.mock.resetCalls();
    releaseMock.mock.resetCalls();
    connectMock.mock.resetCalls();
  });

  describe('retrieveTopScores', () => {
    it('should connect, query, release, and return rows', async () => {
      // Arrange
      const fakeRows = [
        { item: 'Alice', score: 10 },
        { item: 'Bob', score: 5 }
      ];
      
      // Setup the query mock to return our fake data
      queryMock.mock.mockImplementationOnce(async () => {
        return { rows: fakeRows, rowCount: 2 };
      });

      // Act
      const result = await points.retrieveTopScores();

      // Assert
      assert.strictEqual(connectMock.mock.calls.length, 1, 'Should call connect once');
      assert.strictEqual(queryMock.mock.calls.length, 1, 'Should call query once');
      
      // Verify the SQL query contained specific keywords
      const sqlCall = queryMock.mock.calls[0].arguments[0];
      assert.match(sqlCall, /SELECT/, 'Query should select');
      assert.match(sqlCall, /scores/, 'Query should query scores table');
      assert.match(sqlCall, /ORDER BY score DESC/, 'Query should order by score');

      assert.strictEqual(releaseMock.mock.calls.length, 1, 'Should release the client');
      assert.deepStrictEqual(result, fakeRows, 'Should return the rows from DB');
    });
  });

  describe('updateScore', () => {
    it('should initialize table, update score, and return new value', async () => {
      // Arrange
      const item = 'Charlie';
      const operation = '+'; // logic in points.js appends '1' to this
      const expectedScore = 42;

      // updateScore calls query() multiple times:
      // 1. Create table/extension
      // 2. Insert/Update
      // 3. Select new score
      
      // We can mock checking the call arguments or just return values in sequence
      queryMock.mock.mockImplementation(async (sql) => {
        if (sql.includes('SELECT score')) {
            return { rows: [{ score: expectedScore }] };
        }
        return { rows: [] }; // Default for create/insert
      });

      // Act
      const result = await points.updateScore(item, operation);

      // Assert
      assert.strictEqual(result, expectedScore);
      assert.strictEqual(connectMock.mock.calls.length, 1, 'Should use one connection');
      assert.strictEqual(releaseMock.mock.calls.length, 1, 'Should release connection');
      
      // Verify we had at least 3 queries
      assert.ok(queryMock.mock.calls.length >= 3, 'Should verify table, update, and select');
    });
  });

});
