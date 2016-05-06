/* global angular */
angular
  .module('talis.bearhug')
  .factory('bearhugStorage', bearhugStorage);

/**
* In-memory store of state around token.
*
* Note that only the underlying token is stored; bearer token is derived from that.
**/
function bearhugStorage(bearerUtils) {
  // encapsulated state
  var token = null;

  // -- public API
  return {
    getToken: getToken,
    setToken: setToken,
    getBearer: getBearer,
    setBearer: setBearer
  };

  /**
  * Get current token or derived oauth token.
  * 
  * @returns Option[string] the current token, derived oauth token, or undefined
  **/
  function getToken() {
    return token || null;
  }

  /**
  * Update the stored token
  * 
  * @param newToken Option[string] - a replacement token
  **/
  function setToken(newToken) {
    token = angular.isString(newToken) ? newToken : token;
  }

  /**
  * Get current token or derived oauth token as Bearer token representation.
  * 
  * @returns Option[string] the current token or derived oauth token as Bearer token representation.
  **/
  function getBearer() {
    return bearerUtils.token2bearer(getToken()) || null;
  }

  /**
  * Update the stored token from a bearer token representation.
  * 
  * @param bearer: Option[string] - a replacement token, as a bearer token.
  **/
  function setBearer(bearer) {
    var tokenFromBearer = bearerUtils.bearer2token(bearer);
    setToken(tokenFromBearer);
  }
}
