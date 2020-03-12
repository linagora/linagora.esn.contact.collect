const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The listener lib module', function() {
  let message, context, pointToPoint;

  beforeEach(function() {
    message = { id: 1 };
    context = { ack: sinon.spy() };
    this.requireModule = function() {
      return require('../../../backend/lib/listener')(this.moduleHelpers.dependencies);
    };
  });

  describe('start function', function() {
    let receive;

    beforeEach(function() {
      receive = sinon.stub();
      pointToPoint = {
        get: sinon.stub().returns({ receive })
      };

      this.moduleHelpers.addDep('messaging', {
        pointToPoint
      });
    });

    it('should subscribe to "collect:emails" pointToPointMessaging', function() {
      mockery.registerMock('./handler', () => {});

      this.requireModule().start();

      expect(pointToPoint.get).to.have.been.calledWith(CONSTANTS.EVENTS.EXCHANGE_NAME);
      expect(receive).to.have.been.calledWith(sinon.match.func);
    });

    describe('onMessage handler', function() {
      it('should collect message and ack it when handler resolves', function(done) {
        const handleSpy = sinon.stub().returns(Promise.resolve());

        mockery.registerMock('./handler', () => ({
          handle: handleSpy
        }));

        this.requireModule().start();

        receive.getCall(0).args[0](message, context)
          .then(() => {
            expect(handleSpy).to.have.been.calledWith(message);
            expect(context.ack).to.have.been.calledOnce;
            done();
          })
          .catch(done);
      });

      it('should not ack the message when collector rejects', function(done) {
        const handleSpy = sinon.stub().returns(Promise.reject(new Error('I failed to collect data')));

        mockery.registerMock('./handler', function() {
          return {
            handle: handleSpy
          };
        });

        this.requireModule().start();

        receive.getCall(0).args[0](message, context)
          .then(() => {
            expect(handleSpy).to.have.been.calledWith(message);
            expect(context.ack).to.not.have.been.called;
            done();
          })
          .catch(done);
      });
    });
  });
});
