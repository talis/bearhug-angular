/* global angular */
angular
  .module('talis.bearhug')
  .config(config);

function config($httpProvider) {
  $httpProvider.interceptors.push('bearhugInterceptor');
};