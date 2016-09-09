import fetch from 'isomorphic-fetch';
import Token from './Token';

export default class OauthClient {

  constructor(options) {
    options = Object.assign({}, options);

    if (!options.client_id) {
      throw new Error('"client_id" option must be defined.');
    }

    if (!options.client_secret) {
      throw new Error('"client_secret" option must be defined.');
    }

    this.client_id = options.client_id;
    this.client_secret = options.client_secret;
    this.host = options.host ? options.host.replace(/\/$/, '') : '';
    this.scope = options.scope;

    // retrieve previous token informations from cookie if exists
    try {
      this.token = new Token();
    } catch (err) {
      // no token cookie found
    }
  }

  requestToken(username, password) {
    const body = {
      grant_type: 'client_credentials',
      client_id: this.client_id,
      client_secret: this.client_secret,
      username: username,
      password: password
    };
    if (this.scope) {
      body.scope = this.scope;
    }
    return this.sendRequest(body);
  }

  refreshToken() {
    if (!this.token) {
      throw new Error('Must request an access_token before.');
    }
    if (!this.token.refresh_token) {
      throw new Error('Must provide a "refresh_token" to be abble to refresh token.');
    }
    const body = {
      grant_type: 'refresh_token',
      refresh_token: this.token.refresh_token
    };
    if (this.scope) {
      body.scope = this.scope;
    }
    return this.sendRequest(body);
  }

  sendRequest(body) {
    return fetch(this.host + '/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: JSON.stringify(body)
    })
      .then(function (response) {
        if (!response.ok) {
          // TODO handle error status : https://tools.ietf.org/html/rfc6749#section-5.2
          throw new Error(response.statusText);
        }
        return response;
      })
      .then(function (response) {
        return response.json();
      })
      .then(this.handleAccessTokenReponse.bind(this));
  }

  handleAccessTokenReponse(response) {
    this.token = new Token(response);
    return response;
  }

  request(path, options) {
    if (this.token && this.token.access_token) {
      // if access_token expired and refresh_token is defined, refresh it before execute request
      if (this.token.isAccessTokenExpired() && this.token.refresh_token) {
        return this.refreshToken()
          .then(response => {
            return this.request(path, options);
          });
      }
      // add Authorization header with access_token Bearer value
      options = Object.assign({}, options, {
        headers: {
          Authorization: `${this.token.token_type} ${this.token.access_token}`
        }
      });
    }
    // execute request and return promise
    return fetch(this.host + path, options);
  }

}
