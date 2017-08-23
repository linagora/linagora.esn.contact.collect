'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');
const mockery = require('mockery');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The listener lib module', function() {
  let jsonMessage, originalMessage;

  beforeEach(function() {
    jsonMessage = {id: 1};
    originalMessage = {foo: 'bar'};
    this.requireModule = function() {
      return require('../../../backend/lib/listener')(this.moduleHelpers.dependencies);
    };
  });

  describe('The start function', function() {
    it('should create the AMQP client and subscribe to collect:emails', function(done) {
      const subscribeSpy = sinon.spy();
      const getClientSpy = sinon.spy(function() {
        return Q.when({
          subscribe: subscribeSpy
        });
      });

      this.moduleHelpers.addDep('amqpClientProvider', {
        getClient: getClientSpy
      });

      mockery.registerMock('./collector', function() {});

      this.requireModule().start().then(function() {
        expect(getClientSpy).to.have.been.calledOnce;
        expect(subscribeSpy).to.have.been.calledWith(CONSTANTS.EVENTS.EXCHANGE_NAME);
        done();
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    it('should not not reject if AMQP client creation fails', function(done) {
      const getClientSpy = sinon.spy(function() {
        return Q.reject(new Error('I failed'));
      });
      const logSpy = sinon.spy(this.moduleHelpers.dependencies('logger'), 'error');

      this.moduleHelpers.addDep('amqpClientProvider', {
        getClient: getClientSpy
      });

      mockery.registerMock('./collector', function() {});

      this.requireModule().start().then(function(result) {
        expect(getClientSpy).to.have.been.called;
        expect(result).to.be.empty;
        expect(logSpy).to.have.been.calledOnce;
        done();
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    describe('The message handler', function() {
      it('should collect message and ack it collector resolves', function(done) {
        let messageHandler;
        const subscribeSpy = sinon.spy(function(event, handler) {
          messageHandler = handler;
        });
        const amqpClientAck = sinon.spy();
        const getClientSpy = sinon.spy(function() {
          return Q.when({
            subscribe: subscribeSpy,
            ack: amqpClientAck
          });
        });
        const collectSpy = sinon.spy(function() {
          return Q.when();
        });

        this.moduleHelpers.addDep('amqpClientProvider', {
          getClient: getClientSpy
        });

        mockery.registerMock('./collector', function() {
          return {
            collect: collectSpy
          };
        });

        this.requireModule().start().then(function() {
          expect(getClientSpy).to.have.been.calledOnce;
          expect(subscribeSpy).to.have.been.calledWith(CONSTANTS.EVENTS.EXCHANGE_NAME, sinon.match.func);

          messageHandler(jsonMessage, originalMessage).then(function() {
            expect(collectSpy).to.have.been.calledWith(jsonMessage);
            expect(amqpClientAck).to.have.been.calledWith(originalMessage);
            done();
          }, done);
        }, function() {
          done(new Error('Should not be called'));
        });
      });

      it('should not ack the message when collector rejects', function(done) {
        let messageHandler;
        const subscribeSpy = sinon.spy(function(event, handler) {
          messageHandler = handler;
        });
        const amqpClientAck = sinon.spy();
        const getClientSpy = sinon.spy(function() {
          return Q.when({
            subscribe: subscribeSpy,
            ack: amqpClientAck
          });
        });
        const collectSpy = sinon.spy(function() {
          return Q.reject(new Error('I failed to collect data'));
        });

        this.moduleHelpers.addDep('amqpClientProvider', {
          getClient: getClientSpy
        });

        mockery.registerMock('./collector', function() {
          return {
            collect: collectSpy
          };
        });

        this.requireModule().start().then(function() {
          expect(getClientSpy).to.have.been.calledOnce;
          expect(subscribeSpy).to.have.been.calledWith(CONSTANTS.EVENTS.EXCHANGE_NAME, sinon.match.func);

          messageHandler(jsonMessage, originalMessage).then(function() {
            expect(collectSpy).to.have.been.calledWith(jsonMessage);
            expect(amqpClientAck).to.not.have.been.called;
            done();
          }, done);
        }, function() {
          done(new Error('Should not be called'));
        });
      });
    });
  });
});
