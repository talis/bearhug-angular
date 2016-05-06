/* global angular */
angular
  .module('talis.bearhug')
  .factory('bearhugInterceptor', bearhugInterceptor);

function bearhugInterceptor($q, $injector, bearhugStorage) {

  var authenticationDeferred;

  // -- public API
  return {
    request: request,
    response: response,
    responseError: responseError
  };

  // -- implementing functions

  function request(requestConfig) {
    var bearer = bearhugStorage.getBearer();
    if(bearer && requestConfig && requestConfig.headers) {
      requestConfig.headers.Authorization = bearer;
    }
    return requestConfig;
  }

  /**
  * If the response contains an Authorization header, replace the current tokens.
  **/
  function response(responseObj) {
    var bearer = responseObj && responseObj.headers('Authorization');

    // if Authorization header is present, use its value to update the stored bearer (and hence token)
    if(bearer) {
      bearhugStorage.setBearer(bearer);
    }

    return responseObj;
  }

  function responseError(rejection){
    // these are injected because bearhug has $http as a dependency
    var $http = $injector.get('$http');
    var bearhug = $injector.get('bearhug');
  
    // Bearhug only handles 401 authorization failures; all others fast-fail.
    if (!rejection || !rejection.config || rejection.status !== 401) {
      // a non-401 error occurred
      return $q.reject(rejection);
    } else if(authenticationDeferred) {
      // 401, but from outstanding request (i.e. on request-retry)
      return $q.reject(rejection);
    } else {
      // 401, which we will retry
      authenticationDeferred = $q.defer();

      var authPromise = 
        bearhug.authenticate(rejection.config)
          .then(function() {
            // if reauthentication succeeds, retry original request
            return (
              $http(rejection.config)
                .then(authenticationDeferred.resolve)
                .catch(authenticationDeferred.reject)
            );
          })
          .catch(function() {
            // if reauthentication fails, reject original request
            authenticationDeferred.reject(rejection);
          });

      // tidy up after original request completes
      authPromise.finally(function() {
        authenticationDeferred = (void 0);
      });

      return authenticationDeferred.promise;
    }
  }
}
