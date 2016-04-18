describe('bearhugAuthenticator', function() {
  var $http, $httpBackend, bearhugAuthenticator, bearhugStorage, bearerUtils;

  // Set up the module, especially loading the config that injects Bearhug's HTTP provider
  beforeEach(module('talis.bearhug'));

  beforeEach(inject(function($injector) {
    // Set up the mock http service responses
    $http = $injector.get('$http');
    $httpBackend = $injector.get('$httpBackend');
    bearhugAuthenticator = $injector.get('bearhugAuthenticator');
    bearhugStorage = $injector.get('bearhugStorage');
    bearerUtils = $injector.get('bearerUtils');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('authenticate', function() {

    var BASE_OPTS, FIRST_TOKEN, FAKE_OAUTH_RESPONSE;

    beforeEach(function() {
      BASE_OPTS = {
        endpoint: 'http://example.com/auth',
        httpMethod: null,
        transformResponse: function(resp) {
          return (resp && resp && resp.oauth && resp.oauth.access_token) || (void 0);
        }
      };

      FIRST_TOKEN = 'first';

      FAKE_OAUTH_RESPONSE = { 
        oauth: { 
          access_token: FIRST_TOKEN 
        }
      };
    });

    it('should set stored variables when using a JSONP endpoint', function () {
      var TEST_OPTS = angular.extend({}, BASE_OPTS, { httpMethod: 'JSONP' });

      $httpBackend.whenJSONP(TEST_OPTS.endpoint).respond(FAKE_OAUTH_RESPONSE);

      // before running tests, bearhug should have no stored data
      expect(bearhugStorage.getToken()).toBeNull();
      expect(bearhugStorage.getBearer()).toBeNull();

      // run test
      bearhugAuthenticator.authenticate(TEST_OPTS);
      $httpBackend.flush();

      // user and token should now be stored
      expect(bearhugStorage.getToken()).toBe(FIRST_TOKEN);
      expect(bearhugStorage.getBearer()).toBe(bearerUtils.token2bearer(FIRST_TOKEN));
    });


    it('should set stored variables when using a GET endpoint', function () {
      var TEST_OPTS = angular.extend({}, BASE_OPTS, { httpMethod: 'GET' });

      $httpBackend.whenGET(TEST_OPTS.endpoint).respond(FAKE_OAUTH_RESPONSE);

      // before running tests, bearhug should have no stored data
      expect(bearhugStorage.getToken()).toBeNull();
      expect(bearhugStorage.getBearer()).toBeNull();

      // run test
      bearhugAuthenticator.authenticate(TEST_OPTS);
      $httpBackend.flush();

      // user and token should now be stored
      expect(bearhugStorage.getToken()).toBe(FIRST_TOKEN);
      expect(bearhugStorage.getBearer()).toBe(bearerUtils.token2bearer(FIRST_TOKEN));
    });


    it('should set stored variables when using a POST endpoint', function () {
      var TEST_OPTS = angular.extend({}, BASE_OPTS, { httpMethod: 'POST' });

      $httpBackend.whenPOST(TEST_OPTS.endpoint).respond(FAKE_OAUTH_RESPONSE);

      // before running tests, bearhug should have no stored data
      expect(bearhugStorage.getToken()).toBeNull();
      expect(bearhugStorage.getBearer()).toBeNull();

      // run test
      bearhugAuthenticator.authenticate(TEST_OPTS);
      $httpBackend.flush();

      // user and token should now be stored
      expect(bearhugStorage.getToken()).toBe(FIRST_TOKEN);
      expect(bearhugStorage.getBearer()).toBe(bearerUtils.token2bearer(FIRST_TOKEN));
    });
  });
});