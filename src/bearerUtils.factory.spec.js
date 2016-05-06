describe('bearerUtils', function() {
  var bearerUtils;

  function bearer(token) {
    return token ? ("Bearer " + token) : token;
  }

  // Set up the module
  beforeEach(module('talis.bearhug'));

  beforeEach(inject(function($injector) {
    bearerUtils = $injector.get('bearerUtils');
  }));

  describe('bearer2token', function() {

    it('should extract a valid token from a valid bearer', function () {
      expect(bearerUtils.bearer2token('Bearer foo')).toEqual('foo');
      expect(bearerUtils.bearer2token('Bearer bar')).toEqual('bar');
    });

    it('should return undefined for bearer tokens with illegal characters', function () {
      expect(bearerUtils.bearer2token('Bearer THIS IS NOT LEGAL')).toBeUndefined();
      expect(bearerUtils.bearer2token('Bearer THIS+IS/NOT[LEGAL]')).toBeUndefined();
    });


    it('should return undefined for invalid bearers', function () {
      expect(bearerUtils.bearer2token(void 0)).toBeUndefined();
      expect(bearerUtils.bearer2token('Notabearer')).toBeUndefined();
      expect(bearerUtils.bearer2token([1,2,3])).toBeUndefined();
      expect(bearerUtils.bearer2token(123)).toBeUndefined();
      expect(bearerUtils.bearer2token({ foo: 123 })).toBeUndefined();
      expect(bearerUtils.bearer2token('Bearers foo')).toBeUndefined();
    });
  });

  describe('token2bearer', function() {

    it('should convert a valid token into a valid bearer', function () {
      expect(bearerUtils.token2bearer('foo')).toEqual('Bearer foo');
      expect(bearerUtils.token2bearer('bar')).toEqual('Bearer bar');
    });

    it('should return undefined for invalid tokens', function () {
      expect(bearerUtils.token2bearer(void 0)).toBeUndefined();
      expect(bearerUtils.token2bearer([1,2,3])).toBeUndefined();
      expect(bearerUtils.token2bearer(123)).toBeUndefined();
      expect(bearerUtils.token2bearer({ foo: 123 })).toBeUndefined();
    });
  });
});