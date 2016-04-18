/* global angular */
angular
  .module('talis.bearhug')
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('bearhugInterceptor');
  });