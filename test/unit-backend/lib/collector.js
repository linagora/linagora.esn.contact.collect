'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');

describe('The collector lib module', function() {
  let collector, userId, userEmail, user, emails, email1;
  let contactClient, contactCreateSpy, searchContactsSpy;

  beforeEach(function() {
    userId = '1';
    user = { _id: userId, id: userId };
    userEmail = 'john@open-paas.org';
    email1 = 'user1@open-paas.org';
    emails = [email1];
    contactCreateSpy = sinon.spy();
    searchContactsSpy = sinon.spy();
    contactClient = function() {
      return {
        addressbookHome: function() {
          return {
            addressbook: function() {
              return {
                vcard: function() {
                  return {
                    create: contactCreateSpy
                  };
                }
              };
            },
            search: searchContactsSpy
          };
        }
      };
    };
    collector = require('../../../backend/lib/collector');
  });

  describe('The collect function', function() {
    it('should fail if event is undefined', function(done) {
      collector(this.moduleHelpers.dependencies).collect().then(function() {
        done(new Error('should not be called'));
      }, function(err) {
        expect(err.message).to.match(/Event is required/);
        done();
      });
    });

    it('should fail if event.emails is undefined', function(done) {
      collector(this.moduleHelpers.dependencies).collect({}).then(function() {
        done(new Error('should not be called'));
      }, function(err) {
        expect(err.message).to.match(/Emails array is required/);
        done();
      });
    });

    it('should fail if user can not be resolved from event.userId', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback();
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: [] }).then(function() {
        done(new Error('should not be called'));
      }, function(err) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(err.message).to.match(/Can not find user/);
        done();
      });
    });

    it('should fail if user can not be resolved from event.userId', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback();
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: [] }).then(function() {
        done(new Error('should not be called'));
      }, function(err) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(err.message).to.match(/Can not find user/);
        done();
      });
    });

    it('should fail if user retrieval from event.userId fails', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(new Error('Fail to get user'));
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: [] }).then(function() {
        done(new Error('should not be called'));
      }, function(err) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(err.message).to.match(/Fail to get user/);
        done();
      });
    });

    it('should fail if user can not be resolved from event.userEmail', function(done) {
      const getUserSpy = sinon.spy();
      const getUserFromEmailSpy = sinon.spy(function(email, callback) {
        callback();
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        findByEmail: getUserFromEmailSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userEmail: userEmail, emails: [] }).then(function() {
        done(new Error('should not be called'));
      }, function(err) {
        expect(getUserSpy).to.not.have.been.called;
        expect(getUserFromEmailSpy).to.have.been.calledWith(userEmail, sinon.match.func);
        expect(err.message).to.match(/Can not find user/);
        done();
      });
    });

    it('should fail if user retrieval from event.userEmail fails', function(done) {
      const getUserSpy = sinon.spy();
      const getUserFromEmailSpy = sinon.spy(function(email, callback) {
        callback(new Error('Fail to get user from email'));
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        findByEmail: getUserFromEmailSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userEmail: userEmail, emails: [] }).then(function() {
        done(new Error('should not be called'));
      }, function(err) {
        expect(getUserSpy).to.not.have.been.called;
        expect(getUserFromEmailSpy).to.have.been.calledWith(userEmail, sinon.match.func);
        expect(err.message).to.match(/Fail to get user from email/);
        done();
      });
    });

    it('should fail if email is undefined', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: [undefined] }).then(function(result) {
        expect(getUserSpy).to.have.been.called;
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/Email can not be parsed/);
        done();
      }, done);
    });

    it('should fail if email is empty string', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: [''] }).then(function(result) {
        expect(getUserSpy).to.have.been.called;
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/Email can not be parsed/);
        done();
      }, done);
    });

    it('should fail if email is not an email', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: ['not an email'] }).then(function(result) {
        expect(getUserSpy).to.have.been.called;
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/Email can not be parsed/);
        done();
      }, done);
    });

    it('should fail if token can not be generated', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy((user, ttl, callback) => {
        callback();
      });
      const topicSpy = sinon.spy();

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: (email, callback) => {
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(contactCreateSpy).to.not.have.been.called;
        expect(topicSpy).to.not.have.been.called;
        expect(getNewTokenSpy).to.have.been.calledWith(user);
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/Can not generate user token to collect contact/);
        done();
      }, done);
    });

    it('should fail if token generation fails', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy((user, ttl, callback) => {
        callback(new Error('I failed to generate token'));
      });
      const topicSpy = sinon.spy();

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: function(email, callback) {
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          client: contactCreateSpy
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(contactCreateSpy).to.not.have.been.called;
        expect(topicSpy).to.not.have.been.called;
        expect(getNewTokenSpy).to.have.been.calledWith(user);
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/I failed to generate token/);
        done();
      }, done);
    });

    it('should not create contact if search fails', function(done) {
      const getUserSpy = sinon.spy((userId, callback) => {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy((user, ttl, callback) => {
        callback(null, { token: 1 });
      });
      const topicSpy = sinon.spy();

      searchContactsSpy = sinon.stub().returns(Q.reject(new Error('Fail to search contact')));

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(searchContactsSpy).to.have.been.calledOnce;
        expect(searchContactsSpy).to.have.been.calledWith({
          search: email1
        });
        expect(contactCreateSpy).to.not.have.been.called;
        expect(topicSpy).to.not.have.been.called;
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/Fail to search contact/);
        done();
      }, done);
    });

    it('should not create contact if already exists', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy((user, ttl, callback) => {
        callback(null, { token: 1 });
      });
      const topicSpy = sinon.spy();

      searchContactsSpy = sinon.stub().returns(Q.resolve({ total_count: 1 }));

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: function(email, callback) {
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(searchContactsSpy).to.have.been.calledOnce;
        expect(searchContactsSpy).to.have.been.calledWith({ search: email1 });
        expect(contactCreateSpy).to.not.have.been.called;
        expect(topicSpy).to.not.have.been.called;
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/Contact with such email/);
        expect(result[0].err.message).to.match(/already exists/);
        done();
      }, done);
    });

    it('should not create contact if email is from a user', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy((user, ttl, callback) => {
        callback(null, { token: 1 });
      });
      const topicSpy = sinon.spy();

      searchContactsSpy = sinon.stub().returns(Q.resolve({ total_count: 0 }));

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: function(email, callback) {
          if (email === emails[0]) {
            return callback(null, {id: email});
          }
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(searchContactsSpy).to.have.been.calledOnce;
        expect(contactCreateSpy).to.not.have.been.called;
        expect(topicSpy).to.not.have.been.called;
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/is a user and will not be collected/);
        done();
      }, done);
    });

    it('should remove dupes from the emails', function(done) {
      emails.push(emails[0]);
      emails.push(emails[0]);
      emails.push(emails[0]);
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const topicSpy = sinon.spy();
      const getNewTokenSpy = sinon.spy((user, ttl, callback) => {
        callback(null, { token: 1 });
      });

      searchContactsSpy = sinon.stub().returns(Q.resolve({ total_count: 0 }));

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: function(email, callback) {
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(result.length).to.equal(1);
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(searchContactsSpy).to.have.been.calledOnce;
        done();
      }, done);
    });

    it('should not publish contact in pubsub if contact creation fails', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy(function(user, ttl, callback) {
        callback(null, { token: 1 });
      });
      const topicSpy = sinon.spy();

      searchContactsSpy = sinon.stub().returns(Q.resolve({ total_count: 0 }));
      contactCreateSpy = sinon.spy(function() {
        return Q.reject(new Error('I failed to create contact'));
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: function(email, callback) {
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(searchContactsSpy).to.have.been.calledOnce;
        expect(searchContactsSpy).to.have.been.calledWith({ search: email1 });
        expect(contactCreateSpy).to.have.been.called;
        expect(topicSpy).to.not.have.been.called;
        expect(getNewTokenSpy).to.have.been.calledWith(user);
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/I failed to create contact/);
        done();
      }, done);
    });

    it('should not publish contact if it has already been collected', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy(function(user, ttl, callback) {
        callback(null, {token: 1});
      });
      const forwardSpy = sinon.spy();
      const topicSpy = sinon.spy(function() {
        return {
          forward: forwardSpy
        };
      });

      searchContactsSpy = sinon.stub().returns(Q.resolve({ total_count: 0 }));
      contactCreateSpy = sinon.spy(function() {
        return Q.when({
          response: {
            statusCode: 204
          }
        });
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: function(email, callback) {
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          constants: {
            NOTIFICATIONS: {
              CONTACT_ADDED: 'contact:add'
            }
          },
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(searchContactsSpy).to.have.been.calledOnce;
        expect(searchContactsSpy).to.have.been.calledWith({ search: email1 });
        expect(getNewTokenSpy).to.have.been.calledWith(user);
        expect(contactCreateSpy).to.have.been.called;
        expect(topicSpy).to.not.have.been.called;
        expect(forwardSpy).to.not.have.been.called;
        expect(result[0].collected).to.be.false;
        expect(result[0].err.message).to.match(/already collected/);
        done();
      }, done);
    });

    it('should publish newly created contact in pubsub if all is OK', function(done) {
      const getUserSpy = sinon.spy(function(userId, callback) {
        callback(null, user);
      });
      const getNewTokenSpy = sinon.spy(function(user, ttl, callback) {
        callback(null, {token: 1});
      });
      const forwardSpy = sinon.spy();
      const topicSpy = sinon.spy(function() {
        return {
          forward: forwardSpy
        };
      });

      searchContactsSpy = sinon.stub().returns(Q.resolve({ total_count: 0 }));
      contactCreateSpy = sinon.spy(function() {
        return Q.when({
          response: {
            statusCode: 200
          }
        });
      });

      this.moduleHelpers.addDep('user', {
        get: getUserSpy,
        getNewToken: getNewTokenSpy,
        findByEmail: function(email, callback) {
          callback();
        }
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('contact', {
        lib: {
          constants: {
            NOTIFICATIONS: {
              CONTACT_ADDED: 'contact:add'
            }
          },
          client: contactClient
        }
      });

      collector(this.moduleHelpers.dependencies).collect({ userId: userId, emails: emails}).then(function(result) {
        expect(getUserSpy).to.have.been.calledWith(userId, sinon.match.func);
        expect(searchContactsSpy).to.have.been.calledOnce;
        expect(searchContactsSpy).to.have.been.calledWith({ search: email1 });
        expect(getNewTokenSpy).to.have.been.calledWith(user);
        expect(contactCreateSpy).to.have.been.called;
        expect(topicSpy).to.have.been.called;
        expect(forwardSpy).to.have.been.called;
        expect(forwardSpy.firstCall.args[1].vcard[0]).to.equal('vcard');
        expect(result[0].collected).to.be.true;
        done();
      }, done);
    });
  });
});
