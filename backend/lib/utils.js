const crypto = require('crypto');

module.exports = {
  hashEmailAddress
};

function hashEmailAddress(emailAddress) {
  return crypto.createHash('sha256').update(emailAddress).digest('hex');
}
