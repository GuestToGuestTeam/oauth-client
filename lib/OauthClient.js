'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // import request from 'superagent';


var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OauthClient = function () {
    function OauthClient(options) {
        _classCallCheck(this, OauthClient);

        if (!options.client_id) {
            throw '"client_id" option must be defined.';
        }
        if (!options.client_secret) {
            throw '"client_secret" option must be defined.';
        }
        this.client_id = options.client_id;
        this.client_secret = options.client_secret;
        this.host = options.host ? options.host.replace(/\/$/, "") : '';
        this.scope = options.scope;
        this.token_type = null;
        this.access_token = null;
        this.refresh_token = null;
        this.expires = null;
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
            var body = {
                grant_type: 'refresh_token',
                refresh_token: this.refresh_token
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
                return response.json();
            }).then(this.handleAccessTokenReponse.bind(this)).catch(this.handleRequestTokenError.bind(this));
        }
    }, {
        key: 'handleAccessTokenReponse',
        value: function handleAccessTokenReponse(response) {
            this.token_type = response.token_type;
            this.access_token = response.access_token;
            this.refresh_token = response.refresh_token;
            if (response.expires_in) {
                this.expires = this.getExpiresDateForDuration(response.expires_in);
            }
            return response;
        }
    }, {
        key: 'handleRequestTokenError',
        value: function handleRequestTokenError(error) {
            console.error(error);
            return error;
            // TODO handle error status :
            // invalid_request
            //     The request is missing a required parameter, includes an
            //     unsupported parameter value (other than grant type),
            //     repeats a parameter, includes multiple credentials,
            //     utilizes more than one mechanism for authenticating the
            //     client, or is otherwise malformed.
            //
            // invalid_client
            //     Client authentication failed (e.g., unknown client, no
            //     client authentication included, or unsupported
            //     authentication method).  The authorization server MAY
            //     return an HTTP 401 (Unauthorized) status code to indicate
            //     which HTTP authentication schemes are supported.  If the
            //     client attempted to authenticate via the "Authorization"
            //     request header field, the authorization server MUST
            //     respond with an HTTP 401 (Unauthorized) status code and
            //     include the "WWW-Authenticate" response header field
            //     matching the authentication scheme used by the client.
            //
            // invalid_grant
            //     The provided authorization grant (e.g., authorization
            //     code, resource owner credentials) or refresh token is
            //     invalid, expired, revoked, does not match the redirection
            //     URI used in the authorization request, or was issued to
            //     another client.
            //
            // unauthorized_client
            //    The authenticated client is not authorized to use this
            //    authorization grant type.
            //
            // unsupported_grant_type
            //     The authorization grant type is not supported by the
            //     authorization server.
            //
            // invalid_scope
            //    The requested scope is invalid, unknown, malformed, or
            //    exceeds the scope granted by the resource owner.
        }
    }, {
        key: 'getExpiresDateForDuration',
        value: function getExpiresDateForDuration(duration) {
            // return current date time + duration converted to milliseconds
            var now = new Date();
            return new Date(now.getTime() + duration * 1000);
        }
    }, {
        key: 'isAccessTokenExpired',
        value: function isAccessTokenExpired() {
            // access_token is expired if current expires date is <= to current time
            if (this.expires && this.expires instanceof Date) {
                var now = new Date();
                return now.getTime() >= this.expires.getTime();
            }
            return true;
        }
    }, {
        key: 'request',
        value: function request(path, options) {
            var _this = this;

            if (this.access_token) {
                // access_token should be expired, refresh it before execute request
                if (this.isAccessTokenExpired()) {
                    return this.refreshToken().then(function (response) {
                        return _this.request(path, options);
                    });
                }
                // add Authorization header with access_token Bearer value
                options = Object.assign({}, options, {
                    headers: {
                        'Authorization': (this.token_type || 'Bearer') + ' ' + this.access_token
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