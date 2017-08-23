const EXCHANGE_NAME = require('./constants').EVENTS.EXCHANGE_NAME;
const uuid = require('node-uuid');

module.exports = dependencies => {
  const amqpClientProvider = dependencies('amqpClientProvider');
  const logger = dependencies('logger');
  const collector = require('./collector')(dependencies);
  let amqpClient;

  return {
    start
  };

  function start() {
    const amqpClientPromise = amqpClientProvider.getClient();

    return amqpClientPromise
      .then(client => {
        amqpClient = client;

        amqpClient.subscribe(EXCHANGE_NAME, messageHandler);
      })
      .catch(err => logger.error('ContactCollector - Cannot connect to MQ', err));
  }

  function messageHandler(jsonMessage, originalMessage) {
    // for now, there is no id in the message, generate one to be able to track what's up
    const id = uuid.v4();

    log('New message received', jsonMessage);

    return collector.collect(jsonMessage)
      .then(() => {
        log('Successfully processed');
        amqpClient.ack(originalMessage);
      })
      .catch(err => log('Failed to process message', err));

    function log(message, args) {
      logger.debug(`ContactCollector [${id}] - ${message}`, args || '');
    }
  }
};
