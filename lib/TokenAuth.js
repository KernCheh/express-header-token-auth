var _ = require('underscore');

var TokenAuth = function(req, resp) {
  this.req = req;
  this.resp = resp;
};

_.extend(TokenAuth.prototype, {
  TOKEN_KEY: 'token=',
  TOKEN_REGEX: /^Token /,
  AUTHN_PAIR_DELIMITERS: /\s*(?:,|;|\t+)\s*/,

  /**
   * Parses token from Authorization header and returns token and options from callback.
   * Automatically responds with 401 requesting for Token Authentication.
   *
   * @param realm - Current authentication realm. Optional, defaults to 'Application'
   * @param callback - Can be passed in as first parameter. Parameters - (error, token, options)
   */
  authenticateOrRequestWithHttpToken: function(realm, callback) {
    if (typeof(realm) === 'function'){
      callback = realm;
      realm = 'Application';
    }

    if (!this.resp) {
      callback(new Error('Response object required to use `authenticateOrRequestWithHTTPToken`'));
      return;
    }
    return this.authenticate(callback, false) || this.requestHttpTokenAuthentication(realm) && callback(new Error('HTTP Basic: Access denied.'));
  },

  /**
   * Sets 401 response to Response object.
   *
   * @param realm - Current authentication realm
   */
  requestHttpTokenAuthentication: function(realm) {
    this.resp.set('WWW-Authenticate', 'Basic realm="' + realm + '"');
    this.resp.status(401);
    this.resp.send("HTTP Basic: Access denied.\n");
    return true;
  },

  /**
   * Attempts to parse Token and options from Authorization header.
   *
   * @param callback - (error, token, options)
   * @param callbackOnError - Optional. Defaults to true. When false, errors will not trigger callback.
   * @returns true if token is found, false if otherwise
   */
  authenticate: function(callback, callbackOnError) {
    if (callbackOnError === undefined)
      callbackOnError = true;

    var tokenAndOpts = this.tokenAndOptions();
    if (tokenAndOpts && tokenAndOpts[0]) {
      callback(null, tokenAndOpts[0], tokenAndOpts[1]);
      return true;
    }

    if (callbackOnError) {
      callback(new Error('Token not found'));
    }
    return false;
  },

  tokenAndOptions: function() {
    var auth = this.req.headers.authorization;
    if (auth && auth.match(this.TOKEN_REGEX)) {
      var params = this.tokenParamsFrom(auth);
      return [params.shift(1)[1], _.object(params)];
    }
  },

  tokenParamsFrom: function(auth) {
    return this.rewriteParamValues( this.paramsArrayFrom( this.rawParams(auth) ) );
  },

  rawParams: function(authorizationHeader) {
    var rawParams = authorizationHeader.replace(this.TOKEN_REGEX, '').split(this.AUTHN_PAIR_DELIMITERS);
    if (!rawParams[0].match(new RegExp('^' + this.TOKEN_KEY))) {
      rawParams[0] = this.TOKEN_KEY + rawParams[0];
    }

    return rawParams;
  },

  paramsArrayFrom: function(rawParams) {
    return _.map(rawParams, function(param) {
      return param.split(/=(?=.+)/);
    });
  },

  rewriteParamValues: function(arrayParams) {
    return _.map(arrayParams, function(param) {
      param[1] = (param[1] || '').replace(/^"|"$/g, '');
      return param;
    });
  }
});

module.exports = TokenAuth;