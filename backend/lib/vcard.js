const emailAddressParser = require('email-addresses');
const ICAL = require('ical.js');
const trim = require('trim');

module.exports = {
  emailToVcard
};

function emailToVcard(email) {
  const parsed = emailAddressParser.parseOneAddress(email);
  const id = encodeURIComponent(parsed.address);
  const vcard = new ICAL.Component('vcard');
  const emailProperty = vcard.addPropertyWithValue('email', parsed.address);

  vcard.addPropertyWithValue('version', '4.0');
  vcard.addPropertyWithValue('uid', id);
  emailProperty.setParameter('type', 'Work');

  if (parsed.name) {
    const name = trim(parsed.name).replace(/\s+/g, ' ');

    vcard.addPropertyWithValue('fn', name);
  } else {
    vcard.addPropertyWithValue('fn', parsed.address);
  }

  return vcard;
}
