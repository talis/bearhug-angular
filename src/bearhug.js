'use strict';

angular.module('talis.bearhug', [])
.provider('bearhug', function() {
    this._getEndpoint = null;
    this._onError = null;
    this._onLog = null;

    this.$get = ["$injector", function($injector) {
        var getEndpoint = this._getEndpoint;
        var onError = this._onError;
        var onLog = this._onLog;
        var user = null;

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

            /**
             * Authenticate & retrieve a oauth token
             * @param onSuccess: function (err, user)
             * @param onError: function (err)
             */
            authenticate: function(onSuccess, onError) {
                var promise = $injector.invoke(getEndpoint, this);

                promise.then(
                    function (resp) {
                        if (resp && resp.status === 200 && resp.data) {
                            user = _.merge(user || {}, resp.data);
                            $injector.invoke(onSuccess, this, {
                                err: null
                            });

                            return;
                        }

                        user = null;
                        if (resp && resp.status !== 200) {
                            $injector.invoke(onSuccess, this, {
                                err: "Authentication status: " + resp.status
                            });
                        } else {
                            $injector.invoke(onSuccess, this, {
                                err: "Authentication error: " + resp.status
                            });
                        }
                    },
                    function () {
                        user = null;
                        onError(null); // TODO: this could mask errors
                        $injector.invoke(this.onError, this);
                    }
                );
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
    }];

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
.config(['$httpProvider',function($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    var oauthTokenRetryFail = false;

    // intercept for oauth tokens
    $httpProvider.interceptors.push([
        '$q', '$injector','$location',
        function ($q, $injector, $location) {
            return function(promise) {
                return promise.then(function(response) {
                    return response; // no action, was successful
                }, function (response) {
                    var deferred = $q.defer();

                    if (!oauthTokenRetryFail && response && response.status === 401 && response.data &&
                        (response.data.error === "invalid_token" || response.data.error === "expired_token")
                    ) {
                        $injector.get('bearhug').authenticate(
                            function (err) {
                                if (err) {
                                    oauthTokenRetryFail = true;
                                    deferred.reject(response);
                                } else {
                                    // now let's retry the original request - transformRequest in .run() below will add the new OAuth token
                                    $injector.get("$http")(response.config).then(function(response) {
                                        // we have a successful response - resolve it using deferred
                                        deferred.resolve(response);
                                    },function(response) {
                                        oauthTokenRetryFail = true;
                                        deferred.reject(response); // something went wrong
                                    });
                                }
                            },
                            function() {
                                oauthTokenRetryFail = true;
                                deferred.reject(response);
                            }
                        );

                        return deferred.promise;
                    } else if (response && response.config && response.config.hasRetried === true) {
                        // Only retry once, not a recoverable error
                        return $q.reject(response);
                    } else if (
                        response && response.config.method !== "JSONP" && (
                            response.status >= 500 &&
                            response.status <= 599 ||
                            response.status === 0
                        ))
                    {
                        // Try one more time with random knock back
                        setTimeout(function() {
                            response.config.hasRetried = true;
                            $injector.get("$http")(response.config).then(function(response) {
                                deferred.resolve(response);
                            },function(response) {
                                 // something went wrong
                                deferred.reject(response);
                            });
                        }, Math.random() * 1000);

                        return deferred.promise;
                    }

                    return $q.reject(response); // not a recoverable error
                });
            };
        }]
    );

    /**
     * Routes/codes for which to disable the global error handler that shows the red error page.
     */
    $httpProvider.interceptors.push([
        '$q', '$injector', 'responseService', function ($q, $injector, responseService) {
            return function (promise){
                return promise.then(function (response){
                    // http on success
                    return response;
                }, function (response) {
                    // TODO: remove lodash
                    if (_.hasValue(response) && !responseService.isExcludedFromErrorHandling(response)) {
                        $injector.get('bearhug').error({
                            status : response.status,
                            data : response.data,
                            method : response.config && response.config.method ? response.config.method : null,
                            url : response.config && response.config.url ? response.config.url : null,
                        });
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
    $httpProvider.interceptors.push([
        '$rootScope', '$q', '$injector', function ($rootScope, $q, $injector){
            return function(promise){
                return promise.then(function (response){
                    // http on success
                    return response;
                }, function (response) {
                    // http on failure
                    if (response && (
                        (response.status === 0 && response.config.method !== 'JSONP') ||
                        response.status === null || response.status === 500))
                    {
                        $injector.get('bearhug').log({
                            method: response.config.method,
                            url: response.config.url ? response.config.url : null,
                            message: response.data,
                            status: response.status
                        });
                    }

                    return $q.reject(response);
                });
            };
        }
    ]);
}]).provider("responseService", function() {
    // This state is set on initialisation by the provider config block in app.js...
    this.errorHandlerExclusions = [];

    this.addErrorHandlerExclusion = function(exclusion) {
        this.errorHandlerExclusions.push(exclusion);
    };

    // Define what the service exposes...
    this.$get = function() {
        var errorHandlerExclusions = this.errorHandlerExclusions;

        return {
            isExcludedFromErrorHandling: function(response) {
                var responseIsNull = response == null || typeof response === 'undefined',
                    requestUrl = responseIsNull || response.config == null ? '' : response.config.url,
                    requestMethod = responseIsNull || response.config == null ? '' : response.config.method,
                    responseCode = responseIsNull ? '' : response.status,
                    bExcludeFromErrorHandling = false;

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
                        for (var j = 0; j < exclusion.methods.length; j++) {
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
                        bExcludeFromErrorHandling = true;
                        break;
                    }
                }

                return bExcludeFromErrorHandling;
            }
        };
    };
}).run(['$injector', function($injector) {
    $injector.get("$http").defaults.transformRequest = function(data, headersGetter) {
        var token = $injector.get('bearhug').getOAuthToken();

        if (token) {
            var headers = headersGetter();
            headers.Authorization = "Bearer " + token;
            // TODO: should these headers be configurable?
            headers['Cache-Control'] = 'no-cache';
            headers.Pragma = 'no-cache';
        }

        if (data) {
            return angular.toJson(data);
        }
    };
}]);

