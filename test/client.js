/* eslint-disable no-unused-expressions */

import {expect} from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import OauthClient from '../src/OauthClient.js';
import Token from '../src/Token.js';

describe('OauthClient', function () {

  before(function () {
    // request token server response
    nock('http://localhost')
      .persist()
      .post('/token', function (body) {
        return body.grant_type === 'client_credentials';
      })
      .reply(function (uri, requestBody) {
        requestBody = JSON.parse(requestBody);
        if (requestBody.username === 'john@mail.com' && requestBody.password === '123456') {
          return [200, {
            access_token: "2YotnFZFEjr1zCsicMWpAA",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "tGzv3JOkF0XG5Qx2TlKWIA",
            scope: ""
          }];
        }
        return [401, {
          error: 'invalid_client'
        }];
      });
    // refresh token server response
    nock('http://localhost')
      .persist()
      .post('/token', function (body) {
        return body.grant_type === 'refresh_token';
      })
      .reply(200, {
        access_token: "52323ab0f95bdaf627dd8",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "4e8b0bd2031916e795ab7",
        scope: ""
      });
  });

  describe('#constructor()', function () {

    it('should throw error if "client_id" option is not defined', function () {
      expect(function () {
        return new OauthClient();
      }).to.throw('"client_id" option must be defined');
    });

    it('should throw error if "client_secret" option is not defined', function () {
      expect(function () {
        return new OauthClient({
          client_id: 'foo'
        });
      }).to.throw('"client_secret" option must be defined');
    });

    it('should initialize with empty host', function () {
      const client = new OauthClient({
        client_id: 'foo',
        client_secret: 'bar'
      });
      expect(client.host).to.equal('');
    });

    it('should remove trailing slash on "host" option if defined', function () {
      const client = new OauthClient({
        client_id: 'foo',
        client_secret: 'bar',
        host: 'http://localhost/'
      });
      expect(client.host).to.equal('http://localhost');
    });

    it('should initialize with empty host', function () {
      const client = new OauthClient({
        client_id: 'foo',
        client_secret: 'bar',
        host: 'http://localhost/',
        scope: 'email friends'
      });
      expect(client.scope).to.equal('email friends');
    });

  });

  describe('#requestToken()', function () {

    let client;

    beforeEach(function () {
      client = new OauthClient({
        client_id: 'foo',
        client_secret: 'bar',
        host: 'http://localhost',
        scope: 'email'
      });
    });

    it('should send request token query', function () {
      sinon.spy(client, 'sendRequest');

      client.requestToken('john@mail.com', '123456');

      expect(client.sendRequest.withArgs({
        grant_type: 'client_credentials',
        client_id: client.client_id,
        client_secret: client.client_secret,
        username: 'john@mail.com',
        password: '123456',
        scope: 'email'
      }).calledOnce).to.be.true;

      client.sendRequest.restore();
    });

    it('should handle request token response', function (done) {
      client.requestToken('john@mail.com', '123456')
        .then(function () {
          expect(client.token.token_type).to.equal('bearer');
          expect(client.token.access_token).to.equal('2YotnFZFEjr1zCsicMWpAA');
          expect(client.token.refresh_token).to.equal('tGzv3JOkF0XG5Qx2TlKWIA');
          const expires = Token.getExpiresDateForDuration(3600);
          expect(client.token.expires.getTime()).to.closeTo(expires.getTime(), 1000);
          done();
        })
        .catch(function (err) {
          done(Error(err));
        });
    });

    it('should call error handler if request token failed', function (done) {
      client.requestToken('john@mail.com', 'abcdef')
        .then(function (response) {
          done(Error('should call error handler'));
        })
        .catch(function (err) {
          expect(err).to.be.an('error');
          done();
        });
    });

  });

  describe('#refreshToken()', function () {

    let client;

    beforeEach(function () {
      client = new OauthClient({
        client_id: 'foo',
        client_secret: 'bar',
        host: 'http://localhost',
        scope: 'email'
      });
      client.token = new Token({
        token_type: 'bearer',
        access_token: '52323ab0f95bdaf627dd8',
        refresh_token: '4e8b0bd2031916e795ab7',
        expires: Token.getExpiresDateForDuration(3600)
      });
    });

    it('should throw an error if callig refresh token before access token', function () {
      client.token = null;
      const fn = function () {
        client.refreshToken();
      };
      expect(fn).to.throw(Error);
    });

    it('should throw an error if callig refreshToken without refresh_token provided', function () {
      client.token.refresh_token = null;
      const fn = function () {
        client.refreshToken();
      };
      expect(fn).to.throw(Error);
    });

    it('should send refresh token query', function () {
      sinon.spy(client, 'sendRequest');

      client.refreshToken();

      expect(client.sendRequest.withArgs({
        grant_type: 'refresh_token',
        refresh_token: client.token.refresh_token,
        scope: 'email'
      }).calledOnce).to.be.true;

      client.sendRequest.restore();

    });

    it('should handle refresh token response', function (done) {
      client.refreshToken()
        .then(function () {
          expect(client.token.token_type).to.equal('bearer');
          expect(client.token.access_token).to.equal('52323ab0f95bdaf627dd8');
          expect(client.token.refresh_token).to.equal('4e8b0bd2031916e795ab7');
          const expires = Token.getExpiresDateForDuration(3600);
          expect(client.token.expires.getTime()).to.closeTo(expires.getTime(), 1000);
          done();
        })
        .catch(function (err) {
          done(Error(err));
        });
    });

  });

  describe('#request()', function () {

    let client;

    let clock;

    before(function () {
      // public path
      nock('http://localhost', {})
        .persist()
        .get('/hello')
        .reply(200, 'hello');

      // defined Authorization header -> 200
      nock('http://localhost', {
        reqheaders: {
          Authorization: /^Bearer/i
        }
      })
        .persist()
        .get('/users/1')
        .reply(function (uri, requestBody) {
          if (client.token.isAccessTokenExpired()) {
            return [401, 'Unauthorized'];
          }
          return [200, {
            id: 1,
            username: 'john',
            email: 'john@gmail.com'
          }];
        });

      // missing Authorization header -> 401
      nock('http://localhost', {})
        .persist()
        .get('/users/1')
        .reply(401, 'Unauthorized');
    });

    beforeEach(function () {
      client = new OauthClient({
        client_id: 'foo',
        client_secret: 'bar',
        host: 'http://localhost'
      });

      clock = sinon.useFakeTimers(new Date().getTime());
    });

    afterEach(function () {
      clock.restore();
    });

    it('should accept request without authorization requirement', function (done) {
      client.request('/hello')
        .then(function (response) {
          expect(response.status).to.equal(200);
          done();
        });
    });

    it('should reject request without access_token shoud fail with status 401', function (done) {
      client.request('/users/1')
        .then(function (response) {
          expect(response.status).to.equal(401);
          done();
        });
    });

    it('should accept request with Authorization header defined', function (done) {
      client.requestToken('john@mail.com', '123456')
        .then(function () {
          client.request('/users/1')
            .then(function (response) {
              expect(response.status).to.equal(200);
              done();
            })
            .catch(function (err) {
              done(Error(err));
            });
        })
        .catch(function (err) {
          done(Error(err));
        });
    });

    it('should refresh token when expires date is outdated', function (done) {
      sinon.spy(client, 'refreshToken');

      client.requestToken('john@mail.com', '123456')
        .then(function (response) {

          const initialAccessToken = response.access_token;

          // fake time
          const now = new Date();
          clock.tick(client.token.expires.getTime() - now.getTime());

          client.request('/users/1')
            .then(function (response) {
              expect(client.refreshToken.calledOnce).to.be.true;
              expect(client.token.access_token).to.not.equal(initialAccessToken);
              expect(client.token.expires.getTime()).to.be.above((new Date()).getTime());
              expect(response.status).to.equal(200);
              done();
            })
            .catch(function (err) {
              done(Error(err));
            });
        })
        .catch(function (err) {
          done(Error(err));
        });
    });

  });

  describe('Workflow', function () {

    it('should succeed complete workflow', function (done) {
      const client = new OauthClient({
        client_id: 'foo',
        client_secret: 'bar',
        host: 'http://localhost'
      });

      client.requestToken('john@mail.com', '123456')
        .then(function (response) {
          if (response.error) {
            done(Error('request token failed', response.error));
          }
          // request resource after receive an access_token
          client.request('/users/1')
            .then(function (response) {
              if (response.error) {
                done(Error('request failed', response.error));
              }
              // manually refresh token
              client.refreshToken()
                .then(function () {
                  done();
                });
            });
        });
    });

  });

});
