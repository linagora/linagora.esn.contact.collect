(function(angular) {
  'use strict';

  var MODULE_NAME = 'linagora.esn.contact.collect';

  angular.module(MODULE_NAME)

  .run(registerAddressbookDisplayShell);

  function registerAddressbookDisplayShell(
    contactAddressbookDisplayShellRegistry,
    contactCollectAddressbookService,
    ContactCollectAddressbookDisplayShell,
    contactAddressbookActionEdit,
    contactAddressbookActionDelete
  ) {
    contactAddressbookDisplayShellRegistry.add({
      id: MODULE_NAME,
      priority: 10,
      actions: [
        contactAddressbookActionEdit,
        contactAddressbookActionDelete
      ],
      displayShell: ContactCollectAddressbookDisplayShell,
      matchingFunction: contactCollectAddressbookService.isCollectedAddressbook
    });
  }
})(angular);
