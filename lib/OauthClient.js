'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _Token = require('./Token');

var _Token2 = _interopRequireDefault(_Token);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OauthClient = function () {
  function OauthClient(options) {
    _classCallCheck(this, OauthClient);

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
      this.token = new _Token2.default();
    } catch (err) {
      // no token cookie found
    }
  }

  _createClass(OauthClient, [{
    key: 'requestToken',
    value: function requestToken(username, password) {
      var body = {
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
  }, {
    key: 'refreshToken',
    value: function refreshToken() {
      if (!this.token) {
        throw new Error('Must request an access_token before.');
      }
      var body = {
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh_token
      };
      if (this.scope) {
        body.scope = this.scope;
      }
      return this.sendRequest(body);
    }
  }, {
    key: 'sendRequest',
    value: function sendRequest(body) {
      return (0, _isomorphicFetch2.default)(this.host + '/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify(body)
      }).then(function (response) {
        if (!response.ok) {
          // TODO handle error status : https://tools.ietf.org/html/rfc6749#section-5.2
          throw new Error(response.statusText);
        }
        return response;
      }).then(function (response) {
        return response.json();
      }).then(this.handleAccessTokenReponse.bind(this));
    }
  }, {
    key: 'handleAccessTokenReponse',
    value: function handleAccessTokenReponse(response) {
      this.token = new _Token2.default(response);
      return response;
    }
  }, {
    key: 'request',
    value: function request(path, options) {
      var _this = this;

      if (this.token && this.token.access_token) {
        // access_token should be expired, refresh it before execute request
        if (this.token.isAccessTokenExpired()) {
          return this.refreshToken().then(function (response) {
            return _this.request(path, options);
          });
        }
        // add Authorization header with access_token Bearer value
        options = Object.assign({}, options, {
          headers: {
            Authorization: this.token.token_type + ' ' + this.token.access_token
          }
        });
      }
      // execute request and return promise
      return (0, _isomorphicFetch2.default)(this.host + path, options);
    }
  }]);

  return OauthClient;
}();

exports.default = OauthClient;
module.exports = exports['default'];