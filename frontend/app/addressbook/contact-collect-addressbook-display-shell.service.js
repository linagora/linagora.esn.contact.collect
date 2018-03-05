(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact.collect')
    .factory('ContactCollectAddressbookDisplayShell', function(
      ContactAddressbookDisplayShell,
      esnI18nService
    ) {
      var CollectAddressbookDisplayShell = function(shell) {
        this.shell = shell;
        this.icon = 'mdi-book-multiple';
        this.displayName = shell.name || esnI18nService.translate('Collected contacts').toString();
      };

      CollectAddressbookDisplayShell.prototype = new ContactAddressbookDisplayShell();

      return CollectAddressbookDisplayShell;
    });
})(angular);
