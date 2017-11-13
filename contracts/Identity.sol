/*
SmartWallet Identity Contract
Status: WIP
Version: 0.1
*/

pragma solidity ^0.4.3;

contract Identity {

    address public owner;

    enum EVENT{ SUCCESS, WARNING, ERROR, INFO}

    bool private attributeModificationOnlyOwner;

    struct Attribute {
        address creator;
        string attributeHash;
        string definitionUrl;
        //Verification[] verifications;
        uint amountVerification;
        mapping(uint => Verification) verifications;
    }


    //if an organisation adds his address as a verification to an attribute
    //it verifies that it proofed the correctness of the data represented through
    //the hash
    struct Verification {
        address issuer;
        uint timestamp;
        bool accepted;

    }

    mapping(bytes32 => bytes) public properties;
    mapping(bytes32 => Attribute) public attributes;

    event EventNotification(address sender,uint8 eventType);

    function kill() { if (msg.sender == owner) selfdestruct(owner); }

    modifier onlyOwner() { // Modifier
        require(msg.sender == owner);
        _;
    }

    modifier attributePermissions(){
        require(msg.sender == owner || attributeModificationOnlyOwner == false);
        _;
    }
    function Identity() {
        owner = msg.sender;
        EventNotification(owner,uint8(EVENT.SUCCESS));
        attributeModificationOnlyOwner = false;

    }

    function changeOwner(address _newOwner) onlyOwner{
        owner = _newOwner;
        EventNotification(msg.sender,uint8(EVENT.SUCCESS));
    }

    function addAttribute(bytes32 _id,string _hash,string _definitionUrl) attributePermissions returns(bool) {
        var attribute = attributes[_id];

        // not possible to overwrite existing attribute
        require(bytes(attribute.attributeHash).length == 0);

        attribute.attributeHash = _hash;
        attribute.creator = msg.sender;
        attribute.definitionUrl = _definitionUrl;
        attribute.amountVerification = 0;
        EventNotification(msg.sender,uint8(EVENT.SUCCESS));
        return true;
    }

    function addProperty(bytes32 _id,bytes _value) onlyOwner returns(bool sufficient) {
        var property = properties[_id];

        // not possible to overwrite existing properties
        require(bytes(property).length == 0);

        properties[_id] = _value;
        EventNotification(msg.sender,uint8(EVENT.SUCCESS));
        return true;
    }

    function addAttributeToTargetIdentity(address _targetIdentityAddress,bytes32 _id,string _hash,string _definitionUrl) onlyOwner{
        Identity targetIdentity = Identity(_targetIdentityAddress);
        targetIdentity.addAttribute(_id,_hash,_definitionUrl);
        EventNotification(msg.sender,uint8(EVENT.SUCCESS));

    }

    function addVerificationToTargetIdentity(address _targetIdentityAddress,bytes32 _attributeId) onlyOwner{

        Identity targetIdentity = Identity(_targetIdentityAddress);
        targetIdentity.addVerification(_attributeId);

        EventNotification(msg.sender,uint8(EVENT.SUCCESS));

    }

    function addVerification(bytes32 _attributeId){

        Attribute storage attribute = attributes[_attributeId];
        uint idxNewVerification = attribute.amountVerification;

        // attribute needs to exist
        require(bytes(attribute.attributeHash).length  != 0);

        var verification = attribute.verifications[idxNewVerification];
        verification.issuer = msg.sender;
        verification.timestamp = block.timestamp;
        verification.accepted = false;

        attribute.amountVerification++;
        EventNotification(msg.sender,uint8(EVENT.SUCCESS));

    }


  function getNumberOfVerifications(bytes32 _attributeId) constant returns(uint){
    Attribute storage attribute = attributes[_attributeId];
    // attribute needs to exist
    require(bytes(attribute.attributeHash).length  != 0);
    return attribute.amountVerification;
  }

   function getVerification(bytes32 _attributeId, uint _verificationIdx) constant returns(address,uint,bool){
      Attribute storage attribute = attributes[_attributeId];
      // attribute needs to exist
      require(bytes(attribute.attributeHash).length  != 0);

      Verification storage verification = attribute.verifications[_verificationIdx];
      return(verification.issuer,verification.timestamp,verification.accepted);

    }

    function acceptVerification(bytes32 _attributeId, uint _verificationIdx) onlyOwner{
      Attribute storage attribute = attributes[_attributeId];
      // attribute needs to exist
      require(bytes(attribute.attributeHash).length  != 0);

      // verification needs to exist
      require(_verificationIdx < attribute.amountVerification);
       Verification storage verification = attribute.verifications[_verificationIdx];
       if(verification.accepted == true){
         EventNotification(msg.sender,uint8(EVENT.WARNING));
       }
       verification.accepted = true;
       EventNotification(msg.sender,uint8(EVENT.SUCCESS));

    }

    function removeAttribute(bytes32 _id) onlyOwner returns(bool) {
        Attribute storage attribute = attributes[_id];

        // attribute needs to exist
        require(bytes(attribute.attributeHash).length  != 0);
        delete attributes[_id];
        EventNotification(msg.sender,uint8(EVENT.SUCCESS));
        return true;
    }

    function setAttributeModificationOnlyOwner(bool _newPermission) onlyOwner{
      attributeModificationOnlyOwner = _newPermission;
      EventNotification(msg.sender,uint8(EVENT.SUCCESS));

    }

}
