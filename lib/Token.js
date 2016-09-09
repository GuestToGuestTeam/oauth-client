'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsCookie = require('js-cookie');

var _jsCookie2 = _interopRequireDefault(_jsCookie);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Token = function () {
  _createClass(Token, null, [{
    key: 'COOKIE_NAME',
    get: function get() {
      return 'token';
    }
  }]);

  function Token(token) {
    _classCallCheck(this, Token);

    if ((typeof token === 'undefined' ? 'undefined' : _typeof(token)) !== 'object') {
      token = _jsCookie2.default.get(Token.COOKIE_NAME);
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

  _createClass(Token, [{
    key: 'isAccessTokenExpired',
    value: function isAccessTokenExpired() {
      // access_token is expired if current expires date is <= to current time
      if (this.expires && this.expires instanceof Date) {
        var now = new Date();
        return now.getTime() >= this.expires.getTime();
      }
      return false;
    }
  }, {
    key: 'store',
    value: function store() {
      // store token informations in cookie
      _jsCookie2.default.set(Token.COOKIE_NAME, {
        token_type: this.token_type,
        access_token: this.access_token,
        refresh_token: this.refresh_token,
        expires: this.expires.getTime(),
        scope: this.scope
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      _jsCookie2.default.remove(Token.COOKIE_NAME);
    }
  }], [{
    key: 'getExpiresDateForDuration',
    value: function getExpiresDateForDuration(duration) {
      // return current date time + duration converted to milliseconds
      var now = new Date();
      return new Date(now.getTime() + duration * 1000);
    }
  }]);

  return Token;
}();

exports.default = Token;
module.exports = exports['default'];