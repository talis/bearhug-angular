/* global angular */
angular
  .module('talis.bearhug')
  .factory('bearhugAuthenticator', bearhugAuthenticator); 


/**
* Provides the main authentication flow.
**/
function bearhugAuthenticator($http, $injector, $q, bearhugStorage) {

  // ensure only one authentication request happens at a time
  var authenticationDeferred;

  // -- public API
  return {
    authenticate: authenticate
  };

  /**
  * Authenticate & retrieve a oauth token
  * 
  * @param options: Object - options, following the structure of AUTH_DEFAULTS, above.
  * @returns Promise[string] - the authenticated token
  **/
  function authenticate(options) {
    // ensures we have an object, and that properties are chose
    var opts = angular.isObject(options) ? options : {};

    if(!angular.isFunction(opts.authenticationFunction)) {
      throw new Error('No authentication function available to bearhugAuthenticator');
    } else if(authenticationDeferred) {
      // bearhugAuthenticator.authenticate is already waiting on resolution
      return authenticationDeferred.promise;
    } else {
      // lock authentication endpoint to prevent contention
      authenticationDeferred = $q.defer();

      // call authentication endpoint
      var authPromise =
        opts.authenticationFunction($injector)
          .then(function(tokenFromResponse) {
            bearhugStorage.setToken(tokenFromResponse);
            var token = bearhugStorage.getToken();
            if(token) {
              authenticationDeferred.resolve(token);
            } else {
              authenticationDeferred.reject(new Error('Token response is not a string: ' + angular.toJson(tokenFromResponse)));
            }
          })
          .catch(authenticationDeferred.reject);

      // once promise is fulfilled, clean up the lock
      authPromise.finally(function() {
        authenticationDeferred = (void 0);
      });

      return authenticationDeferred.promise;
    }
  }
}
