/* global angular, console */
angular
  .module('talis.bearhug')
  .provider('bearhug', BearhugProvider);

/**
* The main entry point into Bearhug, used by the HTTP interceptor.
*
* Wraps up and reprovides the main functionality for Bearhug:
* - get the current token
* - authenticate (used internally)
*
* Provides a number of customisable options, covering:
* - the authentication endpoint and method
* - a response transformer for extracting the oauth access token
*   from unusual locations within the authentication response.
**/
function BearhugProvider() {

  var options = {
    authenticationFunction: null // Function[() => Promise[string]]
  };

  /**
  * Set the authentication token extraction functions.
  *
  * @param authFunc: Function[() => Promise[String]] - Promise for token resolution
  **/
  this.setAuthenticationFunction = function(authFunc) {
    options.authenticationFunction = angular.isFunction(authFunc) ? authFunc : options.authenticationFunction;
  };

  this.$get = function(bearhugAuthenticator, bearhugStorage) {

    // take a copy of `options` to encapsulate current values
    var opts = angular.copy(options);

    if(!angular.isFunction(opts.authenticationFunction)) {
      throw new Error('No authentication function specified. How can bearhug authenticate?');
    } else {
      return {
        options: opts,
        // expose the main bearhugAuthenticator flow
        authenticate: authenticate,

        // expose the stored state from bearhugStorage
        clearToken:  bearhugStorage.clearToken,
        setToken:  bearhugStorage.setToken,
        getToken:  bearhugStorage.getToken,
        getBearer: bearhugStorage.getBearer
      };
    }

    /**
     * Authenticate & retrieve a oauth token
     */
    function authenticate(requestConfig) {
      return bearhugAuthenticator.authenticate(opts, requestConfig);
    }
  };
}