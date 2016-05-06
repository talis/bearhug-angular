/* global angular */
angular
  .module('talis.bearhug')
  .factory('bearerUtils', bearerUtils);

/**
* Utility functions for converting from bearer to token and vice-versa.
**/
function bearerUtils() {
  
  // private constants
  var BEARER_REGEX = /^Bearer ([a-zA-Z0-9\._\-]+)$/;
  
  // -- public API
  return {
    bearer2token: bearer2token,
    token2bearer: token2bearer
  };

  /**
  * Validates a Bearer token string and extracts its token value.
  *
  * @param bearer: Option[string] - (optional) bearer token
  * @returns Option[string] - the token from the Bearer string, if it is valid
  **/
  function bearer2token(bearer) {
    var components = angular.isString(bearer) && bearer.match(BEARER_REGEX);
    return (angular.isArray(components) && components[1]) ? components[1] : (void 0);
  }

  /**
  * Validates a token (string) and converts it to a Bearer token (string)
  *
  * @param token: Option[string] - (optional) token string
  * @returns Option[string] - a Bearer representation of the token, if it is valid
  **/
  function token2bearer(token) {
    return angular.isString(token) ? ("Bearer " + token) : (void 0);
  }
}