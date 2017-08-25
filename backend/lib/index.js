module.exports = dependencies => {
  const collector = require('./collector')(dependencies);
  const handler = require('./handler')(dependencies);
  const amqpListener = require('./amqp-listener')(dependencies);

  return {
    collector,
    handler,
    amqpListener
  };
};
