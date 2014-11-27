'use strict';

/* Response interceptors */
angular.module('talis.bearhug', []).config(['$httpProvider',function($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    // intercept for oauth tokens
    $httpProvider.responseInterceptors.push([
        '$rootScope', '$q', '$injector','$location','PERSONA_ENDPOINT','applicationLoggingService',
        function ($rootScope, $q, $injector, $location, PERSONA_ENDPOINT, applicationLoggingService) {
            return function(promise) {
                return promise.then(function(response) {
                    return response; // no action, was successful
                }, function (response) {
                    // error - was it 401 or something else?
                    if (response.status===401 && response.data.error && response.data.error === "invalid_token" && !$rootScope.oauthTokenRetryFail) {
                        applicationLoggingService.debug('responseInterceptor - 401 - expired token?');
                        var deferred = $q.defer();                         // 401 with invalid token - defer until we can re-request
                        // Let's get login.json again... (cannot inject $http directly as will cause a circular ref)
                        var getUserData = function() {
                            if ($rootScope.user && $rootScope.user.refreshUrl) {
                                return $injector.get("$http").get($rootScope.user.refreshUrl);
                            } else {
                                if ($rootScope.inst != null && $rootScope.inst.shortCode != null) {
                                    // go to inst-specific login.json, doesn't matter if persona session exists or not this will re-set the inst and sign you back in if SimpleSAML session is still active
                                    return $injector.get("$http").jsonp(PERSONA_ENDPOINT+'/2/auth/providers/'+$rootScope.inst.shortCode+'/login.json?cb=JSON_CALLBACK');
                                } else {
                                    return $injector.get("$http").jsonp(PERSONA_ENDPOINT+'/2/auth/login.json?cb=JSON_CALLBACK');
                                }
                            }
                        };
                        getUserData().then(function(loginResponse) {
                            if (loginResponse.data) {
                                $rootScope.user = loginResponse.data;
                                $rootScope.oauth = loginResponse.data.oauth;                                 // we have some data - set new user at $rootScope
                                // now let's retry the original request - transformRequest in .run() below will add the new OAuth token
                                $injector.get("$http")(response.config).then(function(response) {
                                    // we have a successful response - resolve it using deferred
                                    applicationLoggingService.debug('Managed to get new token');
                                    deferred.resolve(response);
                                },function(response) {
                                    $rootScope.oauthTokenRetryFail = true;
                                    deferred.reject(); // something went wrong
                                });
                            } else {
                                $rootScope.oauthTokenRetryFail = true;
                                deferred.reject(); // login.json didn't give us data
                            }
                        }, function(response) {
                            $rootScope.oauthTokenRetryFail = true;
                            deferred.reject(); // login.json failed, redirect to splash so user can login again
                            $location.path('/splash');
                            return;
                        });
                        return deferred.promise; // return the deferred promise
                    }
                    return $q.reject(response); // not a recoverable error
                });
            };
        }]
    );

    /**
     * Routes/codes for which to disable the global error handler that shows the red error page.
     */
    $httpProvider.responseInterceptors.push([
        '$rootScope', '$q','bearhugExclusionsService',
        function ($rootScope, $q, bearhugExclusionsService) {
            return function(promise){
                return promise.then(function(response){
                    // http on success
                    return response;
                }, function (response) {
                    //
                    // There was an error with the response...
                    //
                    if (bearhugExclusionsService.isExcludedFromErrorHandling(response))
                    {
                        // Suppress any global error handling for the transcoding status calls as we don't want the big red error box for any of these as they are background information.
                        $rootScope.error = null;
                    }
                    else
                    {
                        // Show the big red error screen...
                        $rootScope.error = {
                            status:response.status,
                            data:response.data,
                            method: response.config.method,
                            url: (response.config.url ? response.config.url : null)
                        };
                    }

                    return $q.reject(response);
                });
            };
        }
    ]);

    /**
     * this interceptor uses the application logging service to
     * log on server-side any errors from $http requests
     * the only error i'm not logging is 401 since the interceptor
     * above deals with that specifically
     */
    $httpProvider.responseInterceptors.push([
        '$rootScope', '$q','applicationLoggingService',
        function($rootScope, $q,applicationLoggingService){
            return function(promise){
                return promise.then(function(response){
                    // http on success
                    return response;
                }, function (response) {
                    // http on failure
                    if(response && (response.status === 0 || response.status === null || response.status === 500)) {
                        var error = {
                            method: response.config.method,
                            url: (response.config.url ? response.config.url : null),
                            message: response.data,
                            status: response.status
                        };
                        applicationLoggingService.error(JSON.stringify(error));
                    }
                    return $q.reject(response);
                });
            };
        }
    ]);

}]).run(['$rootScope', '$injector', function($rootScope,$injector) {
    $injector.get("$http").defaults.transformRequest = function(data, headersGetter) {
        if ($rootScope.oauth) {
            headersGetter()['Authorization'] = "Bearer "+$rootScope.oauth.access_token;
            headersGetter()['Cache-Control'] = 'no-cache';
            headersGetter()['Pragma'] = 'no-cache';
        }
        if (data) {
            return angular.toJson(data);
        }
    };
}]).provider("bearhugExclusionsService", function() {

    /*
     * This state is set on initialisation by the provider config block in your main app.js...
     */
    this.errorHandlerExclusions = [];
    this.addErrorHandlerExclusion = function(exclusion) {
        this.errorHandlerExclusions.push(exclusion);
    };

    /*
     * Define what the service exposes...
     */
    this.$get = function() {
        var errorHandlerExclusions = this.errorHandlerExclusions;

        return {

            isExcludedFromErrorHandling: function(response) {

                //Leaving this commented as it's really useful for debugging...
                //console.log('isExcludedFromErrorHandling? : '+response.config.url+' '+response.status+' '+response.config.method);

                var requestUrl = response.config.url;
                var requestMethod = response.config.method;
                var responseCode = response.status;

                var bExcludeFromErrorHandling = false;

                for (var i=0; i < errorHandlerExclusions.length; i++) {
                    var exclusion = errorHandlerExclusions[i];

                    /*
                     * The three vars below may look a bit odd, especially when defaulted to true, but it deals with the
                     * situation where there may be variations of path/code/method present and we want the exclusion
                     * to operate over all options that are present.  If the value isn't set then the value defaults to
                     * true so that when AND'ed together we get the desired output (e.g. a missing option doesn't act
                     * as a filter).   Doing it this way saved me doing a whole bunch of if/elseif for various
                     * combinations of the three values (path, code & method).
                     */

                    var bMatchedExclusionPath = true;
                    if (exclusion.path && requestUrl.indexOf(exclusion.path) === -1) {
                        bMatchedExclusionPath = false;
                    }

                    var bMatchedExclusionCode = true;
                    if (exclusion.code && responseCode !== exclusion.code) {
                        bMatchedExclusionCode = false;
                    }

                    var bMatchedExclusionMethods = true;
                    if (exclusion.methods) {
                        var bFoundMethod = false;
                        for (var j=0; j<exclusion.methods.length; j++) {
                            if (exclusion.methods[j] === requestMethod) {
                                bFoundMethod = true;
                                break;
                            }
                        }

                        if (bFoundMethod === false) {
                            bMatchedExclusionCode = false;
                        }
                    }

                    if (bMatchedExclusionPath && bMatchedExclusionCode && bMatchedExclusionMethods) {
                        //Leaving this commented as it's useful for debugging...
                        //console.log('Matched on exclusion', exclusion);
                        bExcludeFromErrorHandling = true;
                        break;
                    }
                }

                return bExcludeFromErrorHandling;
            }

        };
    };
});