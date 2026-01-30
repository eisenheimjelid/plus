/**
 * Provides messages for random selection.
 *
 * TODO: Add the ability to customise these messages - probably via JSON objects in environment
 *       variables.
 *
 * @author Julian Calaby <julian.calaby@gmail.com>
 */

'use strict';

import helpers from './helpers.js';
import operationsPkg from './operations.js';
const { operations } = operationsPkg;

export const messages = {};

messages[operations.PLUS] = [ {
  probability: 100,
  set: [
    '¡Felicidades!',
    '¡Lo tienes!',
    'Bravo.',
    'Bien hecho.',
    '¡Gran trabajo!',
    'Exquisito.',
    'Encantador.',
    'Soberbio.',
    '¡Clásico!',
    'Notorio.',
    '¡Bien, bien!',
    'Bien jugado.',
    'Mis más sinceras felicitaciones.',
    'Delicioso.',
    ':nice:',
    ':nyan:',
    ':party'
  ]
},
{
  probability: 1,
  set: [ ':shifty:' ]
} ];

messages[operations.MINUS] = [ {
  probability: 100,
  set: [
    '¿De verdad?',
    'Oh :slightly_frowning_face:.',
    'Ya veo.',
    'Ouch.',
    'Eso duele.',
    'Oh.',
    'Que mal.',
    'Mis condolencias.',
    'Suerte para la próxima',
    ':trollface:',
    ':sadpanda:'
  ]
},
{
  probability: 1,
  set: [ ':shifty:' ]
} ];

messages[operations.SELF] = [ {
  probability: 100,
  set: [
    'Hahahahahahaha no.',
    'Nope.',
    'No. Simplemente no.',
    ':facepalm:',
    ':wat:'
  ]
},
{
  probability: 1,
  set: [ ':shifty:' ]
} ];

messages[operations.MINUSPLUS] = [ {
  probability: 100,
  set: [
    'https://media.giphy.com/media/10gZNwuUuer5aU/giphy.gif',
    'https://media1.tenor.com/images/247d8ee14f4569a7a5d033081ec785d2/tenor.gif',
    'https://media.giphy.com/media/SKUhuXbT0OjwA/giphy.gif',
    'https://cdn-images-1.medium.com/max/1600/1*RwGHT8DOkuVDKcdPv7v11Q.gif',
    'https://media2.giphy.com/media/BFA2IJ57CSnp6/giphy.gif',
    'https://media.giphy.com/media/xuDHhHcCR0rew/giphy.gif',
    'https://media1.giphy.com/media/nR4L10XlJcSeQ/giphy.gif',
    'https://media.tenor.com/images/e94f37436c75ccb038a1f10d7cca5450/tenor.gif'
  ]
},
{
  probability: 1,
  set: [ ':shifty:' ]
} ];

/**
 * Retrieves a random message from the given pool of messages.
 *
 * @param {string}  operation The name of the operation to retrieve potential messages for.
 *                            See operations.js.
 * @param {string}  item      The subject of the message, eg. 'U12345678' or 'SomeRandomThing'.
 * @param {integer} score     The item's current score. Defaults to 0 if not supplied.
 *
 * @returns {string} A random message from the chosen pool.
 */
export const getRandomMessage = ( operation, item, score = 0 ) => {

  const messageSets = messages[operation];
  let format = '';
  console.log( 'Operation on message: ' + operation );

  switch ( operation ) {
    case operations.MINUS:
    case operations.PLUS:
      format = '<message> *<item>* tiene ahora <score> punto<plural>.';
      break;
    case operations.SELF:
      format = '<item> <message>';
      break;
    case operations.MINUSPLUS:
      format = '<message>';
      break;
    default:
      throw Error( 'Invalid operation: ' + operation );
  }

  let totalProbability = 0;
  for ( const set of messageSets ) {
    totalProbability += set.probability;
  }

  let chosenSet = null;
  let setRandom = Math.floor( Math.random() * totalProbability );

  for ( const set of messageSets ) {
    setRandom -= set.probability;

    if ( 0 > setRandom ) {
      chosenSet = set.set;
      break;
    }
  }

  if ( null === chosenSet ) {
    throw Error(
      'Could not find set for ' + operation + ' (ran out of sets with ' + setRandom + ' remaining)'
    );
  }

  const plural = helpers.isPlural( score ) ? 's' : '',
        max = chosenSet.length - 1,
        random = Math.floor( Math.random() * max ),
        message = chosenSet[random];

  const formattedMessage = format.replace( '<item>', helpers.maybeLinkItem( item ) )
    .replace( '<score>', score )
    .replace( '<plural>', plural )
    .replace( '<message>', message );

  return formattedMessage;

}; // GetRandomMessage.

export default {
  messages,
  getRandomMessage
};
