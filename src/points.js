/**
 * All the stuff that handles the giving, taking away, or otherwise querying of points.
 *
 * NOTE: As the functions here pretty much deal exclusively with the database, they generally
 *       aren't unit tested, as that would require anyone who runs the tests to also have a MongoDB
 *       server. Instead, the functions in this file are well covered via the integration and
 *       end-to-end tests.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

import { MongoClient } from 'mongodb';

/* eslint-disable no-process-env */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://db:27017/plus',
      MONGODB_DB = process.env.MONGODB_DB || 'plus',
      SCORES_COLLECTION = process.env.MONGODB_COLLECTION || 'scores';
/* eslint-enable no-process-env */

if (!MONGODB_URI || MONGODB_URI === 'mongodb://db:27017/plus') {
  console.error(
    'FATAL: MONGODB_URI is not set or is set to the default development value. The application may not be able to connect to the database.'
  );
}

const mongoClient = new MongoClient( MONGODB_URI, { serverSelectionTimeoutMS: 5000 } );
let dbPromise;

const getScoresCollection = async() => {
  if ( !dbPromise ) {
    console.log('Connecting to MongoDB...');
    dbPromise = mongoClient.connect().then( ( client ) => {
      console.log('Successfully connected to MongoDB.');
      return client.db( MONGODB_DB );
    }).catch(err => {
      console.error('Error connecting to MongoDB:', err);
      dbPromise = null; // Allow retrying connection on next request
      throw err; // Propagate error to caller
    });
  }

  const db = await dbPromise;
  const collection = db.collection( SCORES_COLLECTION );

  // Ensure we have a unique index for case-insensitive lookups.
  await collection.createIndex( { normalizedItem: 1 }, { unique: true } );

  return collection;
};

/**
 * Retrieves all scores from the database, ordered from highest to lowest.
 *
 * TODO: Add further smarts to retrieve only a limited number of scores, to avoid having to query
 *       everything. Note that this isn't just LIMIT, because we'll need to apply the limit
 *       separately to both users (/U[A-Z0-9]{8}/) and things (everything else) & return both sets.
 *
 * @return {array} An array of entries, each an object containing 'item' (string) and 'score'
 *                (integer) properties.
 */
export const retrieveTopScores = async() => {

  const collection = await getScoresCollection();

  const scores = await collection.find( {}, { projection: { _id: 0, item: 1, score: 1 } } )
    .sort( { score: -1 } )
    .toArray();

  return scores;

};

/**
 * Updates the score of an item in the database. If the item doesn't yet exist, it will be inserted
 * into the database with an assumed initial score of 0.
 *
 * This function also sets up the database if it is not already ready, including creating the
 * scores collection and ensuring a case-insensitive index exists.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @return {int} The item's new score after the update has been applied.
 */
export const updateScore = async( item, operation ) => {

  const collection = await getScoresCollection();
  const normalizedItem = item.toLowerCase();
  const increment = '-' === operation ? -1 : 1;

  // Atomically upsert and return the updated score.
  const result = await collection.findOneAndUpdate(
    { normalizedItem },
    {
      $setOnInsert: { normalizedItem },
      $set: { item },
      $inc: { score: increment }
    },
    { upsert: true, returnDocument: 'after', projection: { _id: 0, score: 1 } }
  );

  const score = result.value?.score ?? 0;

  console.log( item + ' now on ' + score );
  return score;

}; // UpdateScore.

export default {
  retrieveTopScores,
  updateScore
};
