# Express Header Token Authentication

This package parses Authorization headers from an Express request object for an authorization token.

## Installation

```
npm install express-header-token-auth
```

## Usage

Token validation can be done through a routing middleware or part of the routed action.

Incoming Payload can be simulated by:

`curl -IH "Authorization: Token token=test;param1=option1;param2=option2" http://myapp.com/protected/resource`

Accepted Authorization Header formats are:


    Authorization: Token token=test,param1=option1,param2=option2
    Authorization: Token token="test",param1="option1",param2="option2"
    //Any variation of commas(,), semicolons(;) or tabs(   ) are accepted as delimiters


### As routing middleware


    router.use('/protected/resource', function(req, res, next) {
      new TokenAuth(req, res).authenticateOrRequestWithHttpToken(function(err, token, options) {
        if (!err) {
          if (isValidToken(token, options))
            next();
          else {
            // send out invalid response
          }
        }
        // `else` case is not needed. If `err` is present, a HTTP response with status 401 will automatically be sent out.
      });
    });


### As action


    router.use('/protected/resource', function(req, res, next) {
      new TokenAuth(req, res).authenticateOrRequestWithHttpToken(function(err, token, options) {
        if (!err) {
          if (isValidToken(token, options))
            // valid response
          else {
            // send out invalid response
          }
        }
        // `else` case is not needed. If `err` is present, a HTTP response with status 401 will automatically be sent out.
      });
    });


## Methods

`authenticateOrRequestWithHttpToken([realm], callback)`

Used to grab token and options from callback. When token is not found, HTTP status 401 challenge is automatically sent.
The `realm` parameter defaults to `Application`, which is used when challenging for token.

`authenticate(callback, [callbackOnError])`

Similar to `authenticateOrRequestWithHttpToken`, except the HTTP status 401 challenge will not be sent on failure to identify token. User is responsible for deciding the next course of action.
The `callbackOnError` parameter defaults to `true` and should rarely be needed.


`requestHttpTokenAuthentication(realm)`

Issues HTTP Status 401 challenge to current Response object.