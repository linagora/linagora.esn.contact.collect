const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The listener lib module', function() {
  let message, pointToPoint;

  beforeEach(function() {
    message = { id: 1 };
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
      mockery.registerMock('./handler', () => ({ handle: () => {} }));

      this.requireModule().start();

      expect(pointToPoint.get).to.have.been.calledWith(CONSTANTS.EVENTS.EXCHANGE_NAME);
      expect(receive).to.have.been.calledWith(sinon.match.func);
    });

    describe('onMessage handler', function() {
      it('should handle message to collect email', function(done) {
        const handleSpy = sinon.stub().returns(Promise.resolve());

        mockery.registerMock('./handler', () => ({
          handle: handleSpy
        }));

        this.requireModule().start();

        receive.getCall(0).args[0](message)
          .then(() => {
            expect(handleSpy).to.have.been.calledWith(message);
            done();
          })
          .catch(done);
      });
    });
  });
});
