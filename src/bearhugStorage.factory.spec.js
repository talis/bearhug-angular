describe('bearhugStorage', function() {
  var bearhugStorage;

  // Set up the module, especially loading the config that injects Bearhug's HTTP provider
  beforeEach(module('talis.bearhug'));

  beforeEach(inject(function($injector) {
    bearhugStorage = $injector.get('bearhugStorage');
  }));


  describe('getToken', function() {

    it('should start undefined', function () {
      expect(bearhugStorage.getToken()).toBeFalsy();
    });

    it('should return the value after calling setToken', function () {
      bearhugStorage.setToken('foo');
      expect(bearhugStorage.getToken()).toBe('foo');
    });
  });


  describe('setToken', function() {

    it('should set the token when undefined', function () {
      bearhugStorage.setToken('foo');
      expect(bearhugStorage.getToken()).toBe('foo');
    });

    it('should replace any existing token', function () {
      bearhugStorage.setToken('foo');
      expect(bearhugStorage.getToken()).toBe('foo');
      // replace
      bearhugStorage.setToken('bar');
      expect(bearhugStorage.getToken()).toBe('bar');
    });

    it('should only update the token with a valid string', function () {
      // no token to start
      expect(bearhugStorage.getToken()).toBeFalsy();
      // numbers
      bearhugStorage.setToken(1);
      expect(bearhugStorage.getToken()).toBeFalsy();
      // boolean
      bearhugStorage.setToken(true);
      expect(bearhugStorage.getToken()).toBeFalsy();
      // object
      bearhugStorage.setToken({ foo: 1 });
      expect(bearhugStorage.getToken()).toBeFalsy();
      // array
      bearhugStorage.setToken([1, 2, 3]);
      expect(bearhugStorage.getToken()).toBeFalsy();
    });
  });


  describe('getBearer', function() {

    it('should start undefined', function () {
      expect(bearhugStorage.getBearer()).toBeFalsy();
    });

    it('should return the value after calling setToken', function () {
      bearhugStorage.setToken('foo');
      expect(bearhugStorage.getBearer()).toBe('Bearer foo');
    });
  });


  describe('setBearer', function() {

    it('should set the token when undefined', function () {
      bearhugStorage.setBearer('Bearer foo');
      expect(bearhugStorage.getBearer()).toBe('Bearer foo');
      expect(bearhugStorage.getToken()).toBe('foo');
    });

    it('should replace any existing token', function () {
      bearhugStorage.setBearer('Bearer foo');
      expect(bearhugStorage.getBearer()).toBe('Bearer foo');
      expect(bearhugStorage.getToken()).toBe('foo');
      // replace
      bearhugStorage.setBearer('Bearer bar');
      expect(bearhugStorage.getBearer()).toBe('Bearer bar');
      expect(bearhugStorage.getToken()).toBe('bar');
    });

    it('should only update the token with a valid string', function () {
      // no token to start
      expect(bearhugStorage.getToken()).toBeFalsy();
      // invalid strings [1] colon not space
      bearhugStorage.setBearer('Bearer:foo');
      expect(bearhugStorage.getToken()).toBeFalsy();
      // invalid strings [2] case mismatch
      bearhugStorage.setBearer('bearer foo');
      expect(bearhugStorage.getToken()).toBeFalsy();
      // invalid strings [3] does not start with bearer
      bearhugStorage.setBearer('foo');
      expect(bearhugStorage.getToken()).toBeFalsy();
      // numbers
      bearhugStorage.setBearer(1);
      expect(bearhugStorage.getToken()).toBeFalsy();
      // boolean
      bearhugStorage.setBearer(true);
      expect(bearhugStorage.getToken()).toBeFalsy();
      // object
      bearhugStorage.setBearer({ foo: 1 });
      expect(bearhugStorage.getToken()).toBeFalsy();
      // array
      bearhugStorage.setBearer([1, 2, 3]);
      expect(bearhugStorage.getToken()).toBeFalsy();
    });
  });


});