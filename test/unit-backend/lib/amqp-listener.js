'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The amqp-listener lib module', function() {
  let jsonMessage, originalMessage;

  beforeEach(function() {
    jsonMessage = {id: 1};
    originalMessage = {foo: 'bar'};
    this.requireModule = function() {
      return require('../../../backend/lib/amqp-listener')(this.moduleHelpers.dependencies);
    };
  });

  describe('start function', function() {

    let ackSpy, getClientSpy, globalPubsubSpy, messageHandler;

    beforeEach(function() {
      ackSpy = sinon.spy();
      getClientSpy = sinon.spy(function() {
        return Promise.resolve({
          ack: ackSpy
        });
      });

      globalPubsubSpy = {
        topic: topic => {
          globalPubsubSpy.topicName = topic;

          return globalPubsubSpy;
        },
        subscribe: sinon.spy(handler => {
          messageHandler = handler;
        })
      };

      this.moduleHelpers.addDep('amqpClientProvider', {
        getClient: getClientSpy
      });

      this.moduleHelpers.addDep('pubsub', {
        global: globalPubsubSpy
      });
    });

    it('should subscribe to global pubsub\'s collect:emails', function() {
      mockery.registerMock('./collector', function() {});

      this.requireModule().start();
      expect(globalPubsubSpy.topicName).to.equal(CONSTANTS.EVENTS.EXCHANGE_NAME);
      expect(globalPubsubSpy.subscribe).to.have.been.calledOnce;
    });

    describe('message handler', function() {
      it('should collect message and ack it when handler resolves', function(done) {
        const handleSpy = sinon.spy(function() {
          return Promise.resolve([]);
        });

        mockery.registerMock('./handler', function() {
          return {
            handle: handleSpy
          };
        });

        this.requireModule().start();

        messageHandler(jsonMessage, originalMessage).then(function() {
          expect(handleSpy).to.have.been.calledWith(jsonMessage);
          expect(ackSpy).to.have.been.calledWith(originalMessage);
          done();
        }).catch(done);

      });

      it('should not ack the message when collector rejects', function(done) {
        const handleSpy = sinon.spy(function() {
          return Promise.reject(new Error('I failed to collect data'));
        });

        mockery.registerMock('./handler', function() {
          return {
            handle: handleSpy
          };
        });

        this.requireModule().start();
        messageHandler(jsonMessage, originalMessage).then(function() {
          expect(handleSpy).to.have.been.calledWith(jsonMessage);
          expect(ackSpy).to.not.have.been.called;
          done();
        }).catch(done);
      });
    });
  });
});
