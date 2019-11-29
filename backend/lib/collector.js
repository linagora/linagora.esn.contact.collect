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

    const { vcard: card, parsedEmail } = vcard.emailToVcard(email);

    if (!card) {
      return Promise.resolve({email, collected: false, err: new Error('Email can not be parsed (null, not email or empty)')});
    }

    const contactId = card.getFirstPropertyValue('uid');

    return getToken(user)
      .then(token =>
        checkContactDoesNotExists(token)
          .then(checkNotUser)
          .then(() => createContact(token))
          .then(publishContact)
          .then(() => ({ email, collected: true }))
      )
      .catch(err => ({ email, collected: false, err}));

    function checkContactDoesNotExists(token) {
      return contactModule.lib.client({ ESNToken: token, user })
        .searchContacts({
          search: parsedEmail,
          user
        }).then(result => {
          if (result.total_count !== 0) {
            throw new Error(`Contact with such email ${parsedEmail} already exists`);
          }
        });
    }

    function checkNotUser() {
      return Q.denodeify(userModule.findByEmail)(parsedEmail).then(result => {
        if (result) {
          throw new Error(`${parsedEmail} is a user and will not be collected`);
        }
      });
    }

    function createContact(token) {
      return contactModule.lib.client({ ESNToken: token, user })
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
        vcard: card.toJSON(),
        user: user
      });
    }
  }

  function getToken(user) {
    return Q.denodeify(userModule.getNewToken)(user, CONSTANTS.TOKEN_TTL)
      .then(data => {
        if (!data || !data.token) {
          throw new Error('Can not generate user token to collect contact');
        }

        return data.token;
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
