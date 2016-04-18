/* global angular */
angular
  .module('talis.bearhug')
  .factory('bearhugAuthenticator', function($http, $q, bearhugStorage) {

    var AUTH_DEFAULTS = {
      endpoint: null,
      httpMethod: null,
      transformResponse: null
    };

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

      var opts = angular.extend({}, AUTH_DEFAULTS, options);

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
              var responseData = response && response.data;
              var tokenFromResponse = 
                angular.isFunction(opts.transformResponse) ? 
                  opts.transformResponse(responseData) : 
                  responseData;

              // store data and resolve
              bearhugStorage.setToken(tokenFromResponse);
              authenticationDeferred.resolve(bearhugStorage.getToken());
            })
            .catch(authenticationDeferred.reject);

        return authenticationDeferred.promise;
      }
    }

  });