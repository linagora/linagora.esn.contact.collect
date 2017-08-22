'use strict';

const expect = require('chai').expect;

describe('The utils module', function() {
  let utils;

  beforeEach(function() {
    utils = require('../../../backend/lib/utils');
  });

  describe('The hashEmailAddress function', function() {
    let email1, email2;

    beforeEach(function() {
      email1 = 'chamerling@open-paas.org';
      email2 = 'christophe.hamerling@open-paas.org';
    });

    it('should return same value for same email inputs', function() {
      expect(utils.hashEmailAddress(email1)).to.deep.equals(utils.hashEmailAddress(email1));
    });

    it('should return different value for different email inputs', function() {
      expect(utils.hashEmailAddress(email1)).to.not.deep.equals(utils.hashEmailAddress(email2));
    });
  });
});
