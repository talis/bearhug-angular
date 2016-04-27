describe('bearhugInterceptor', function() {
  var $http, $httpBackend, $q, bearhug, bearhugAuthenticator, bearhugStorage, bearerUtils;

    // create and save a token
  var AUTH_ENDPOINT = '/auth/me';
  var URI = '/foo';
  var TOKEN = 'foo';
  var BEARER;

  var AUTH_FUNC = function() {
    return $http.jsonp(AUTH_ENDPOINT);
  };

  var HEADERS_BEARER_ONLY = function(headers) {
    return headers.Authorization === BEARER;
  };

  var HEADERS_NO_BEARER = function(headers) {
    return !(headers.Authorization);
  };

  var ALWAYS_TRUE = function() { return true; };

  // Set up the module, especially loading the config that injects Bearhug's HTTP provider
  beforeEach(function() {

    // capture the bearhugProvider, configure bearhug
    var testBearhugProvider;
    angular
      .module('testApp', [])
      .config(function (bearhugProvider) {
        bearhugProvider.setAuthenticationFunction(AUTH_FUNC);
        bearhugProvider.setAuthenticationFunction(AUTH_FUNC);
        testBearhugProvider = bearhugProvider;
      });

    module('talis.bearhug', 'testApp');

    inject(function($injector) {
      // Set up the mock http service responses
      $http = $injector.get('$http');
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      bearhugAuthenticator = $injector.get('bearhugAuthenticator');
      bearhugStorage = $injector.get('bearhugStorage');
      bearerUtils = $injector.get('bearerUtils');

      // fetch the reconfigured bearhug
      bearhug = $injector.invoke(testBearhugProvider.$get);

      // fixture data
      BEARER = bearerUtils.token2bearer(TOKEN);
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  describe('request interceptor', function() {
    beforeEach(function() {
      bearhugStorage.setToken(TOKEN);
      expect(bearhugStorage.getToken()).toEqual(TOKEN);
      expect(bearhug.getToken()).toEqual(TOKEN);
    });

    it('should add stored token as an Authorization header in DELETE requests', function () {
      $httpBackend.expect('DELETE', URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, '');
      $http.delete(URI);
      $httpBackend.flush();
    });

    it('should add stored token as an Authorization header in GET requests', function () {
      $httpBackend.expect('GET', URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, '');
      $http.get(URI);
      $httpBackend.flush();
    });

    it('should add stored token as an Authorization header in HEAD requests', function () {
      $httpBackend.expect('HEAD', URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, '');
      $http.head(URI);
      $httpBackend.flush();
    });

    it('should add stored token as an Authorization header in JSONP requests', function () {
      $httpBackend.expect('JSONP', URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, '');
      $http.jsonp(URI);
      $httpBackend.flush();
    });

    it('should add stored token as an Authorization header in PATCH requests', function () {
      $httpBackend.expect('PATCH', URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, '');
      $http({ url: URI, method: 'PATCH'});
      $httpBackend.flush();
    });

    it('should add stored token as an Authorization header in POST requests', function () {
      $httpBackend.expect('POST', URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, '');
      $http.post(URI, {});
      $httpBackend.flush();
    });

    it('should add stored token as an Authorization header in PUT requests', function () {
      $httpBackend.expect('PUT', URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, '');
      $http.put(URI, {});
      $httpBackend.flush();
    });
  });


  describe('response interceptor', function() {
    it('should store the token from the response and add as a header in the next request', function () {
      var firstToken = 'first';
      var firstBearer = bearerUtils.token2bearer(firstToken);
      var secondToken = 'second';
      var secondBearer = bearerUtils.token2bearer(secondToken);

      $httpBackend.whenPOST('/auth').respond({ message: 'success' }, { aaa: 1, Authorization: firstBearer });
      $httpBackend.whenGET('/user').respond({ name: 'Matthew' }, {});
      $httpBackend.whenPUT('/user').respond({ name: 'Matthew' }, { aaa: 1, Authorization: secondBearer });

      // before any requests, bearer token should be undefined
      expect(bearhug.getToken()).toBeNull();

      // first  request returns a new Authorization header, so set current
      $http.post('/auth');
      $httpBackend.flush();
      expect(bearhug.getToken()).toBe(firstToken);

      // no Authorization header, so no change to bearer
      $http.get('/user');
      $httpBackend.flush();
      expect(bearhug.getToken()).toBe(firstToken);

      // first request returns a new Authorization header, so replace current
      $http.put('/user');
      $httpBackend.flush();
      expect(bearhug.getToken()).toBe(secondToken);

    });
  });


  describe('responseError interceptor', function() {

    it('should reauthorize once when a 401 is encountered', function () {
      // token starts unset
      expect(bearhug.getToken()).toBeNull();

      // authenticate should succeed
      spyOn(bearhugAuthenticator, 'authenticate').and.returnValue($q.when('foo'));

      // endpoint will be called twice: once failing auth, once succeeding
      $httpBackend.expectGET(URI, ALWAYS_TRUE, HEADERS_NO_BEARER).respond(401, 'fubar');
      $httpBackend.expectGET(URI, ALWAYS_TRUE, HEADERS_BEARER_ONLY).respond(200, 'bar');

      // call endpoint
      $http
        .get(URI)
        .then(function(response){
          // verify that response data from second call is returned
          expect(response.data).toBe('bar');
        });
      $httpBackend.flush();

      // verify call flow through authenticate method, and token established
      expect(bearhugAuthenticator.authenticate).toHaveBeenCalled();
    });

    it('should fail if authentication fails', function () {
      // token starts unset
      expect(bearhug.getToken()).toBeNull();

      // force authenticate to fail
      spyOn(bearhugAuthenticator, 'authenticate').and.returnValue($q.reject('foo'));

      // endpoint will be called twice: once failing auth, once succeeding
      $httpBackend.expectGET(URI, ALWAYS_TRUE, HEADERS_NO_BEARER).respond(401, 'fubar');

      // call endpoint again, this time expecting a failure
      $http
        .get(URI)
        .then(function(response) {
          fail('this should never be reached');
        })
        .catch(function(rejection) {
          expect(rejection.status).toBe(401);
          expect(rejection.data).toBe('fubar');
        });
      $httpBackend.flush();

      // verify call flow through authenticate method, even though it failed
      expect(bearhugAuthenticator.authenticate).toHaveBeenCalledTimes(1);
    });


    it('should fail if authentication fails', function () {
      // token starts unset
      expect(bearhug.getToken()).toBeNull();

      // force authenticate to fail
      spyOn(bearhugAuthenticator, 'authenticate').and.returnValue($q.reject('foo'));

      // endpoint will be called once, failing auth
      $httpBackend.expectGET(URI, ALWAYS_TRUE, HEADERS_NO_BEARER).respond(401, 'fubar');

      // call endpoint again, this time expecting a failure
      $http
        .get(URI)
        .then(function(response) {
          fail('this should never be reached');
        })
        .catch(function(rejection) {
          expect(rejection.status).toBe(401);
          expect(rejection.data).toBe('fubar');
        });
      $httpBackend.flush();

      // verify call flow through authenticate method, even though it failed
      expect(bearhugAuthenticator.authenticate).toHaveBeenCalledTimes(1);
    });


    it('should not recurse on 401 against authentication endpoint', function () {
      // token starts unset
      expect(bearhug.getToken()).toBeNull();

      spyOn(bearhugAuthenticator, 'authenticate').and.callThrough();

      // endpoint will be called once, failing auth
      $httpBackend.expectGET(URI, ALWAYS_TRUE, HEADERS_NO_BEARER).respond(401, 'fubar');

      // authentication endpoint also fails
      $httpBackend.expectJSONP(AUTH_ENDPOINT, ALWAYS_TRUE, ALWAYS_TRUE).respond(401);

      // call endpoint again, this time expecting a failure
      $http
        .get(URI)
        .then(function(response) {
          fail('this should never be reached');
        })
        .catch(function(rejection) {
          expect(rejection.status).toBe(401);
          expect(rejection.data).toBe('fubar');
        });
      $httpBackend.flush();

      // verify call flow through authenticate method, even though it failed
      expect(bearhugAuthenticator.authenticate).toHaveBeenCalledTimes(2);
    });
  });
});
