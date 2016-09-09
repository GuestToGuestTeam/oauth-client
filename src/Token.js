import Cookies from 'js-cookie';

export default class Token {

  static get COOKIE_NAME() {
    return 'token';
  }

  constructor(token) {
    if (typeof token !== 'object') {
      token = Cookies.get(Token.COOKIE_NAME);
      if (!token) {
        throw new Error('No token informations provided or cookie found');
      }
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
    Cookies.set(Token.COOKIE_NAME, {
      token_type: this.token_type,
      access_token: this.access_token,
      refresh_token: this.refresh_token,
      expires: this.expires.getTime(),
      scope: this.scope
    });
  }

  clear() {
    Cookies.remove(Token.COOKIE_NAME);
  }

}
