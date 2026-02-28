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

import { mongoose } from 'mongoose';

/* eslint-disable no-process-env */
const MONGODB_DB = process.env.MONGODB_DB || 'plus',
      SCORES_COLLECTION = process.env.MONGODB_COLLECTION || 'scores';
/* eslint-enable no-process-env */

let MONGODB_URI;
if (process.env.plusplus_MONGODB_URI) {
  console.log('INFO: Variable `plusplus_MONGODB_URI` de la integración de Vercel encontrada. Usando esta URI.');
  MONGODB_URI = process.env.plusplus_MONGODB_URI;
} else if (process.env.MONGODB_URI) {
  console.log('INFO: Variable `MONGODB_URI` estándar encontrada. Usando esta URI.');
  MONGODB_URI = process.env.MONGODB_URI;
} else {
  console.warn('ADVERTENCIA: No se encontraron variables de entorno para MongoDB. Usando el valor por defecto para desarrollo local.');
  MONGODB_URI = 'mongodb://db:27017/plus';
}

if (!MONGODB_URI || MONGODB_URI === 'mongodb://db:27017/plus') {
  console.error(
    'FATAL: MONGODB_URI no está configurada o está usando el valor por defecto de desarrollo. La aplicación no podrá conectarse a la base de datos.'
  );
} else {
  console.log(`URI de MongoDB detectada, comenzando con: ${MONGODB_URI.substring(0, 36)}...`);
}

// --- MongoDB Connection Logic ---
let isConnected = false;
let db = null;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return db;
  }

  try {
    // Best practice for Vercel: Cache the connection in a global variable
    console.log(`URI de MongoDB detectada, comenzando con: ${MONGODB_URI.substring(0, 36)}...`);
    await mongoose.connect(MONGODB_URI, {});
    isConnected = true;
    db = mongoose.connection;
    console.log("MongoDB Connected Successfully");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error(error);
  }
};
// --- End MongoDB Connection Logic ---


const getScoresCollection = async() => {
  const db = await connectToDatabase();
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

  let result;
  try {
    console.log(`Attempting to update score for: ${item}`);
    // Atomically upsert and return the updated score.
    result = await collection.findOneAndUpdate(
      { normalizedItem },
      {
        $setOnInsert: { normalizedItem },
        $set: { item },
        $inc: { score: increment }
      },
      { upsert: true, returnDocument: 'after', projection: { _id: 0, score: 1 } }
    );
    console.log(`Successfully updated score for: ${item}`);
  } catch (err) {
    console.error(`Error updating score for ${item}:`, err);
    throw err;
  }

  const score = result.value?.score ?? 0;

  console.log( item + ' now on ' + score );
  return score;

}; // UpdateScore.

export default {
  retrieveTopScores,
  updateScore
};
