const EXCHANGE_NAME = require('./constants').EVENTS.EXCHANGE_NAME;

module.exports = dependencies => {
  const amqpClientProvider = dependencies('amqpClientProvider');
  const logger = dependencies('logger');
  const handler = require('./handler')(dependencies);
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
    return handler.handle(jsonMessage)
      .then(() => amqpClient.ack(originalMessage))
      .catch(err => logger.error('Fail to process message', err));
  }
};
