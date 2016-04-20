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
    auth: {
      endpoint: 'http://persona.staging/2/auth/providers/google/login.json?cb=JSON_CALLBACK',
      httpMethod: 'JSONP',
      transformResponse: function(resp) {
        return (resp && resp.data && resp.data.oauth && resp.data.oauth.access_token) || (void 0);
      }
    },
    onError: console.error,
    onLog: console.log
  };

  /**
  * Set the endpoint for authentication.
  *
  * TODO: should this accept an object specifying URI/method?
  *
  * @param uri: string - URI for authentication.
  **/
  this.setAuthEndpoint = function(uri) {
    options.auth.endpoint = angular.isString(uri) ? uri : options.auth.endpoint;
  };

  this.$get = function($injector, bearhugAuthenticator, bearhugStorage) {

    // take a copy of `options` to encapsulate current values
    var opts = angular.copy(options);

    return {
      options: opts,
      // expose the main bearhugAuthenticator flow
      authenticate: authenticate,

      // expose the stored state from bearhugStorage
      getToken:  bearhugStorage.getToken,
      getBearer: bearhugStorage.getBearer,
      getUser:   bearhugStorage.getUser
    };

    /**
     * Authenticate & retrieve a oauth token
     * @param onSuccess: function (err, user)
     * @param onError: function (err)
     */
    function authenticate(requestConfig) {
      return bearhugAuthenticator.authenticate(opts.auth, requestConfig);
    }
  };
}