# linagora.esn.contact.collect

This module listen to OpenPaaS Events for collected data and create contacts in the CardDAV server when needed.

## Installation

This module can be installed in OpenPaaS as other modules. Check the [documentation](http://docs.open-paas.org/) for more details.

## Technical considerations

The contact collector module listen to events on the `collect:email` topic of the OpenPaaS local pubsub component. Once an event is received, it is processed to add new emails as contacts in a specific CardDAV addressbook of the current user.

### Events

- Event must contain the `userId` or the `userEmail` which will be used to identify the OpenPaaS user to collect emails for.
- Event must contain an array of emails. 

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

Contacts created from emails are stored in a specific user addressbook. The addressbook ID is `USER_ID_collected` where USER_ID is the ID of the user to collect emails for.
