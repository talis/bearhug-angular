'use strict';

angular.module('talis.bearhug', [])


.factory('bearhugInterceptor', function($q, $injector){
  return {
    request:function(config){
      config.headers.Authorization = 'Bearer '+$injector.get('bearhug').getOAuthToken();
      return config;
    },

    responseError:function(rejection){

      if ($injector.get('bearhug').getHasRetried() === true) {


        console.log('ALREADY TRIED');
        return $q.reject(rejection);


      } else{

        return $injector.get('bearhug').authenticate().then(function() {
          console.log('RETURN FROM AUTHENTICATE');
          return $injector.get('$http')(rejection.config);
        }).then(function(err){

          console.log('WE REALLY HAVE AN ERROR');
          console.log(err);
          return $q.reject(rejection);
        });

      }
    }
  };
})




.provider('bearhug', function() {
    this._getEndpoint = null;
    this._onError = null;
    this._onLog = null;

    this.$get = function($injector, $q) {
        var getEndpoint = this._getEndpoint;
        var onError = this._onError;
        var onLog = this._onLog;
        var user = null;
        var hasRetried = false;

        return {
            /**
             * Get current oauth token
             * @return oauth token or null
             */
            getOAuthToken: function () {
                if (user && user.oauth) {
                    return user.oauth.access_token;
                } else {
                    return null;
                }
            },

            /**
             * Get the user object
             * @returns {*}
             */
            getUser: function () {
                return user;
            },
            getHasRetried: function() {
                return hasRetried;
            },

            /**
             * Authenticate & retrieve a oauth token
             * @param onSuccess: function (err, user)
             * @param onError: function (err)
             */
            authenticate: function() {

              getEndpoint = 'http://persona/2/auth/providers/google/login.json?cb=JSON_CALLBACK';

              return $injector.get('$http').jsonp(getEndpoint)
                  .then(function(response) {


console.log('RESPONSE');
console.log(response);


                    // console.log('GET RESPONSE');
                    // console.log(response);
                    //
                    user = response.data;
                    hasRetried = true;
                    return response.data.oauth.access_token;

                  }, function(){
                    return $q.reject();
                  });

            },

            log: function (info) {
                $injector.invoke(onLog, this, {
                    info: info
                });
            },

            error: function (err) {
                $injector.invoke(onError, this, {
                    err: err
                });
            }
        };
    };

    // [getEndPoint()] -> url
    this.setCreateEndpointFunc = function (getEndpointFunc) {
        this._getEndpoint = getEndpointFunc;
    };

    // ["err", onError(err)] -> null
    this.setOnError = function (onErrorFunc) {
        this._onError = onErrorFunc;
    };

    // ["info", onLog(info)] -> null
    this.setOnLog = function (onLog) {
        this._onLog = onLog;
    };
})
.config(function($httpProvider) {

    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    var oauthTokenRetryFail = false;
    $httpProvider.interceptors.push('bearhugInterceptor');

});

