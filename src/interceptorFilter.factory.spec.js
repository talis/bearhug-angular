describe('interceptorFilter', function() {
  var $q;
  var interceptorFilter;

  // Set up the module, especially loading the config that injects Bearhug's HTTP provider
  beforeEach(module('talis.bearhug'));

  beforeEach(inject(function($injector) {
    $q = $injector.get('$q');
    interceptorFilter = $injector.get('interceptorFilter');
  }));

  var DEFAULT_INTERCEPTOR = {
    request:       function() {},
    requestError:  function() {},
    response:      function() {},
    responseError: function() {}
  };

  describe('with no interceptor filterSpec', function() {

    it('request should be called directly', function () {
      spyOn(DEFAULT_INTERCEPTOR, 'request');
      var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR);
      wrappedInterceptor.request({ foo: 1 });
      expect(DEFAULT_INTERCEPTOR.request).toHaveBeenCalledWith({ foo: 1 });
    });

    it('requestError should be called directly', function () {
      spyOn(DEFAULT_INTERCEPTOR, 'requestError');
      var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR);
      wrappedInterceptor.requestError({ foo: 1 });
      expect(DEFAULT_INTERCEPTOR.requestError).toHaveBeenCalledWith({ foo: 1 });
    });

    it('response should be called directly', function () {
      spyOn(DEFAULT_INTERCEPTOR, 'response');
      var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR);
      wrappedInterceptor.response({ foo: 1 });
      expect(DEFAULT_INTERCEPTOR.response).toHaveBeenCalledWith({ foo: 1 });
    });

    it('responseError should be called directly', function () {
      spyOn(DEFAULT_INTERCEPTOR, 'responseError');
      var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR);
    
      wrappedInterceptor.responseError({ foo: 1 });
      expect(DEFAULT_INTERCEPTOR.responseError).toHaveBeenCalledWith({ foo: 1 });
    });
  });


  describe('with a truthy filterSpec', function() {

    var ALWAYS_TRUE = function() { return true; };

    describe('provided as an object', function() {
      var TRUTHY_FILTER_SPEC = {
        request:       ALWAYS_TRUE,
        requestError:  ALWAYS_TRUE,
        response:      ALWAYS_TRUE,
        responseError: ALWAYS_TRUE
      };

      it('request should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'request');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.request({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.request).toHaveBeenCalledWith({ foo: 1 });
      });

      it('requestError should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'requestError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.requestError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.requestError).toHaveBeenCalledWith({ foo: 1 });
      });

      it('response should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'response');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.response({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.response).toHaveBeenCalledWith({ foo: 1 });
      });

      it('responseError should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'responseError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.responseError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.responseError).toHaveBeenCalledWith({ foo: 1 });
      });
    });


    describe('provided as a single predicate function', function() {
      var TRUTHY_FILTER_SPEC = ALWAYS_TRUE;

      it('request should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'request');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.request({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.request).toHaveBeenCalledWith({ foo: 1 });
      });

      it('requestError should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'requestError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.requestError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.requestError).toHaveBeenCalledWith({ foo: 1 });
      });

      it('response should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'response');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.response({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.response).toHaveBeenCalledWith({ foo: 1 });
      });

      it('responseError should be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'responseError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, TRUTHY_FILTER_SPEC);
        wrappedInterceptor.responseError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.responseError).toHaveBeenCalledWith({ foo: 1 });
      });
    });
  });



  describe('with a falsy filterSpec', function() {

    var ALWAYS_FALSE = function() { return false; };

    describe('provided as an object', function() {    
      var FALSY_FILTER_SPEC = {
        request:       ALWAYS_FALSE,
        requestError:  ALWAYS_FALSE,
        response:      ALWAYS_FALSE,
        responseError: ALWAYS_FALSE
      };

      it('request should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'request');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        var requestConfig = wrappedInterceptor.request({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.request).not.toHaveBeenCalled();
        expect(requestConfig).toEqual({ foo: 1 });
      });

      it('requestError should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'requestError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        var requestRejection = wrappedInterceptor.requestError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.requestError).not.toHaveBeenCalled();
        requestRejection
          .then(fail)
          .catch(function(rejection) {
            expect(rejection).toEqual({ foo: 1 });
          });
      });

      it('response should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'response');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        var response = wrappedInterceptor.response({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.response).not.toHaveBeenCalled();
        expect(response).toEqual({ foo: 1 });
      });

      it('responseError should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'responseError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        var responseRejection = wrappedInterceptor.responseError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.responseError).not.toHaveBeenCalled();
        responseRejection
          .then(fail)
          .catch(function(rejection) {
            expect(rejection).toEqual({ foo: 1 });
          });
      });
    });


    describe('provided as a single predicate function', function() {    
      var FALSY_FILTER_SPEC = ALWAYS_FALSE;

      it('request should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'request');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        wrappedInterceptor.request({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.request).not.toHaveBeenCalled();
      });

      it('requestError should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'requestError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        wrappedInterceptor.requestError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.requestError).not.toHaveBeenCalled();
      });

      it('response should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'response');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        wrappedInterceptor.response({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.response).not.toHaveBeenCalled();
      });

      it('responseError should not be called', function () {
        spyOn(DEFAULT_INTERCEPTOR, 'responseError');
        var wrappedInterceptor = interceptorFilter.wrapInterceptor(DEFAULT_INTERCEPTOR, FALSY_FILTER_SPEC);
        wrappedInterceptor.responseError({ foo: 1 });
        expect(DEFAULT_INTERCEPTOR.responseError).not.toHaveBeenCalled();
      });
    });
  });


  describe('class constructor version works the same', function() {    

    it('constructing a new InterceptorFilter creates a wrapper around wrapInterceptor', function () {
      spyOn(DEFAULT_INTERCEPTOR, 'request');
      var truthyFilterSpec = function() { return true; };
      var filter = new interceptorFilter.InterceptorFilter(truthyFilterSpec);      
      var wrappedInterceptor = filter.apply(DEFAULT_INTERCEPTOR);
      wrappedInterceptor.request({ foo: 1 });
      expect(DEFAULT_INTERCEPTOR.request).toHaveBeenCalledWith({ foo: 1 });
    });
  });
});
