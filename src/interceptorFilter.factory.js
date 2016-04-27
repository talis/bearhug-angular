/* global angular */
angular
  .module('talis.bearhug')
  .factory('interceptorFilter', interceptorFilter);

function interceptorFilter() {

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

    for (var key in (interceptor || {})) {
      if(angular.isFunction(interceptor[key]) && angular.isFunction(filters[key])) {
        // when there's a filter function available, proxy the interceptor and filter
        filteredInterceptor[key] = proxiedInterceptFunc(interceptor[key], filters[key]);
      } else if(angular.isFunction(interceptor[key])) {
        // when no filter function is available, always apply the interceptor
        filteredInterceptor[key] = interceptor[key];
      }
      // when no interceptor function is available, there's nothing to apply
    }
    return filteredInterceptor;
  }

  function buildFilterSpecObj(filterSpec) {
    if(angular.isFunction(filterSpec)) {
      return {
        request:       filterSpec,
        requestError:  filterSpec,
        response:      filterSpec,
        responseError: filterSpec
      };
    } else if (angular.isObject(filterSpec)) {
      return filterSpec;
    } else {
      return {};
    }
  }

  function proxiedInterceptFunc(interceptorFunc, filterFunc) {
    return function () {
      var args = (arguments.length >= 1) ? Array.prototype.slice.call(arguments, 0) : [];

      if(filterFunc.apply(null, args)) {
        return interceptorFunc.apply(null, args);
      } else {
        return (void 0);
      }
    };
  }
}
