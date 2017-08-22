'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');
const MODULE_NAME = 'linagora.esn.contact.collect';

const collectModule = new AwesomeModule(MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),        
  ],

  states: {
    lib: function(dependencies, callback) {
      const lib = require('./backend/lib')(dependencies);

      return callback(null, lib);
    },

    start: function(dependencies, callback) {
      require('./backend/lib/collector')(dependencies).start();
      
      return callback();
    }
  }
});

module.exports = collectModule;
