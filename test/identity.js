var CryptoJS = require('crypto-js');

var Identity = artifacts.require('./Identity.sol');

var createHash = function(_id) {
  return '0x' + CryptoJS.SHA256(_id).toString();
};

var validateEmail = function(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const Event = {
  SUCCESS: 0,
  WARNING: 1,
  ERROR: 2,
  INFO: 3,
};
const ATTRIBUTE = {
  CREATOR: 0,
  ATTRIBUTE_HASH: 1,
  DEFINITION_URL: 2,
  AMOUNT_VERIFICATIONS: 3,
};
var checkEvent = function(_solidityTransactionObject, _eventType) {
  return _solidityTransactionObject.logs[0].args.eventType == _eventType;
};

contract('Identity', function(accounts) {
  it('create identity contract', function() {
    return Identity.deployed(accounts[0])
      .then(function(_instance) {
        return _instance.owner.call();
      })
      .then(function(_owner) {
        assert.equal(
          accounts[0],
          _owner,
          'identity contract not correctly deployed'
        );
      });
  });
  it('add a test property to Identity', function() {

    var webIdEncrypted = "0x12345678"; //needs to be hex

    var id = createHash('webid');
    
    var mainAddress = accounts[0]; //will pay the ether
    var identity;
    return Identity.deployed(accounts[0])
      .then(function(_instance) {
        identity = _instance;
        return identity.addProperty(id, webIdEncrypted, {
          from: mainAddress
        });
      })
      .then(function(_result) {
        //event
        //console.log(result.logs[0].args);
        return identity.properties.call(id);
      })
      .then(function(_result) {
        assert.equal(
          webIdEncrypted,
          _result,
          'webid not correctly safed in the smart contract'
        );
      });
  });
  it('try to get property which is not existing', function() {
    var identity;
    return Identity.deployed(accounts[0])
      .then(function(_instance) {
        identity = _instance;
        return identity.properties.call(createHash('non_existing_property'));
      })
      .then(function(_result) {
        assert.equal("0x",_result,"property should be empty");
      })

  });
  it('add attribute as owner', function() {
    var identity;
    //standardised format
    var defintionUrl = 'http://wwww.jolocom.com';
    // attribute in a standardised format rdf schema?
    var attribute = '{"email":"annika@jolocom.com"}';
    var hash = createHash(attribute);
    var id = createHash('email');

    return Identity.deployed(accounts[0])
      .then(function(_instance) {
        identity = _instance;
        return identity.addAttribute(id, hash, defintionUrl);
      })
      .then(function(result) {
        return identity.attributes.call(id);
      })
      .then(function(_attribute) {
        //assert.equal(hash,_attributeHash,"hash of attribute not set");
        assert.equal(
          hash,
          _attribute[ATTRIBUTE.ATTRIBUTE_HASH],
          'hash of attribute not set'
        );
      });
  });
});

contract('Identity Verifications', function(accounts) {
  //Identity contract in this test suit is only deployed once in the before function

  var identity;
  var id;

  before(function() {
    // deploy identity contract with one attribute
    //standardised format
    var defintionUrl = 'http://wwww.jolocom.com';
    // attribute in a standardised format rdf schema?
    var attribute = '{"email":"annika@jolocom.com"}';
    var hash = createHash(attribute);
    id = createHash('email');

    return Identity.deployed(accounts[0])
      .then(function(_instance) {
        identity = _instance;
        return identity.addAttribute(id, hash, defintionUrl);
      })
      .then(function(_result) {});
  });
  it('add verification to attribute proccess', function() {
    //Step 1.
    //external party recieves the attribute data. for example via solid server
    var recievedAttribute = '{"email":"annika@jolocom.com"}';
    var recievedAttributeIdHash = id;

    //Step 2.
    //proof the correctness of the attribute
    // could involve a complex external verification proccess
    // the trust will be build on the proccess and on the reputation of the third party

    //for test illustration we only proof the correct syntax of the email
    if (validateEmail(JSON.parse(recievedAttribute).email)) {
      return identity.attributes
        .call(recievedAttributeIdHash)
        .then(function(_attribute) {
          //Step 3. Proof if the hash in the smart contracts matches with the recieved one
          if (
            createHash(recievedAttribute) ===
            _attribute[ATTRIBUTE.ATTRIBUTE_HASH]
          ) {
            //Step 4:
            return identity.addVerification(recievedAttributeIdHash);
          } else {
            assert(
              false,
              "recievedAttribute hash doesn't match with identity hash"
            );
          }
        })
        .then(function(_transactionResult) {
          assert.equal(
            checkEvent(_transactionResult, Event.SUCCESS),
            true,
            'verification not succesfully added'
          );
        });
    } else {
      assert(false, 'attribute verification process failed');
    }
  });

  it('get first verification from an attribute', function() {
    //add second verification
    var recievedAttributeIdHash = id;
    return identity
      .addVerification(recievedAttributeIdHash, {
        from: accounts[1],
      })
      .then(function() {
        return identity.getNumberOfVerifications.call(recievedAttributeIdHash);
      })
      .then(function(_numberOfVerifications) {
        assert(_numberOfVerifications > 0, 'attribute has no verifications');
        return identity.getVerification.call(recievedAttributeIdHash, 0);
      })
      .then(function(_verifications) {
        assert.equal(
          _verifications[0],
          accounts[0],
          "verification address doesn't match with account address"
        );
      });
  });

  it('accept existing verification', function() {
    //add second verification
    var recievedAttributeIdHash = id;
    var verificationIdx = 0;
    return identity
      .acceptVerification(recievedAttributeIdHash, verificationIdx)
      .then(function(_transactionResult) {
        assert.equal(
          checkEvent(_transactionResult, Event.SUCCESS),
          true,
          'verification successfully accepted'
        );
      });
  });
  it('try to accept non existing verification', function() {
    //add second verification
    var recievedAttributeIdHash = id;
    var verificationIdx = 99;
    return identity
      .acceptVerification(recievedAttributeIdHash, verificationIdx)
      .then(function(_transactionResult) {
        assert(false, 'verification should fail');
      })
      .catch(function(_err) {});
  });

  it('change permission for adding attributes', function() {
    //remove verfication from attribute
    var recievedAttributeIdHash = id;
    return identity
      .setAttributeModificationOnlyOwner(true)
      .then(function(_transactionResult) {
        assert.equal(
          checkEvent(_transactionResult, Event.SUCCESS),
          true,
          "changing permission for adding attributes didn't work"
        );
      })
      .then(function(_transactionResult) {
        var attribute = '{"age":"18"}';
        var hash = createHash(attribute);
        var idAge = createHash('age');
        var defintionUrl = 'http://jolocom.com';

        //account[1] is not the owner
        return identity.addAttribute(idAge, hash, defintionUrl, {
          from: accounts[1],
        });
      })
      .then(function(_result) {
        assert(false, 'only owner should be allowed to add attributes');
      })
      .catch(function(_err) {});
  });

  it('remove attribute from identity', function() {
    //remove verfication from attribute
    var recievedAttributeIdHash = id;

    return identity
      .removeAttribute(recievedAttributeIdHash)
      .then(function(_transactionResult) {
        assert.equal(
          checkEvent(_transactionResult, Event.SUCCESS),
          true,
          "attribute removing didn't work"
        );
      });
  });
});
