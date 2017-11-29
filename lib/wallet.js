'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _walletCrypto = require('./wallet-crypto');

var _walletCrypto2 = _interopRequireDefault(_walletCrypto);

var _lightWallet = require('./light-wallet.js');

var _lightWallet2 = _interopRequireDefault(_lightWallet);

var _IdentityContract = require('./wrapper/IdentityContract');

var _IdentityContract2 = _interopRequireDefault(_IdentityContract);

var _LookupContract = require('./wrapper/LookupContract');

var _LookupContract2 = _interopRequireDefault(_LookupContract);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ATTRIBUTE = {
  CREATOR: 0,
  ATTRIBUTE_HASH: 1,
  DEFINITION_URL: 2,
  AMOUNT_VERIFICATIONS: 3
};

var SmartWallet = function () {
  function SmartWallet(config) {
    _classCallCheck(this, SmartWallet);

    this.gethHost = config.gethHost;
    this.lookupContractAddress = config.lookupContractAddress;

    this.walletCrypto = new _walletCrypto2.default();

    //LightWallet
    this.lightWallet = null;

    // KEYS
    this.webIDPrivateKey = undefined;
    this.encryptionKeys = {};
    this.webId = null;

    // ADDRESSES
    this.identityAddress = '0x';
    this.mainAddress = '0x';

    // SMART CONTRACTS
    this.identityContract = undefined;
    this.lookupContract = undefined;
  }

  _createClass(SmartWallet, [{
    key: 'init',
    value: function init(_ref) {
      var _this = this;

      var seedPhrase = _ref.seedPhrase,
          pin = _ref.pin;

      this.lightWallet = new _lightWallet2.default(this.gethHost);
      return this.lightWallet.init({ seedPhrase: seedPhrase, pin: pin }).then(function (address) {
        console.log('Main Address:' + address);
        _this.setMainAddress(address);

        _this.identityContract = new _IdentityContract2.default(_this.lightWallet, _this.walletCrypto);
        _this.lookupContract = new _LookupContract2.default(_this.lookupContractAddress, _this.lightWallet, _this.walletCrypto);
        return _this.lightWallet.exportNewKeyPair(pin);
      }).then(function (newKeyPair) {
        _this.encryptionKeys = newKeyPair;
        return _this.getMainAddress();
      });
    }
  }, {
    key: 'generateRandomSeed',
    value: function generateRandomSeed(entropy) {
      var lightWallet = new _lightWallet2.default(this.gethHost);
      return lightWallet.generateRandomSeed(entropy);
    }
  }, {
    key: 'initFromSerialized',
    value: function initFromSerialized(serialzed) {
      var data = JSON.parse(serialzed);
      this.lightWallet = new _lightWallet2.default(this.gethHost);
      this.lightWallet.initFromSerialized(data.lightWallet);
      this.identityContract = new _IdentityContract2.default(this.lightWallet, this.walletCrypto);
      this.lookupContract = new _LookupContract2.default(this.lookupContractAddress, this.lightWallet, this.walletCrypto);
      this.setMainAddress(data.mainAddress);
      this.setIdentityAddress(data.identityAddress);
      this.setWebId(data.webId);
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return JSON.stringify({
        mainAddress: this.mainAddress,
        identityAddress: this.identityAddress,
        lightWallet: this.lightWallet.serialize(),
        webId: this.webId
      });
    }
  }, {
    key: 'setWebIDPrivateKey',
    value: function setWebIDPrivateKey(webIDprivateKey) {
      this.webIDPrivateKey = webIDprivateKey;
    }
  }, {
    key: 'setWebId',
    value: function setWebId(webId) {
      if (webId.indexOf('0x') === 0) {
        webId = new Buffer(webId.substr(2), 'hex').toString();
      }

      this.webId = webId;
    }
  }, {
    key: 'getWebIDPrivateKey',
    value: function getWebIDPrivateKey() {
      return this.webIDPrivateKey;
    }
  }, {
    key: 'addVerificationToTargetIdentity',
    value: function addVerificationToTargetIdentity(params) {
      return this.identityContract.addVerificationToTargetIdentity(params);
    }
  }, {
    key: 'addAttributeHashToTargetIdentity',
    value: function addAttributeHashToTargetIdentity(params) {
      return this.identityContract.addAttributeHashToTargetIdentity(params);
    }
  }, {
    key: 'addAttributeHashToIdentity',
    value: function addAttributeHashToIdentity(params) {
      return this.identityContract.addAttributeHashToIdentity(params);
    }
  }, {
    key: 'addAttributeHashAndWait',
    value: function addAttributeHashAndWait(params) {
      return this.identityContract.addAttributeHashAndWait(params);
    }
  }, {
    key: 'addAttributeHashToTargetIdentityAndWait',
    value: function addAttributeHashToTargetIdentityAndWait(params) {
      return this.identityContract.addAttributeHashToTargetIdentityAndWait(params);
    }
  }, {
    key: 'getAttributeHash',
    value: function getAttributeHash(params) {
      return this.identityContract.getAttributeHash(params);
    }
  }, {
    key: 'getVerification',
    value: function getVerification(params) {
      return this.identityContract.getVerification(params);
    }
  }, {
    key: 'getAttributeHashCreator',
    value: function getAttributeHashCreator(params) {
      return this.identityContract.getAttributeHashCreator(params);
    }
  }, {
    key: 'getNumberOfVerifications',
    value: function getNumberOfVerifications(params) {
      return this.identityContract.getNumberOfVerifications(params);
    }
  }, {
    key: 'createDigitalIdentity',
    value: function createDigitalIdentity(params) {
      return this.identityContract.createDigitalIdentity(params);
    }
  }, {
    key: 'createLookupContract',
    value: function createLookupContract(pin) {
      return this.lookupContract.createLookupContract(pin);
    }
  }, {
    key: 'getIdentityAddressFromLookupContract',
    value: function getIdentityAddressFromLookupContract(address) {
      if (address == undefined) {
        address = this.mainAddress;
      }
      return this.lookupContract.getIdentityAddressFromLookupContract(address);
    }
  }, {
    key: 'getSeed',
    value: function getSeed() {
      return this.lightWallet.getSeed();
    }
  }, {
    key: 'getEncryptionKeys',
    value: function getEncryptionKeys() {
      return this.encryptionKeys;
    }
  }, {
    key: 'setIdentityAddress',
    value: function setIdentityAddress(identityAddress) {
      this.identityAddress = identityAddress;
      // create instance of the identity smart contract
      this.identityContract.setIdentityAddress(identityAddress);
    }
  }, {
    key: 'setLookupAddress',
    value: function setLookupAddress(lookupContractAddress) {
      this.lookupContractAddress = lookupContractAddress;
      // create instance of the identity smart contract
      this.lookupContract.setLookupAddress(lookupContractAddress);
    }
  }, {
    key: 'getLookupAddress',
    value: function getLookupAddress() {
      return this.lookupContractAddress;
    }
  }, {
    key: 'getIdentityAddress',
    value: function getIdentityAddress() {
      return this.identityAddress;
    }
  }, {
    key: 'generatePrivateKeyForWebID',
    value: function generatePrivateKeyForWebID() {
      return this.walletCrypto.generatePrivateRSAKey();
    }
  }, {
    key: 'getProperty',
    value: function getProperty(propertyId) {
      return this.identityContract.getProperty(propertyId);
    }
  }, {
    key: 'killIdentityContract',
    value: function killIdentityContract(params) {
      return this.identityContract.killIdentityContract(params);
    }
  }, {
    key: 'sendEther',
    value: function sendEther(params) {
      return this.lightWallet.sendEther(params);
    }
  }, {
    key: 'addProperty',
    value: function addProperty(params) {
      return this.identityContract.addProperty(params);
    }
  }, {
    key: 'addPropertyToTarget',
    value: function addPropertyToTarget(params) {
      return this.identityContract.addPropertyToTarget(params);
    }
  }, {
    key: 'changeIdentityOwner',
    value: function changeIdentityOwner(params) {
      return this.identityContract.changeIdentityOwner(params);
    }
  }, {
    key: 'getIdentityOwner',
    value: function getIdentityOwner(params) {
      return this.identityContract.getIdentityOwner(params);
    }
  }, {
    key: 'encryptPrivateKeyForWebID',
    value: function encryptPrivateKeyForWebID(privateKeyWebID) {
      return '0x' + this.walletCrypto.encryptMessage(this.encryptionKeys.publicKey, privateKeyWebID);
    }
  }, {
    key: 'decryptPrivateKeyForWebID',
    value: function decryptPrivateKeyForWebID(privateKeyWebIDEncrypted) {
      privateKeyWebIDEncrypted = privateKeyWebIDEncrypted.replace('0x', '');
      return this.walletCrypto.decryptMessage(this.encryptionKeys.privateKey, privateKeyWebIDEncrypted);
    }
  }, {
    key: 'addIdentityAddressToLookupContract',
    value: function addIdentityAddressToLookupContract(params) {
      return this.lookupContract.addIdentityAddressToLookupContract(params);
    }
  }, {
    key: 'addIdentityAddressToLookupForOtherEntity',
    value: function addIdentityAddressToLookupForOtherEntity(params) {
      return this.lookupContract.addIdentityAddressToLookupForOtherEntity(params);
    }
  }, {
    key: 'waitingForTransactionToBeMined',
    value: function waitingForTransactionToBeMined(_ref2) {
      var _this2 = this;

      var transactionHash = _ref2.transactionHash,
          maxWaitingTime = _ref2.maxWaitingTime;

      return this.lightWallet.waitingForTransactionToBeMined({ transactionHash: transactionHash, maxWaitingTime: maxWaitingTime }).then(function (transaction) {
        return Promise.resolve({
          from: transaction.from,
          to: transaction.to,
          data: _this2.lightWallet.toAscii(transaction.input),
          value: _this2.lightWallet.fromWei(transaction.value.toString())
        });
      });
    }
  }, {
    key: 'getBalance',
    value: function getBalance() {
      return this.getBalances(this.mainAddress);
    }
  }, {
    key: 'getBalances',
    value: function getBalances(address) {
      return this.lightWallet.getBalances(address);
    }
  }, {
    key: 'setMainAddress',
    value: function setMainAddress(address) {
      this.mainAddress = address;
    }
  }, {
    key: 'getMainAddress',
    value: function getMainAddress() {
      return this.mainAddress;
    }
  }, {
    key: 'waitingToBeMinedFilter',
    value: function waitingToBeMinedFilter(addressToWatch, transactionHash) {
      return this.lightWallet.waitingToBeMinedFilter(addressToWatch, transactionHash);
    }
  }, {
    key: 'getTransaction',
    value: function getTransaction(transactionHash) {
      var _this3 = this;

      return this.lightWallet.getTransaction(transactionHash).then(function (transaction) {
        console.log('--');
        console.log(transaction.input);
        return Promise.resolve({
          from: transaction.from,
          to: transaction.to,
          data: _this3.lightWallet.toAscii(transaction.input),
          value: _this3.lightWallet.fromWei(transaction.value.toString())
        });
      });
    }
  }, {
    key: 'waitingToBeMined',
    value: function waitingToBeMined(transactionHash) {
      //TODO: change method name into waitingForEvents
      //every method in the identity contract uses events
      return this.lightWallet.waitingForEvent(transactionHash);
    }
  }]);

  return SmartWallet;
}();

exports.default = SmartWallet;