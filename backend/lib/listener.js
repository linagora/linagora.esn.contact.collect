const { EXCHANGE_NAME } = require('./constants').EVENTS;

module.exports = dependencies => {
  const pointToPointMessaging = dependencies('messaging').pointToPoint;
  const logger = dependencies('logger');
  const handler = require('./handler')(dependencies);

  return {
    start
  };

  function start() {
    logger.info(`Starting pointToPointMessaging on "${EXCHANGE_NAME}" exchange`);
    pointToPointMessaging.get(EXCHANGE_NAME).receive(onMessage);
  }

  function onMessage(message, context) {
    return handler.handle(message)
      .then(() => context.ack())
      .catch(err => logger.debug('Error while collecting contacts', err));
  }
};
