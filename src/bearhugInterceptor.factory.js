/* global angular */
angular
  .module('talis.bearhug')
  .factory('bearhugInterceptor', bearhugInterceptor);

function bearhugInterceptor($q, $injector, bearhugStorage) {
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
    if (!rejection || !rejection.status || !rejection.config) {
      // something unpredictable happened
      return $q.reject(rejection);
    } else if (rejection.status !== 401) {
      // some non-401 error occurred
      return $q.reject(rejection);
    } else if (isResponseFromAuthenticationEndpoint(bearhug, rejection.config)) {
      // Prevent attempts to wrap responsehandling around the auth endpoint
      return $q.reject(rejection);
    } else {
      return (
        bearhug.authenticate(rejection.config)
          .then(function() {
            // if reauthentication succeeds, retry original request
            return $http(rejection.config);
          })
          .catch(function(err) {
            // any authentication failure simply rejects as original
            return $q.reject(rejection);
          })
      );
    }
  }

  /**
  * Tests whether this HTTP config is made against the bearhug auth endpoint.
  *
  * @param bearhug: bearhug - the bearhug instance, from bearhugProvider
  * @returns boolean - true if endpoint URL/method match bearhug config. 
  **/
  function isResponseFromAuthenticationEndpoint(bearhug, config) {
    var auth = bearhug.options.auth;
    return config.url === auth.endpoint && config.method === auth.httpMethod;
  }
}