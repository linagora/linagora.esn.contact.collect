(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact.collect')
    .service('contactCollectAddressbookService', contactCollectAddressbookService);

  function contactCollectAddressbookService() {
    return {
      isCollectedAddressbook: isCollectedAddressbook
    };

    function isCollectedAddressbook(shell) {
      return !!shell && shell.bookName === 'collected';
    }
  }
})(angular);
