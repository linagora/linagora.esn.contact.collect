const EXCHANGE_NAME = require('./constants').EVENTS.EXCHANGE_NAME;

module.exports = dependencies => {
  const amqpClientProvider = dependencies('amqpClientProvider');
  const globalPubsub = dependencies('pubsub').global;
  const logger = dependencies('logger');
  const handler = require('./handler')(dependencies);

  return {
    start
  };

  function start() {
    globalPubsub.topic(EXCHANGE_NAME).subscribe(messageHandler);
  }

  function messageHandler(jsonMessage, originalMessage) {
    return handler.handle(jsonMessage)
      .then(amqpClientProvider.getClient)
      .then(amqpClient => amqpClient.ack(originalMessage))
      .catch(err => logger.error('Fail to process message', err));
  }
};
