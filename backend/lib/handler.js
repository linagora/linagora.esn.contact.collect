const uuid = require('uuid/v4');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const collector = require('./collector')(dependencies);

  return {
    handle
  };

  function handle(jsonMessage) {
    const id = uuid();

    log('New contacts to collect from', jsonMessage);

    return collector.collect(jsonMessage)
      .then(results => {
        log('Successfully processed');
        results.forEach(result => {
          log(`${result.email} has been collected: ${result.collected} ${!result.collected ? result.err : ''}`);
        });

        return results;
      })
      .catch(err => {
        log('Failed to collect contacts', err);
        throw err;
      });

    function log(message, args) {
      logger.debug(`ContactCollector [${id}] - ${message}`, args || '');
    }
  }
};
