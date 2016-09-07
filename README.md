Oauth 2.0 Client
================

Oauth 2.0 client based on the “Resource Owner Password Credentials Grant” protocol defined in the [RFC 6749](https://tools.ietf.org/html/rfc6749).

```
 +----------+
 | Resource |
 |  Owner   |
 |          |
 +----------+
      v
      |    Resource Owner
     (A) Password Credentials
      |
      v
 +---------+                                  +---------------+
 |         |>--(B)---- Resource Owner ------->|               |
 |         |         Password Credentials     | Authorization |
 | Client  |                                  |     Server    |
 |         |<--(C)---- Access Token ---------<|               |
 |         |    (w/ Optional Refresh Token)   |               |
 +---------+                                  +---------------+

(A)  The resource owner provides the client with its username and
     password.

(B)  The client requests an access token from the authorization
     server's token endpoint by including the credentials received
     from the resource owner.  When making the request, the client
     authenticates with the authorization server.

(C)  The authorization server authenticates the client and validates
     the resource owner credentials, and if valid, issues an access
     token.
```

## How-to

```javascript
// initialize
var client = new OauthClient({
    host: '/oauth/v2',
    client_id: 's6BhdRkqt3',
    client_secret: '7Fjfp0ZBr1KtDRbnfVdmIw',
    scope: '' // optional
});

// request token
client.requestToken('john@mail.com', '123456')
  .then(function (response) {
    if (response.error) {
      throw new Error('request token failed', response.error);
    }
    console.log('request succeeded and return an access_token', response.access_token);
    // request resource after receive an access_token
    client.request('/user/1')
      .then(function (response) {
        if (response.error) {
          throw new Error('request failed', response.error);
        }
        console.log('request succeeded with JSON response', response);
        // you can manually refresh the token using the refreshToken method
        client.refreshToken();
      });
  });
```

`client.request()` use the Fetch API internally, so it use the same implementation.
See https://fetch.spec.whatwg.org/ and https://github.com/github/fetch for more informations.
