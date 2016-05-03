(function(angular) {
    config.$inject = ["$httpProvider"];
    bearhugAuthenticator.$inject = ["$http", "$injector", "$q", "bearhugStorage"];
    bearhugInterceptor.$inject = ["$q", "$injector", "bearhugStorage"];
    bearhugStorage.$inject = ["bearerUtils"];
    interceptorFilter.$inject = ["$q"];
    angular.module("talis.bearhug", []);
    angular.module("talis.bearhug").factory("bearerUtils", bearerUtils);
    function bearerUtils() {
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
    }
    angular.module("talis.bearhug").config(config);
    function config($httpProvider) {
        $httpProvider.interceptors.push("bearhugInterceptor");
    }
    angular.module("talis.bearhug").provider("bearhug", BearhugProvider);
    function BearhugProvider() {
        var options = {
            authenticationFunction: null
        };
        this.setAuthenticationFunction = function(authFunc) {
            options.authenticationFunction = angular.isFunction(authFunc) ? authFunc : options.authenticationFunction;
        };
        this.$get = ["bearhugAuthenticator", "bearhugStorage", function(bearhugAuthenticator, bearhugStorage) {
            var opts = angular.copy(options);
            if (!angular.isFunction(opts.authenticationFunction)) {
                throw new Error("No authentication function specified. How can bearhug authenticate?");
            } else {
                return {
                    options: opts,
                    authenticate: authenticate,
                    getToken: bearhugStorage.getToken,
                    getBearer: bearhugStorage.getBearer
                };
            }
            function authenticate(requestConfig) {
                return bearhugAuthenticator.authenticate(opts, requestConfig);
            }
        }];
    }
    angular.module("talis.bearhug").factory("bearhugAuthenticator", bearhugAuthenticator);
    function bearhugAuthenticator($http, $injector, $q, bearhugStorage) {
        var authenticationDeferred;
        return {
            authenticate: authenticate
        };
        function authenticate(options) {
            var opts = angular.isObject(options) ? options : {};
            if (!angular.isFunction(opts.authenticationFunction)) {
                throw new Error("No authentication function available to bearhugAuthenticator");
            } else if (authenticationDeferred) {
                return authenticationDeferred.promise;
            } else {
                authenticationDeferred = $q.defer();
                var authPromise = opts.authenticationFunction($injector).then(function(tokenFromResponse) {
                    bearhugStorage.setToken(tokenFromResponse);
                    var token = bearhugStorage.getToken();
                    if (token) {
                        authenticationDeferred.resolve(token);
                    } else {
                        authenticationDeferred.reject(new Error("Token response is not a string: " + angular.toJson(tokenFromResponse)));
                    }
                }).catch(authenticationDeferred.reject);
                authPromise.finally(function() {
                    authenticationDeferred = void 0;
                });
                return authenticationDeferred.promise;
            }
        }
    }
    angular.module("talis.bearhug").factory("bearhugInterceptor", bearhugInterceptor);
    function bearhugInterceptor($q, $injector, bearhugStorage) {
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
            } else {
                return bearhug.authenticate(rejection.config).then(function() {
                    return $http(rejection.config);
                }).catch(function(err) {
                    return $q.reject(rejection);
                });
            }
        }
    }
    angular.module("talis.bearhug").factory("bearhugStorage", bearhugStorage);
    function bearhugStorage(bearerUtils) {
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
            token = angular.isString(newToken) ? newToken : token;
        }
        function getBearer() {
            return bearerUtils.token2bearer(getToken()) || null;
        }
        function setBearer(bearer) {
            var tokenFromBearer = bearerUtils.bearer2token(bearer);
            setToken(tokenFromBearer);
        }
    }
    angular.module("talis.bearhug").factory("interceptorFilter", interceptorFilter);
    function interceptorFilter($q) {
        var DEFAULTS = {
            request: function(requestConfig) {
                return requestConfig;
            },
            requestError: function(rejection) {
                return $q.reject(rejection);
            },
            response: function(response) {
                return response;
            },
            responseError: function(rejection) {
                return $q.reject(rejection);
            }
        };
        return {
            wrapInterceptor: wrapInterceptor,
            InterceptorFilter: InterceptorFilter
        };
        function InterceptorFilter(filterSpec) {
            return {
                apply: function(interceptor) {
                    return wrapInterceptor(interceptor, filterSpec);
                }
            };
        }
        function wrapInterceptor(interceptor, filterSpec) {
            var filteredInterceptor = {};
            var filters = buildFilterSpecObj(filterSpec);
            for (var key in interceptor || {}) {
                if (angular.isFunction(interceptor[key]) && angular.isFunction(filters[key])) {
                    filteredInterceptor[key] = proxiedInterceptFunc(interceptor[key], filters[key], DEFAULTS[key]);
                } else if (angular.isFunction(interceptor[key])) {
                    filteredInterceptor[key] = interceptor[key];
                }
            }
            return filteredInterceptor;
        }
        function buildFilterSpecObj(filterSpec) {
            if (angular.isFunction(filterSpec)) {
                return {
                    request: filterSpec,
                    requestError: filterSpec,
                    response: filterSpec,
                    responseError: filterSpec
                };
            } else if (angular.isObject(filterSpec)) {
                return filterSpec;
            } else {
                return {};
            }
        }
        function proxiedInterceptFunc(interceptorFunc, filterFunc, defaultFunc) {
            return function() {
                var args = arguments.length >= 1 ? Array.prototype.slice.call(arguments, 0) : [];
                if (filterFunc.apply(null, args)) {
                    return interceptorFunc.apply(null, args);
                } else {
                    return defaultFunc.apply(null, args);
                }
            };
        }
    }
})(angular);