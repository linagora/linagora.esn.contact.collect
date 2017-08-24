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
    let user;

    return getUser()
      .then(collectEmails);

    function collectEmails() {
      return Q.all(event.emails.map(collectEmail));
    }

    function collectEmail(email) {
      const card = vcard.emailToVcard(email);
      const contactId = card.getFirstPropertyValue('uid');

      return ifContactDoesNotExists()
        .then(getToken)
        .then(createContact)
        .then(publishContact)
        .then(() => ({ email, collected: true }))
        .catch(err => ({ email, collected: false, err}));

      function ifContactDoesNotExists() {
        return Q.denodeify(contactModule.lib.search.searchContacts)({userId: user.id, bookId: user.id, search: email}).then(result => {
          if (result.total_count !== 0) {
            throw new Error(`Contact with such email ${email} already exists`);
          }
        });
      }

      function createContact(token) {
        return contactModule.lib.client({ ESNToken: token.token, user })
          .addressbookHome(user.id)
          .addressbook(CONSTANTS.ADDRESSBOOK_NAME)
          .vcard(contactId)
          .create(card);
      }

      function publishContact() {
        pubsub.local.topic(CONSTANTS.EVENTS.CONTACT_ADDED).forward(pubsub.global, {
          contactId: contactId,
          bookHome: user.id,
          bookName: CONSTANTS.ADDRESSBOOK_NAME,
          bookId: user.id,
          vcard: card,
          user: user
        });
      }
    }

    function getUser() {
      return (event.userId ? Q.denodeify(userModule.get)(event.userId) : Q.denodeify(userModule.findByEmail)(event.userEmail))
        .then(result => {
          if (!result) {
            throw new Error(`Can not find user ${event.userId || event.userEmail}`);
          }
          user = result;
        });
    }

    function getToken() {
      return Q.denodeify(userModule.getNewToken)(user, CONSTANTS.TOKEN_TTL)
        .then(token => {
          if (!token) {
            throw new Error('Can not generate user token to collect contact');
          }

          return token;
        });
    }
  }
};
