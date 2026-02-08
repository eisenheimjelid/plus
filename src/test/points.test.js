import { test, describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import esmock from 'esmock';

// MongoDB spies
const createIndexMock = mock.fn(async () => ( { name: 'normalizedItem_1' } ));
const findMock = mock.fn();
const sortMock = mock.fn();
const toArrayMock = mock.fn();
const findOneAndUpdateMock = mock.fn();

const collection = {
  createIndex: createIndexMock,
  find: findMock,
  findOneAndUpdate: findOneAndUpdateMock
};

const collectionFn = mock.fn(() => collection);
const dbMock = mock.fn(() => ( { collection: collectionFn } ));
const connectMock = mock.fn(async () => ( { db: dbMock } ));

class MockMongoClient {
  constructor(uri, options) {
    this.uri = uri;
    this.options = options;
  }
  connect = connectMock;
}

findMock.mock.mockImplementation(() => ( { sort: sortMock } ));
sortMock.mock.mockImplementation(() => ( { toArray: toArrayMock } ));

// Import module with esmock
const { default: points } = await esmock('../points.js', {
  'mongodb': {
    MongoClient: MockMongoClient
  }
});

describe('Points Module', () => {

  beforeEach(() => {
    // Reset call counts between tests
    connectMock.mock.resetCalls();
    createIndexMock.mock.resetCalls();
    findMock.mock.resetCalls();
    sortMock.mock.resetCalls();
    toArrayMock.mock.resetCalls();
    findOneAndUpdateMock.mock.resetCalls();
    collectionFn.mock.resetCalls();
    dbMock.mock.resetCalls();
  });

  describe('retrieveTopScores', () => {
    it('should connect, query, and return rows', async () => {
      // Arrange
      const fakeRows = [
        { item: 'Alice', score: 10 },
        { item: 'Bob', score: 5 }
      ];
      
      // Setup the query mock to return our fake data
      toArrayMock.mock.mockImplementationOnce( async () => fakeRows );

      // Act
      const result = await points.retrieveTopScores();

      // Assert
      assert.strictEqual(connectMock.mock.calls.length, 1, 'Should connect to Mongo once');
      assert.strictEqual(dbMock.mock.calls.length, 1, 'Should request the DB once');
      assert.strictEqual(collectionFn.mock.calls.length, 1, 'Should request scores collection');
      assert.strictEqual(createIndexMock.mock.calls.length, 1, 'Should ensure index exists');

      assert.strictEqual(findMock.mock.calls.length, 1, 'Should query collection');
      const findArgs = findMock.mock.calls[0].arguments[0];
      assert.deepStrictEqual(findArgs, {}, 'Find should query all documents');

      assert.strictEqual(sortMock.mock.calls.length, 1, 'Should sort results');
      assert.deepStrictEqual(sortMock.mock.calls[0].arguments[0], { score: -1 });

      assert.strictEqual(toArrayMock.mock.calls.length, 1, 'Should convert cursor to array');
      assert.deepStrictEqual(result, fakeRows, 'Should return the rows from DB');
    });
  });

  describe('updateScore', () => {
    it('should initialize table, update score, and return new value', async () => {
      // Arrange
      const item = 'Charlie';
      const operation = '+';
      const expectedScore = 42;
      findOneAndUpdateMock.mock.mockImplementationOnce( async () => ( { value: { score: expectedScore } } ) );

      // Act
      const result = await points.updateScore(item, operation);

      // Assert
      assert.strictEqual(result, expectedScore);
      assert.strictEqual(collectionFn.mock.calls.length, 1, 'Should request collection');
      assert.strictEqual(createIndexMock.mock.calls.length, 1, 'Should ensure index exists');

      assert.strictEqual(findOneAndUpdateMock.mock.calls.length, 1, 'Should upsert and fetch score');
      const updateArgs = findOneAndUpdateMock.mock.calls[0].arguments;
      assert.deepStrictEqual(updateArgs[0], { normalizedItem: item.toLowerCase() }, 'Should query by normalized item');
      assert.deepStrictEqual(updateArgs[1].$inc, { score: 1 }, 'Should increment score positively');
    });
  });

});
