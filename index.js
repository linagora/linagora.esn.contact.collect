'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const glob = require('glob-all');

const FRONTEND_PATH = `${__dirname}/frontend/app/`;
const MODULE_NAME = 'contact.collect';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;

const collectModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.messaging', 'messaging'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],

  states: {
    lib: function(dependencies, callback) {
      const lib = require('./backend/lib')(dependencies);

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      const webserverWrapper = dependencies('webserver-wrapper');

      // Register the webapp
      const app = require('./backend/webserver/application')(dependencies, this);

      // Register every exposed frontend scripts
      const frontendJsFilesFullPath = glob.sync([
        `${FRONTEND_PATH}**/*.module.js`,
        `${FRONTEND_PATH}**/!(*spec).js`
      ]);
      const appFilesUri = frontendJsFilesFullPath.map(filePath => {
        return filePath.replace(FRONTEND_PATH, '');
      });

      webserverWrapper.injectAngularAppModules(MODULE_NAME, appFilesUri, AWESOME_MODULE_NAME, ['esn'], {
        localJsFiles: frontendJsFilesFullPath
      });

      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      this.listener.start();
      callback();
    }
  }
});

module.exports = collectModule;
