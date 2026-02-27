/**
 * Handles sending of messages - i.e. outgoing messages - back to Slack, via Slack's Web API. See
 * also ./events.js, which handles incoming messages from subscribed events.
 *
 * TODO: This file should probably be renamed to 'slack.js' so it can handle all other requests to
 *       the Slack APIs rather than just sending.
 *
 * @see https://api.slack.com/web
 */

'use strict';

let slack, users;

/**
 * Injects the Slack client to be used for all outgoing messages.
 *
 * @param {WebClient} client An instance of Slack's WebClient as documented at
 *                           https://slackapi.github.io/node-slack-sdk/web_api and
 *                           implemented at
 *                           https://github.com/slackapi/node-slack-sdk/blob/master/src/WebClient.ts
 * @returns {void}
 */
export const setSlackClient = ( client ) => {
  slack = client;
};

/**
 * Retrieves a list of all users in the linked Slack team. Caches it in memory.
 *
 * @returns {object} A collection of Slack user objects, indexed by the user IDs (Uxxxxxxxx).
 */
export const getUserList = async() => {

  if ( users ) {
    return users;
  }

  console.log( 'Retrieving user list from Slack...' );

  try {
    const userList = await slack.users.list();
    if ( !userList.ok ) {
      console.error( 'Error retrieving user list from Slack:', userList.error );
      throw new Error( 'Error retrieving user list from Slack: ' + userList.error );
    }
    console.log( `Successfully retrieved ${userList.members.length} users.` );
    users = {};
    for ( const user of userList.members ) {
      users[ user.id ] = user;
    }
  } catch ( error ) {
    console.error( 'Fatal error retrieving user list from Slack:', error );
    throw error;
  }
  return users;

}; // GetUserList.

/**
 * Given a Slack user ID, returns the user's real name or optionally, the user's username. If the
 * user *does not* have a real name set, their username is returned regardless.
 *
 * @param {string} userId   A Slack user ID in the format Uxxxxxxxx.
 * @param {bool}   username Whether the username should always be returned instead of the real name.
 * @returns {string} The user's real name, as per their Slack profile.
 */
export const getUserName = async( userId, username = false ) => {

  const users = await getUserList(),
        user = users[ userId ];

  if ( 'undefined' === typeof user ) {
    return '(unknown)';
  }

  return username || ! user.profile.real_name ? user.name : user.profile.real_name;

};

/**
 * Sends a message to a Slack channel.
 *
 * @param {string|Object} text    Either message text to send, or a Slack message payload. See the
 *                                docs at https://api.slack.com/methods/chat.postMessage and
 *                                https://api.slack.com/docs/message-formatting.
 * @param {string}        channel The ID of the channel to send the message to. Can alternatively
 *                                be provided as part of the payload in the previous argument.
 * @return {Promise} A Promise to send the message to Slack.
 */
export const sendMessage = async( text, channel ) => {

  let payload = {
    channel,
    text
  };

  if ( 'object' === typeof text ) {
    delete payload.text;
    payload = Object.assign( payload, text );
  }

  try {
    const data = await slack.chat.postMessage( payload );
    if ( !data.ok ) {
      console.error( 'Error posting Slack message:', data.error );
      throw new Error( data.error );
    }
  } catch ( error ) {
    console.error( 'Fatal error sending Slack message:', error );
    throw error;
  }

}; // SendMessage.

export default {
  setSlackClient,
  getUserList,
  getUserName,
  sendMessage
};
