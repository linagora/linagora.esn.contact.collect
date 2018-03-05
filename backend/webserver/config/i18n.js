'use strict';

module.exports = (dependencies, application) => {
  const i18n = require('../../lib/i18n')(dependencies);

  application.use(i18n.init);
};
