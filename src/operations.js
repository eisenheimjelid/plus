/**
 * Provides constants and supporting functions for operations.
 */

'use strict';

export const operations = {
  PLUS: 'plus',
  MINUS: 'minus',
  SELF: 'selfPlus',
  MINUSPLUS: 'minusplus'
};

/**
 * Given a mathematical operation, returns the name of that operation.
 *
 * @param {string} operation A mathematical operation such as '+' or '-'.
 * @return {string} The name of the operation.
 */
export const getOperationName = ( operation ) => {
  let operationName = '';
  console.log( 'Operation: ' + operation );

  /* eslint-disable max-statements-per-line */
  switch ( operation ) {
    case '++--': operationName = operations.MINUSPLUS; break;
    case '+': operationName = operations.PLUS; break;
    case '-': operationName = operations.MINUS; break;
  }
  /* eslint-enable max-statements-per-line */

  return operationName ? operationName : false;

};

export default {
  operations,
  getOperationName
};
