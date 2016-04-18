/* global angular */
angular
  .module('talis.bearhug')
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('bearhugInterceptor');
  }]);