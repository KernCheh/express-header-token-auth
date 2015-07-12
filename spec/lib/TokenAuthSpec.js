describe('TokenAuth', function() {
  var TokenAuth = require('../../lib/TokenAuth'),
    fakeRequest = {
      headers: {
        authorization: 'Token token="mytesttoken", extraparams="info"'
      }
    },

    fakeResponse = {
      set: function(key, value) {},
      status: function(status) {},
      send: function(content) {}
    };

  beforeEach(function() {
    this.token = new TokenAuth(fakeRequest, fakeResponse);
  });

  describe('rawParams', function() {
    it('gathers params from token', function() {
      var result = this.token.rawParams('Token token=fake; test=something, param2=true');
      expect(result).toEqual([ 'token=fake', 'test=something', 'param2=true' ]);
    });
  });

  describe('paramsArrayFrom', function() {
    it('takes raw params and turns into array of parameters', function() {
      var result = this.token.paramsArrayFrom(['token=fake', 'param2=true']);
      expect(result).toEqual([ [ 'token', 'fake' ], [ 'param2', 'true' ] ]);
    });
  });

  describe('rewriteParamValues', function() {
    it('removes inverted commas from params', function() {
      var result = this.token.rewriteParamValues([ [ 'token', '"fake"' ], [ 'param2', '"true"' ] ]);
      expect(result).toEqual([ [ 'token', 'fake' ], [ 'param2', 'true' ] ]);
    });
  });

  describe('tokenAndOptions', function() {
    it('returns token as first item and additional options as a hash', function() {
      var result = this.token.tokenAndOptions();
      expect(result).toEqual([ 'mytesttoken', { extraparams: 'info' } ]);
    });

    it('returns undefined if header authorization is not present', function() {
      this.token.req.headers.authorization = undefined;
      expect(this.token.tokenAndOptions()).toEqual(undefined);
      this.token.req.headers.authorization = 'Token token="mytesttoken", extraparams="info"';
    })
  });

  describe('authenticateOrRequestWithHttpToken', function() {
    it('defaults to Application realm and calls back if token is found', function(done) {
      this.token.authenticateOrRequestWithHttpToken(function(err, token, options) {
        expect(token).toEqual('mytesttoken');
        expect(options).toEqual({ extraparams: 'info' });
        done();
      });
    });

    it('responds with 401 if token is not found', function(done) {
      spyOn(fakeResponse, 'set');
      spyOn(fakeResponse, 'status');
      spyOn(fakeResponse, 'send');

      var newRequest = {
        headers: {
          authorization: undefined
        }
      },
        token = new TokenAuth(newRequest, fakeResponse);

      token.authenticateOrRequestWithHttpToken(function(err, token, options) {
        expect(fakeResponse.set.calls.allArgs()).toEqual([ [ 'WWW-Authenticate', 'Basic realm="Application"' ] ]);
        expect(fakeResponse.status.calls.allArgs()).toEqual([ [401] ]);
        expect(fakeResponse.send.calls.allArgs()).toEqual([ ["HTTP Basic: Access denied.\n"] ]);
        done();
      });
    });
  });
});