module.exports = dependencies => {
  const collector = require('./collector')(dependencies);
  const handler = require('./handler')(dependencies);
  const listener = require('./listener')(dependencies);

  return {
    collector,
    handler,
    listener
  };
};
