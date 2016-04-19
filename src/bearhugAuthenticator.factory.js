/* global angular */
angular
  .module('talis.bearhug')
  .factory('bearhugAuthenticator', bearhugAuthenticator); 


/**
* Provides the main authentication flow.
**/
function bearhugAuthenticator($http, $q, bearhugStorage) {

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

    // response2token is a function to transform a response into a token.
    // defaults to an identity function.
    var response2token = 
      angular.isFunction(opts.transformResponse) ? 
        opts.transformResponse : 
        function(r) { return r; };

    // $http has method aliases for all of the valid HTTP methods. Use this to validate.
    var httpMethod = $http[opts.httpMethod && opts.httpMethod.toLowerCase()];

    if(!angular.isString(opts.endpoint)) {
      return $q.reject(new Error('authenticate.endpoint is not a valid string:', opts.endpoint));
    } else if(!angular.isFunction(httpMethod)) {
      return $q.reject(new Error('authenticate.httpMethod is invalid:', opts.httpMethod));
    } else if(authenticationDeferred) {
      // bearhugAuthenticator.authenticate is already waiting on resolution
      return authenticationDeferred.promise;
    } else {
      // lock authentication endpoint to prevent contention
      authenticationDeferred = $q.defer();

      // call authentication endpoint
      var authPromise =
        httpMethod(opts.endpoint)
          .then(function(response) {
            // extract and transform response to get at user data wrapping token
            var tokenFromResponse = response2token(response);
            // store data and resolve
            // TODO: tidy this up. Is the response content important?
            // What is the token used for later? Seems to be discarded...
            bearhugStorage.setToken(tokenFromResponse);
            authenticationDeferred.resolve(bearhugStorage.getToken());
          })
          .catch(authenticationDeferred.reject);

      return authenticationDeferred.promise;
    }
  }
}