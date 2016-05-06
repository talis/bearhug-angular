describe('bearhugAuthenticator', function() {
  var $http;
  var $httpBackend;
  var bearhugAuthenticator;
  var bearhugStorage;

  // Set up the module, especially loading the config that injects Bearhug's HTTP provider
  beforeEach(module('talis.bearhug'));

  beforeEach(inject(function($injector) {
    // Set up the mock http service responses
    $http = $injector.get('$http');
    $httpBackend = $injector.get('$httpBackend');
    bearhugAuthenticator = $injector.get('bearhugAuthenticator');
    bearhugStorage = $injector.get('bearhugStorage');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('authenticate', function() {

    var AUTH_ENDPOINT = 'http://example.com/auth';

    // fixture constants
    var BASE_OPTS = {};

    var FIRST_TOKEN = 'first';

    var FAKE_OAUTH_RESPONSE = { 
      oauth: { 
        access_token: FIRST_TOKEN 
      }
    };

    var authOpts = function(httpMethod) {
      var authPromise =
        httpMethod(AUTH_ENDPOINT)
          .then(function(response) {
            return response && response.data && response.data.oauth && response.data.oauth.access_token;
          });
      var authenticationFunction = function() { return authPromise; };
      return { authenticationFunction: authenticationFunction };
    };

    it('should set stored variables when using a JSONP endpoint', function () {
      var TEST_OPTS = angular.extend({}, BASE_OPTS, authOpts($http.jsonp));

      $httpBackend.whenJSONP(AUTH_ENDPOINT).respond(FAKE_OAUTH_RESPONSE);

      // before running tests, bearhug should have no stored data
      expect(bearhugStorage.getToken()).toBeNull();
      expect(bearhugStorage.getBearer()).toBeNull();

      // run test
      bearhugAuthenticator.authenticate(TEST_OPTS);
      $httpBackend.flush();

      // user and token should now be stored
      expect(bearhugStorage.getToken()).toBe(FIRST_TOKEN);
      expect(bearhugStorage.getBearer()).toBeDefined();
    });


    it('should set stored variables when using a GET endpoint', function () {
      var TEST_OPTS = angular.extend({}, BASE_OPTS, authOpts($http.get));

      $httpBackend.whenGET(AUTH_ENDPOINT).respond(FAKE_OAUTH_RESPONSE);

      // before running tests, bearhug should have no stored data
      expect(bearhugStorage.getToken()).toBeNull();
      expect(bearhugStorage.getBearer()).toBeNull();

      // run test
      bearhugAuthenticator.authenticate(TEST_OPTS);
      $httpBackend.flush();

      // user and token should now be stored
      expect(bearhugStorage.getToken()).toBe(FIRST_TOKEN);
      expect(bearhugStorage.getBearer()).toBeDefined();
    });


    it('should set stored variables when using a POST endpoint', function () {
      var TEST_OPTS = angular.extend({}, BASE_OPTS, authOpts($http.post));

      $httpBackend.whenPOST(AUTH_ENDPOINT).respond(FAKE_OAUTH_RESPONSE);

      // before running tests, bearhug should have no stored data
      expect(bearhugStorage.getToken()).toBeNull();
      expect(bearhugStorage.getBearer()).toBeNull();

      // run test
      bearhugAuthenticator.authenticate(TEST_OPTS);
      $httpBackend.flush();

      // user and token should now be stored
      expect(bearhugStorage.getToken()).toBe(FIRST_TOKEN);
      expect(bearhugStorage.getBearer()).toBeDefined();
    });


    it('should reject when a token is extracted but not a valid token', function () {
      var TEST_OPTS = angular.extend({}, BASE_OPTS, authOpts($http.post));

      $httpBackend.whenPOST(AUTH_ENDPOINT).respond({ oauth: { access_token: { foo: 1 }}});

      // before running tests, bearhug should have no stored data
      expect(bearhugStorage.getToken()).toBeNull();
      expect(bearhugStorage.getBearer()).toBeNull();

      // run test
      bearhugAuthenticator.authenticate(TEST_OPTS)
        .then(function() {
          fail('This should not be reached');
        })
        .catch(function(rejection) {
          // user and token should now be stored
          expect(bearhugStorage.getToken()).toBeNull();
        });

      $httpBackend.flush();
    });
  });
});