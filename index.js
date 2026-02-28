/**
 * Working PlusPlus++
 * Like plusplus.chat, but one that actually works, because you can host it yourself! 😉
 *
 * @see https://github.com/tdmalone/working-plusplus
 * @see https://expressjs.com/en/4x/api.html
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

import app from './src/app.js';
import slack from './src/slack.js';
import express from 'express';
import fs from 'fs';
import mime from 'mime';
import bodyParser from 'body-parser';
import slackClient from '@slack/client';
import { fileURLToPath } from 'url';
import path from 'path';

/* eslint-disable no-process-env, no-magic-numbers */
const PORT = process.env.PORT || 80; // Let Heroku set the port.
const SLACK_OAUTH_ACCESS_TOKEN = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN;
/* eslint-enable no-process-env, no-magic-numbers */

if (!SLACK_OAUTH_ACCESS_TOKEN) {
  console.error(
    'FATAL: SLACK_BOT_USER_OAUTH_ACCESS_TOKEN no está configurada. La aplicación no podrá comunicarse con la API de Slack.'
  );
} else {
  console.log('SLACK_BOT_USER_OAUTH_ACCESS_TOKEN detectado.');
}

/**
 * Starts the server and bootstraps the app.
 *
 * @param {object} options Optional. Allows passing in replacements for the default Express server
 *                         module (`express` property) and Slack Web API client module (`slack`
 *                         property).
 * @returns {http.Server} A Node.js http.Server object as returned by Express' listen method. See
 *                        https://expressjs.com/en/4x/api.html#app.listen and
 *                        https://nodejs.org/api/http.html#http_class_http_server for details.
 */
const bootstrap = ( options = {}) => {

  // Allow alternative implementations of both Express and Slack to be passed in.
  const server = options.express || express();
  slack.setSlackClient( options.slack || new slackClient.WebClient( SLACK_OAUTH_ACCESS_TOKEN ) );

  const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

  // Serve static files from the 'public' directory
  server.use( express.static( path.join( __dirname, 'public' ) ) );
  server.use( bodyParser.json() );
  server.enable( 'trust proxy' );
  server.get( '/', app.handleGet );
  server.post( '/', app.handlePost );

  // Favicon route - serves from the 'public' directory at the project root.
  server.get( '/favicon.ico', ( request, response ) => {
    response.sendFile( path.join( __dirname, 'public', 'favicon.ico' ) );
  });

  // Additional routes.
  server.get( '/leaderboard', app.handleGet );
  server.get( '/top', app.handleGet );

  return server.listen( PORT, () => {
    console.log( 'Listening on port ' + PORT + '.' );
  });

}; // Bootstrap.

// If module was called directly, bootstrap now.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  bootstrap();
}

export default bootstrap;
