module.exports = dependencies => {
  const collector = require('./collector')(dependencies);

  return {
    collector
  };
};
