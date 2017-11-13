pragma solidity ^0.4.3;
contract IdentityLookup  {
  mapping(address => address) public identityLookup;
  mapping(string => address) usernames;
  address owner;

  event EventNotification(address sender,uint8 eventType);
  enum EVENT{ SUCCESS, WARNING, ERROR, INFO}

  function IdentityLookup() {
    owner = msg.sender;
  }
  function kill() { if (msg.sender == owner) selfdestruct(owner); }

  function addIdentityAddressForOtherEntity(address _ownerIdentityAddress, address _identityAddress) {
     if(identityLookup[_ownerIdentityAddress] ==address(0)){
         //only allowed if address is unused
        identityLookup[_ownerIdentityAddress] = _identityAddress;
        EventNotification(msg.sender,uint8(EVENT.SUCCESS));
     }
     else{
        EventNotification(msg.sender,uint8(EVENT.ERROR));
     }

  }
  function addIdentityAddress(address _identityAddress) {
    //msg.sender allways allowed to overwrite his identity address
    identityLookup[msg.sender] = _identityAddress;
    EventNotification(msg.sender,uint8(EVENT.SUCCESS));

  }

  function getIdentityAddress(address _personalAddress) constant returns(address) {
    return identityLookup[_personalAddress];
  }

  function linkAUsernameWithIdentityAddress(string _username){
      //a username can only be linked to own identity address
      usernames[_username] = identityLookup[msg.sender];
  }
  function getIdentityAddressWithUsername(string _username) constant returns(address) {
    return usernames[_username];
  }

}
