'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The handler lib module', function() {
  let jsonMessage;

  beforeEach(function() {
    jsonMessage = {id: 1};
    this.requireModule = function() {
      return require('../../../backend/lib/handler')(this.moduleHelpers.dependencies);
    };
  });

  describe('The handle function', function() {
    it('should collect message', function(done) {
      const result = [{email: 'foo@bar.com', collected: true}];
      const collectSpy = sinon.spy(function() {
        return Promise.resolve(result);
      });

      mockery.registerMock('./collector', function() {
        return {
          collect: collectSpy
        };
      });

      this.requireModule().handle(jsonMessage).then(function(collectResult) {
        expect(collectSpy).to.have.been.calledWith(jsonMessage);
        expect(collectResult).to.deep.equals(result);
        done();
      }, done);
    });

    it('should reject when collector rejects', function(done) {
      const error = new Error('I failed to collect messages');
      const collectSpy = sinon.spy(function() {
        return Promise.reject(error);
      });

      mockery.registerMock('./collector', function() {
        return {
          collect: collectSpy
        };
      });

      this.requireModule().handle(jsonMessage)
        .then(() => done(new Error('Should not occur')))
        .catch(err => {
          expect(err).to.deep.equals(error);
          done();
        });
    });
  });
});
