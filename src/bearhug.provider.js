/* global angular, console */
angular
  .module('talis.bearhug')
  .provider('bearhug', function BearhugProvider() {

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


        // TODO remove this?
        log: function (info) {
          $injector.invoke(opts.onLog, this, {
            info: info
          });
        },

        // TODO remove this?
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
  });