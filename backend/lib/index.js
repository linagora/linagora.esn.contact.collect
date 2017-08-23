module.exports = dependencies => {
  const collector = require('./collector')(dependencies);
  const listener = require('./listener')(dependencies);

  return {
    collector,
    listener
  };
};
