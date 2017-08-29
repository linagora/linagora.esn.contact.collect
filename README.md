# linagora.esn.contact.collect

This module listen to OpenPaaS Events for collected data and create contacts in the CardDAV server when needed.

## Installation

This module can be installed in OpenPaaS as other modules. Check the [documentation](http://docs.open-paas.org/) for more details.

## Technical considerations

The contact collector module listen to events on the `collector:email` exchanges on the OpenPaaS AMQP provider (RabbitMQ). Once a message is received, it is processed to add new emails as contacts in a specific CardDAV addressbook (`collected` address book) of the current user.

### Messages

- Message payload is a JSON as String.
- Message must contain the `userId` or the `userEmail` which will be used to identify the OpenPaaS user to collect emails for.
- Message must contain an array of emails.

```
{
  "userId": "57fca675a91c8d01a36ac26b",
  "emails": ["user1@open-paas.org", "User2 <user2@open-paas.org>", "John Doe <john.doe@open-paas.org>", "user3@open-paas.org"]
}
```

{
  "userEmail": "admin@open-paas.org",
  "emails": ["user1@open-paas.org", "User2 <user2@open-paas.org>", "John Doe <john.doe@open-paas.org>", "user3@open-paas.org"]
}

### AddressBook

Contacts created from emails are stored in the specific `collected` addressbook of the current user (the user defined by the message userId or userEmail). If the full name of the user can be extracted from the email, it will be use as contact `fn`. If not, the email will be used.
