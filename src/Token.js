import Cookies from 'js-cookie';

export default class Token {

  constructor(token) {
    if (typeof token !== 'object') {
      token = {
        token_type: Cookies.get('token_type'),
        access_token: Cookies.get('access_token'),
        refresh_token: Cookies.get('refresh_token'),
        expires: Cookies.get('expires'),
        scope: Cookies.get('scope')
      };
    }

    if (typeof token.token_type !== 'string') {
      throw new Error('"token_type" property is required and must be a string');
    }
    this.token_type = token.token_type;

    if (typeof token.access_token !== 'string') {
      throw new Error('"access_token" property is required and must be a string');
    }
    this.access_token = token.access_token;

    if (typeof token.expires_in === 'number') {
      token.expires = Token.getExpiresDateForDuration(token.expires_in);
    }

    if (typeof token.expires === 'number' || token.expires instanceof Date) {
      this.expires = token.expires instanceof Date ? token.expires : new Date(token.expires);
    }

    if (token.refresh_token) {
      this.refresh_token = token.refresh_token;
    }

    if (token.scope) {
      this.scope = token.scope;
    }

    this.store();
  }

  static getExpiresDateForDuration(duration) {
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

  store() {
    // store token informations in cookie
    Cookies.set('token_type', this.token_type);
    Cookies.set('access_token', this.access_token);
    Cookies.set('refresh_token', this.refresh_token);
    Cookies.set('expires', this.expires instanceof Date ? this.expires.getTime() : this.expires);
    Cookies.set('scope', this.scope);
  }

  clear() {
    Cookies.remove('token_type');
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('expires');
    Cookies.remove('scope');
  }

}
