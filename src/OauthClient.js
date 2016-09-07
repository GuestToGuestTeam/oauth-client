// import request from 'superagent';
import fetch from 'isomorphic-fetch';

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
    const body = {
      grant_type: 'refresh_token',
      refresh_token: this.refresh_token
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
        return response.json();
      })
      .then(this.handleAccessTokenReponse.bind(this));
  }

  handleAccessTokenReponse(response) {
    // TODO handle error status : https://tools.ietf.org/html/rfc6749#section-5.2
    this.token_type = response.token_type;
    this.access_token = response.access_token;
    this.refresh_token = response.refresh_token;
    if (response.expires_in) {
      this.expires = this.getExpiresDateForDuration(response.expires_in);
    }
    return response;
  }

  getExpiresDateForDuration(duration) {
    // return current date time + duration converted to milliseconds
    const now = new Date();
    return new Date(now.getTime() + duration * 1000);
  }

  isAccessTokenExpired() {
    // access_token is expired if current expires date is <= to current time
    if (this.expires && this.expires instanceof Date) {
      const now = new Date();
      return now.getTime() >= this.expires.getTime();
    }
    return false;
  }

  request(path, options) {
    if (this.access_token) {
      // access_token should be expired, refresh it before execute request
      if (this.isAccessTokenExpired()) {
        return this.refreshToken()
          .then(response => {
            return this.request(path, options);
          });
      }
      // add Authorization header with access_token Bearer value
      options = Object.assign({}, options, {
        headers: {
          Authorization: `${this.token_type} ${this.access_token}`
        }
      });
    }
    // execute request and return promise
    return fetch(this.host + path, options);
  }

}
