const _ = require('lodash');
const Q = require('q');
const CONSTANTS = require('./constants');
const vcard = require('./vcard');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const contactModule = dependencies('contact');
  const userModule = dependencies('user');

  return {
    collect
  };

  function collect(event) {
    logger.debug('Collecting contacts from', event);

    if (!event) {
      return Promise.reject(new Error('Event is required'));
    }

    if (!event.emails) {
      return Promise.reject(new Error('Emails array is required'));
    }

    return getUser(event)
      .then(user => collectEmails(user, event.emails));
  }

  function collectEmails(user, emails) {
    logger.debug(`Collecting emails ${emails} for user ${user._id}`);

    return Q.all(_.uniq(emails).map(collectEmail.bind(null, user)));
  }

  function collectEmail(user, email) {
    logger.debug(`Collecting email ${email} for user ${user._id}`);

    const card = vcard.emailToVcard(email);

    if (!card) {
      return Promise.resolve({email, collected: false, err: new Error('Email can not be parsed (null, not email or empty)')});
    }

    const contactId = card.getFirstPropertyValue('uid');

    return checkContactDoesNotExists()
      .then(checkNotUser)
      .then(getToken.bind(null, user))
      .then(createContact)
      .then(publishContact)
      .then(() => ({ email, collected: true }))
      .catch(err => ({ email, collected: false, err}));

    function checkContactDoesNotExists() {
      return Q.denodeify(contactModule.lib.search.searchContacts)({userId: user.id, bookId: user.id, search: email}).then(result => {
        if (result.total_count !== 0) {
          throw new Error(`Contact with such email ${email} already exists`);
        }
      });
    }

    function checkNotUser() {
      return Q.denodeify(userModule.findByEmail)(email).then(result => {
        if (result) {
          throw new Error(`${email} is a user and will not be collected`);
        }
      });
    }

    function createContact(token) {
      return contactModule.lib.client({ ESNToken: token.token, user })
        .addressbookHome(user.id)
        .addressbook(CONSTANTS.ADDRESSBOOK_NAME)
        .vcard(contactId)
        .create(card)
        .then(result => {
          if (result.response.statusCode === 204) {
            throw new Error(`${contactId} already collected`);
          }

          return result;
        });
    }

    function publishContact() {
      pubsub.local.topic(contactModule.lib.constants.NOTIFICATIONS.CONTACT_ADDED).forward(pubsub.global, {
        contactId: contactId,
        bookHome: user.id,
        bookName: CONSTANTS.ADDRESSBOOK_NAME,
        bookId: user.id,
        vcard: card,
        user: user
      });
    }
  }

  function getToken(user) {
    return Q.denodeify(userModule.getNewToken)(user, CONSTANTS.TOKEN_TTL)
      .then(token => {
        if (!token) {
          throw new Error('Can not generate user token to collect contact');
        }

        return token;
      });
  }

  function getUser(event) {
    return (event.userId ? Q.denodeify(userModule.get)(event.userId) : Q.denodeify(userModule.findByEmail)(event.userEmail))
      .then(result => {
        if (!result) {
          throw new Error(`Can not find user ${event.userId || event.userEmail}`);
        }

        return result;
      });
  }
};
