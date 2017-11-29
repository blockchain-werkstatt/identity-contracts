'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Identity = require('../../build/contracts/Identity.json');

var _Identity2 = _interopRequireDefault(_Identity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ATTRIBUTE = {
  CREATOR: 0,
  ATTRIBUTE_HASH: 1,
  DEFINITION_URL: 2,
  AMOUNT_VERIFICATIONS: 3
};

var IdentityContract = function () {
  function IdentityContract(lightWallet, walletCrypto) {
    _classCallCheck(this, IdentityContract);

    //LightWallet
    this.lightWallet = lightWallet;

    // ADDRESSES
    this.identityAddress = '0x';

    this.walletCrypto = walletCrypto;

    // SMART CONTRACTS
    this.identityContractInstance = undefined;
  }

  _createClass(IdentityContract, [{
    key: 'createInstanceIdentityContract',
    value: function createInstanceIdentityContract(address) {
      this.identityContractInstance = this.lightWallet.createContractInstance({
        address: address,
        abi: _Identity2.default.abi
      });
    }
  }, {
    key: 'setIdentityAddress',
    value: function setIdentityAddress(identityAddress) {
      this.identityAddress = identityAddress;
      // create instance of the identity smart contract
      this.createInstanceIdentityContract(this.identityAddress);
    }
  }, {
    key: 'addVerificationToTargetIdentity',
    value: function addVerificationToTargetIdentity(_ref) {
      var targetIdentityAddress = _ref.targetIdentityAddress,
          attributeId = _ref.attributeId,
          pin = _ref.pin;

      var idHash = this._createAttributeID(attributeId);

      var methodName = 'addVerificationToTargetIdentity';
      var args = [];

      args.push(targetIdentityAddress);
      args.push(idHash);

      return this.lightWallet.contractMethodTransaction(this.identityContractInstance, methodName, args, pin);
    }
  }, {
    key: 'getIdentityAddress',
    value: function getIdentityAddress() {
      return this.identityAddress;
    }
  }, {
    key: 'addAttributeHashToTargetIdentity',
    value: function addAttributeHashToTargetIdentity(_ref2) {
      var attributeId = _ref2.attributeId,
          attribute = _ref2.attribute,
          definitionUrl = _ref2.definitionUrl,
          pin = _ref2.pin,
          targetIdentityAddress = _ref2.targetIdentityAddress;

      var attributeHash = this.walletCrypto.calculateDataHash(attribute);
      var idHash = this._createAttributeID(attributeId);

      var methodName = 'addAttributeToTargetIdentity';
      var args = [];

      args.push(targetIdentityAddress);
      args.push(idHash);
      args.push(attributeHash);
      args.push(definitionUrl);
      return this.lightWallet.contractMethodTransaction(this.identityContractInstance, methodName, args, pin);
    }
  }, {
    key: 'addAttributeHashToIdentity',
    value: function addAttributeHashToIdentity(_ref3) {
      var attributeId = _ref3.attributeId,
          attribute = _ref3.attribute,
          definitionUrl = _ref3.definitionUrl,
          pin = _ref3.pin,
          identityAddress = _ref3.identityAddress;

      var attributeHash = this.walletCrypto.calculateDataHash(attribute);
      var idHash = this._createAttributeID(attributeId);

      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });

      console.log('IdentityAddress: ' + identityAddress);

      console.log('SmartWallet: AttributeHash->' + attributeHash);

      var methodName = 'addAttribute';
      var args = [];

      args.push(idHash);
      args.push(attributeHash);
      args.push(definitionUrl);
      return this.lightWallet.contractMethodTransaction(identityContract, methodName, args, pin);
    }
  }, {
    key: 'addAttributeHashAndWait',
    value: function addAttributeHashAndWait(params) {
      var _this = this;

      params.identityAddress = this.getIdentityAddress();
      return this.addAttributeHashToIdentity(params).then(function (transactionHash) {
        console.log('WalletAgent: addAttributeHash waiting to be minded ->' + transactionHash);
        return _this.lightWallet.waitingForEvent(transactionHash);
      });
    }
  }, {
    key: 'addAttributeHashToTargetIdentityAndWait',
    value: function addAttributeHashToTargetIdentityAndWait(params) {
      var _this2 = this;

      return this.addAttributeHashToTargetIdentity(params).then(function (transactionHash) {
        console.log('WalletAgent: addAttributeHash waiting to be minded ->' + transactionHash);
        return _this2.lightWallet.waitingForEvent(transactionHash);
      });
    }
  }, {
    key: 'getAttributeHash',
    value: function getAttributeHash(_ref4) {
      var attributeId = _ref4.attributeId,
          identityAddress = _ref4.identityAddress;

      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });

      var idHash = this._createAttributeID(attributeId);
      return new Promise(function (resolve, reject) {
        identityContract.attributes(idHash, function (err, attribute) {
          if (err) {
            throw err;
          }
          console.log('SmartWallet: get Attribute Hash Call');
          resolve(attribute[ATTRIBUTE.ATTRIBUTE_HASH]);
        });
      });
    }
  }, {
    key: 'getVerification',
    value: function getVerification(_ref5) {
      var attributeId = _ref5.attributeId,
          verificationIdx = _ref5.verificationIdx,
          identityAddress = _ref5.identityAddress;

      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });
      var idHash = this._createAttributeID(attributeId);
      return new Promise(function (resolve, reject) {
        identityContract.getVerification(idHash, verificationIdx, function (err, result) {
          if (err) {
            throw err;
          }
          console.log('SmartWallet: get Verification call ');
          resolve(result);
        });
      });
    }
  }, {
    key: 'getAttributeHashCreator',
    value: function getAttributeHashCreator(_ref6) {
      var attributeId = _ref6.attributeId,
          identityAddress = _ref6.identityAddress;

      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });
      var idHash = this._createAttributeID(attributeId);
      return new Promise(function (resolve, reject) {
        identityContract.attributes(idHash, function (err, attribute) {
          if (err) {
            throw err;
          }
          console.log('SmartWallet: get Attribute Hash Creator');
          resolve(attribute[ATTRIBUTE.CREATOR]);
        });
      });
    }
  }, {
    key: 'getNumberOfVerifications',
    value: function getNumberOfVerifications(_ref7) {
      var attributeId = _ref7.attributeId,
          identityAddress = _ref7.identityAddress;

      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });

      var idHash = this._createAttributeID(attributeId);
      return new Promise(function (resolve, reject) {
        identityContract.getNumberOfVerifications(idHash, function (err, result) {
          if (err) {
            throw err;
          }
          console.log('SmartWallet: get Attribute Hash Call');
          resolve(result);
        });
      });
    }
  }, {
    key: '_createAttributeID',
    value: function _createAttributeID(attributeName) {
      return '0x' + this.walletCrypto.sha256(attributeName).toString();
    }
  }, {
    key: 'createDigitalIdentity',
    value: function createDigitalIdentity(_ref8) {
      var pin = _ref8.pin;

      return this.lightWallet.createContract({
        contractInfo: _Identity2.default,
        pin: pin
      });
    }
  }, {
    key: 'getProperty',
    value: function getProperty(propertyId) {
      var _this3 = this;

      var id = this._createAttributeID(propertyId);

      return new Promise(function (resolve, reject) {
        _this3.identityContractInstance.properties(id, function (err, result) {
          if (err) {
            throw err;
          }
          console.log('SmartWallet: getProperty Call');
          resolve(result);
        });
      });
    }
  }, {
    key: 'killIdentityContract',
    value: function killIdentityContract(_ref9) {
      var identityContractAddress = _ref9.identityContractAddress,
          pin = _ref9.pin;

      console.log('LightWallet: kill Contract ' + identityContractAddress);

      var methodName = 'kill';
      var args = [];

      var identityContract = this.lightWallet.createContractInstance({
        address: identityContractAddress,
        abi: _Identity2.default.abi
      });

      return this.lightWallet.contractMethodTransaction(identityContract, methodName, args, pin);
    }
  }, {
    key: 'addProperty',
    value: function addProperty(_ref10) {
      var id = _ref10.id,
          value = _ref10.value,
          pin = _ref10.pin;

      console.log('SmartWallet start to add a property to identity contract ' + this.identityAddress);
      var methodName = 'addProperty';
      var args = [];
      args.push(this._createAttributeID(id));
      args.push(value);
      return this.lightWallet.contractMethodTransaction(this.identityContractInstance, methodName, args, pin);
    }
  }, {
    key: 'addPropertyToTarget',
    value: function addPropertyToTarget(_ref11) {
      var identityAddress = _ref11.identityAddress,
          id = _ref11.id,
          value = _ref11.value,
          pin = _ref11.pin;

      console.log('SmartWallet start to add a property to target identity contract ' + identityAddress);
      console.log(identityAddress);
      var methodName = 'addProperty';
      var args = [];
      args.push(this._createAttributeID(id));
      args.push(value);
      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });

      return this.lightWallet.contractMethodTransaction(identityContract, methodName, args, pin);
    }
  }, {
    key: 'changeIdentityOwner',
    value: function changeIdentityOwner(_ref12) {
      var identityAddress = _ref12.identityAddress,
          newMainAddress = _ref12.newMainAddress,
          pin = _ref12.pin;

      var methodName = 'changeOwner';
      var args = [];
      console.log('SmartWallet:  changeIdentityOwner ' + identityAddress + ' to ' + newMainAddress);
      args.push(newMainAddress);
      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });
      return this.lightWallet.contractMethodTransaction(identityContract, methodName, args, pin);
    }
  }, {
    key: 'getIdentityOwner',
    value: function getIdentityOwner(identityAddress) {
      console.log('SmartWallet: get owner call' + identityAddress);
      var identityContract = this.lightWallet.createContractInstance({
        address: identityAddress,
        abi: _Identity2.default.abi
      });

      return new Promise(function (resolve, reject) {
        identityContract.owner(function (err, result) {
          if (err) {
            throw err;
          }
          console.log('SmartWallet: getProperty Call');
          resolve(result);
        });
      });
    }
  }]);

  return IdentityContract;
}();

exports.default = IdentityContract;