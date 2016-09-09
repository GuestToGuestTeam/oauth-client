/* eslint-disable no-unused-expressions */

import {expect} from 'chai';
import sinon from 'sinon';
import Cookies from 'js-cookie';
import Token from '../src/Token.js';

describe('Token', function () {

  describe('#getExpiresDateForDuration()', function () {

    it('should return expires date for a given time duration', function () {
      const now = new Date();
      const expires = Token.getExpiresDateForDuration(3600);
      expect(expires.getTime()).to.equal(now.getTime() + 3600 * 1000);
    });

  });

  describe('#constructor()', function () {

    it('should throw an error if no informations provided', function () {
      const fn = function () {
        return new Token();
      };
      expect(fn).to.throw(Error);
    });

    it('should throw an error if no "token_type" provided', function () {
      const fn = function () {
        return new Token({});
      };
      expect(fn).to.throw(Error);
    });

    it('should throw an error if no "access_token" provided', function () {
      const fn = function () {
        return new Token({
          token_type: 'bearer'
        });
      };
      expect(fn).to.throw(Error);
    });

    it('should not throw an error required property provided', function () {
      const fn = function () {
        return new Token({
          token_type: 'bearer',
          access_token: 'foo'
        });
      };
      expect(fn).to.not.throw(Error);
    });

    it('should convert "expires" time to Date object', function () {
      const fn = function () {
        return new Token({
          token_type: 'bearer',
          access_token: 'foo',
          refresh_token: 'bar',
          expires: 123456789
        });
      };
      expect(fn()).to.have.property('expires');
      expect(fn().expires).to.be.instanceof(Date);
      expect(fn().expires.getTime()).to.be.equal(123456789);
    });

    it('should set "refresh_token" property if defined', function () {
      const token = new Token({
        token_type: 'bearer',
        access_token: 'foo',
        refresh_token: 'bar',
        expires: 123456789
      });
      expect(token).to.have.property('refresh_token', 'bar');
    });

    it('should set "scope" property if defined', function () {
      const token = new Token({
        token_type: 'bearer',
        access_token: 'foo',
        refresh_token: 'bar',
        expires: 123456789,
        scope: 'email'
      });
      expect(token).to.have.property('scope', 'email');
    });

    it('should convert expires_in option to expires date if provided', function () {
      const fn = function () {
        return new Token({
          token_type: 'bearer',
          access_token: 'foo',
          refresh_token: 'bar',
          expires_in: 3600
        });
      };
      expect(fn).to.not.throw(Error);
      const expires = Token.getExpiresDateForDuration(3600);
      const token = fn();
      expect(token).to.have.property('expires');
      expect(token.expires.getTime()).to.be.equal(expires.getTime());
    });

    it('should retrive token from cookie if no arguments', function () {
      sinon.stub(Cookies, 'get', function (name) {
        if (name === Token.COOKIE_NAME) {
          return {
            token_type: 'bearer',
            access_token: 'foo',
            refresh_token: 'bar',
            expires: 123456789
          };
        }
      });

      const token = new Token();
      expect(token).to.have.property('token_type', 'bearer');
      expect(token).to.have.property('access_token', 'foo');
      expect(token).to.have.property('refresh_token', 'bar');
      expect(token).to.have.property('expires');
      expect(token.expires).to.be.an.instanceof(Date);
      expect(token.expires.getTime()).to.equal(123456789);
    });

  });

  describe('#isAccessTokenExpired()', function () {

    let token;

    beforeEach(function () {
      token = new Token({
        token_type: 'bearer',
        access_token: 'foo',
        refresh_token: 'bar',
        expires: Token.getExpiresDateForDuration(3600)
      });
    });

    it('should return false if access_token expires date is not defined', function () {
      token.expires = null;
      expect(token.isAccessTokenExpired()).to.be.false;
    });

    it('should return false if access_token expires date is not outdated', function () {
      expect(token.isAccessTokenExpired()).to.be.false;
    });

    it('should return true if access_token expires date is outdated', function () {
      const clock = sinon.useFakeTimers(new Date().getTime());
      clock.tick(3600 * 1000);

      expect(token.isAccessTokenExpired()).to.be.true;

      clock.restore();
    });

  });

  describe('#store()', function () {

    it('should call Cookies.set() with token informations', function () {
      const expires = Token.getExpiresDateForDuration(3600);
      const token = new Token({
        token_type: 'bearer',
        access_token: 'foo',
        refresh_token: 'bar',
        expires: expires,
        scope: 'email'
      });

      sinon.spy(Cookies, 'set');

      token.store();

      expect(Cookies.set.calledWith(
        Token.COOKIE_NAME,
        {
          token_type: 'bearer',
          access_token: 'foo',
          refresh_token: 'bar',
          expires: expires.getTime(),
          scope: 'email'
        }
      )).to.be.true;

      Cookies.set.restore();
    });

  });

  describe('#clear()', function () {

    it('should call Cookies.remove() to delete token cookie', function () {
      const expires = Token.getExpiresDateForDuration(3600);
      const token = new Token({
        token_type: 'bearer',
        access_token: 'foo',
        refresh_token: 'bar',
        expires: expires
      });

      sinon.spy(Cookies, 'remove');

      token.clear();

      expect(Cookies.remove.calledWith(Token.COOKIE_NAME)).to.be.true;

      Cookies.remove.restore();
    });

  });

});
