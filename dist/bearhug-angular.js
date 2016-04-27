(function() {
    angular.module("talis.bearhug", []);
    angular.module("talis.bearhug").factory("bearerUtils", function() {
        var BEARER_REGEX = /^Bearer (.*)$/;
        return {
            bearer2token: bearer2token,
            token2bearer: token2bearer
        };
        function bearer2token(bearer) {
            var components = angular.isString(bearer) && bearer.match(BEARER_REGEX);
            return angular.isArray(components) && components[1] ? components[1] : void 0;
        }
        function token2bearer(token) {
            return angular.isString(token) ? "Bearer " + token : void 0;
        }
    });
    angular.module("talis.bearhug").config(["$httpProvider", function($httpProvider) {
        $httpProvider.interceptors.push("bearhugInterceptor");
    }]);
    angular.module("talis.bearhug").provider("bearhug", function BearhugProvider() {
        var options = {
            auth: {
                endpoint: "http://persona.staging/2/auth/providers/google/login.json?cb=JSON_CALLBACK",
                httpMethod: "JSONP",
                transformResponse: function(resp) {
                    return resp && resp.data && resp.data.oauth && resp.data.oauth.access_token || void 0;
                }
            },
            onError: console.error,
            onLog: console.log
        };
        this.setCreateEndpointFunc = function(getEndpointFunc) {
            options.getEndpoint = getEndpointFunc;
        };
        this.setOnError = function(onErrorFunc) {
            options.onError = onErrorFunc;
        };
        this.setOnLog = function(onLog) {
            options.onLog = onLog;
        };
        this.setAuthEndpoint = function(uri) {
            options.auth.endpoint = angular.isString(uri) ? uri : options.auth.endpoint;
        };
        this.$get = ["$injector", "bearhugAuthenticator", "bearhugStorage", function($injector, bearhugAuthenticator, bearhugStorage) {
            var opts = angular.copy(options);
            return {
                options: opts,
                authenticate: authenticate,
                getToken: bearhugStorage.getToken,
                getBearer: bearhugStorage.getBearer,
                getUser: bearhugStorage.getUser,
                getHasRetried: function() {
                    throw new Error("getHasRetried should never be called");
                },
                log: function(info) {
                    $injector.invoke(opts.onLog, this, {
                        info: info
                    });
                },
                error: function(err) {
                    $injector.invoke(opts.onError, this, {
                        err: err
                    });
                }
            };
            function authenticate(requestConfig) {
                return bearhugAuthenticator.authenticate(opts.auth, requestConfig);
            }
        }];
    });
    angular.module("talis.bearhug").factory("bearhugAuthenticator", ["$http", "$q", "bearhugStorage", function($http, $q, bearhugStorage) {
        var AUTH_DEFAULTS = {
            endpoint: null,
            httpMethod: null,
            transformResponse: null
        };
        var authenticationDeferred;
        return {
            authenticate: authenticate
        };
        function authenticate(options) {
            var opts = angular.extend({}, AUTH_DEFAULTS, options);
            var httpMethod = $http[opts.httpMethod && opts.httpMethod.toLowerCase()];
            if (!angular.isString(opts.endpoint)) {
                return $q.reject(new Error("authenticate.endpoint is not a valid string:", opts.endpoint));
            } else if (!angular.isFunction(httpMethod)) {
                return $q.reject(new Error("authenticate.httpMethod is invalid:", opts.httpMethod));
            } else if (authenticationDeferred) {
                return authenticationDeferred.promise;
            } else {
                authenticationDeferred = $q.defer();
                var authPromise = httpMethod(opts.endpoint).then(function(response) {
                    var responseData = response && response.data;
                    var tokenFromResponse = angular.isFunction(opts.transformResponse) ? opts.transformResponse(responseData) : responseData;
                    bearhugStorage.setToken(tokenFromResponse);
                    authenticationDeferred.resolve(bearhugStorage.getToken());
                }).catch(authenticationDeferred.reject);
                return authenticationDeferred.promise;
            }
        }
    }]);
    angular.module("talis.bearhug").factory("bearhugInterceptor", ["$q", "$injector", "bearhugStorage", function($q, $injector, bearhugStorage) {
        return {
            request: request,
            response: response,
            responseError: responseError
        };
        function request(requestConfig) {
            var bearer = bearhugStorage.getBearer();
            if (bearer && requestConfig && requestConfig.headers) {
                requestConfig.headers.Authorization = bearer;
            }
            return requestConfig;
        }
        function response(responseObj) {
            var bearer = responseObj && responseObj.headers("Authorization");
            if (bearer) {
                bearhugStorage.setBearer(bearer);
            }
            return responseObj;
        }
        function responseError(rejection) {
            var $http = $injector.get("$http");
            var bearhug = $injector.get("bearhug");
            if (!rejection || !rejection.status || !rejection.config) {
                return $q.reject(rejection);
            } else if (rejection.status !== 401) {
                return $q.reject(rejection);
            } else if (isResponseFromAuthenticationEndpoint(bearhug, rejection.config)) {
                return $q.reject(rejection);
            } else {
                return bearhug.authenticate(rejection.config).then(function() {
                    return $http(rejection.config);
                }).catch(function(err) {
                    return $q.reject(rejection);
                });
            }
        }
        function isResponseFromAuthenticationEndpoint(bearhug, config) {
            var auth = bearhug.options.auth;
            return config.url === auth.endpoint && config.method === auth.httpMethod;
        }
    }]);
    angular.module("talis.bearhug").factory("bearhugStorage", ["bearerUtils", function(bearerUtils) {
        var token = null;
        return {
            getToken: getToken,
            setToken: setToken,
            getBearer: getBearer,
            setBearer: setBearer
        };
        function getToken() {
            return token || null;
        }
        function setToken(newToken) {
            token = newToken ? newToken : token;
        }
        function getBearer() {
            return bearerUtils.token2bearer(getToken()) || null;
        }
        function setBearer(bearer) {
            var tokenFromBearer = bearerUtils.bearer2token(bearer);
            setToken(tokenFromBearer);
        }
    }]);
})();