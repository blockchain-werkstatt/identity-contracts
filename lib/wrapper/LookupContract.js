'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _IdentityLookup = require('../../build/contracts/IdentityLookup.json');

var _IdentityLookup2 = _interopRequireDefault(_IdentityLookup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LookupContract = function () {
  function LookupContract(lookupContractAddress, lightwallet, walletCrypto) {
    _classCallCheck(this, LookupContract);

    this.lookupAddress = lookupContractAddress;

    this.walletCrypto = walletCrypto;
    //LightWallet
    this.lightWallet = lightwallet;

    // SMART CONTRACTS
    this.lookupContractInstance = this.lightWallet.createContractInstance({
      address: lookupContractAddress,
      abi: _IdentityLookup2.default.abi
    });
  }

  _createClass(LookupContract, [{
    key: 'createInstanceLookupContract',
    value: function createInstanceLookupContract(address) {
      this.lookupContractInstance = this.lightWallet.createContractInstance({
        address: address,
        abi: _IdentityLookup2.default.abi
      });
    }
  }, {
    key: 'setLookupAddress',
    value: function setLookupAddress(lookupContractAddress) {
      this.lookupAddress = lookupContractAddress;
      // create instance of the identity smart contract
      this.createInstanceLookupContract(lookupContractAddress);
    }
  }, {
    key: 'getLookupAddress',
    value: function getLookupAddress() {
      return this.lookupAddress;
    }
  }, {
    key: 'createLookupContract',
    value: function createLookupContract(pin) {
      return this.lightWallet.createContract({
        contractInfo: _IdentityLookup2.default,
        pin: pin
      });
    }
  }, {
    key: 'getIdentityAddressFromLookupContract',
    value: function getIdentityAddressFromLookupContract(address) {
      var _this = this;

      if (address.search('0x') == -1) {
        address = '0x' + address;
      }
      console.log('LookupContract Address: ' + this.lookupAddress);
      console.log('ownerAddress: ' + address);
      return new Promise(function (resolve, reject) {
        _this.lookupContractInstance.getIdentityAddress(address, function (err, result) {
          if (err) {
            reject(err);
          }
          console.log('LookupContract: idenityAddress: ' + result);
          resolve(result);
        });
      });
    }
  }, {
    key: 'addIdentityAddressToLookupContract',
    value: function addIdentityAddressToLookupContract(_ref) {
      var identityAddress = _ref.identityAddress,
          pin = _ref.pin;

      console.log('LookupContract: add identity address to Lookup Contract -> ' + this.lookupAddress);

      console.log('LookupContract: identity address: ' + identityAddress);

      var methodName = 'addIdentityAddress';

      var args = [];
      args.push(identityAddress);

      return this.lightWallet.contractMethodTransaction(this.lookupContractInstance, methodName, args, pin).then(function (transactionHash) {
        return transactionHash;
      });
    }
  }, {
    key: 'addIdentityAddressToLookupForOtherEntity',
    value: function addIdentityAddressToLookupForOtherEntity(_ref2) {
      var ownerMainAddress = _ref2.ownerMainAddress,
          identityAddress = _ref2.identityAddress,
          pin = _ref2.pin;

      console.log('LookupContract ' + this.lookupAddress + ': add for owner: ' + ownerMainAddress + ' identityAddress:' + identityAddress);

      var methodName = 'addIdentityAddressForOtherEntity';

      var args = [];
      args.push(ownerMainAddress);
      args.push(identityAddress);

      return this.lightWallet.contractMethodTransaction(this.lookupContractInstance, methodName, args, pin).then(function (transactionHash) {
        return transactionHash;
      });
    }
  }]);

  return LookupContract;
}();

exports.default = LookupContract;