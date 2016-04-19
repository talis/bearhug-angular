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

  // [getEndPoint()] -> url
  this.setCreateEndpointFunc = function (getEndpointFunc) {
    options.getEndpoint = getEndpointFunc;
  };

  // ["err", onError(err)] -> null
  this.setOnError = function (onErrorFunc) {
    options.onError = onErrorFunc;
  };

  // ["info", onLog(info)] -> null
  this.setOnLog = function (onLog) {
    options.onLog = onLog;
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
      getToken: bearhugStorage.getToken,
      getBearer: bearhugStorage.getBearer,
      getUser: bearhugStorage.getUser,

      // TODO remove this - it should really just throw an exception that bails the bearhugging
      getHasRetried: function() {
        throw new Error('getHasRetried should never be called');
      },


      // TODO remove this? Replace with pubsub or $rootScope event broadcast/emit?
      log: function (info) {
        $injector.invoke(opts.onLog, this, {
          info: info
        });
      },

      // TODO remove this? Replace with pubsub or $rootScope event broadcast/emit
      error: function (err) {
        $injector.invoke(opts.onError, this, {
          err: err
        });
      }
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