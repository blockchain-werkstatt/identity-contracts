'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

// -----------------------------------------------------------------------------
// WORKARROUND
// TODO: migrate to webpack 2 to remove workarround
// https://github.com/ConsenSys/eth-lightwallet/issues/102
// start


var _ethLightwallet = require('eth-lightwallet');

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _ethjsProviderSigner = require('ethjs-provider-signer');

var _ethjsProviderSigner2 = _interopRequireDefault(_ethjsProviderSigner);

var _walletCrypto = require('./wallet-crypto');

var _walletCrypto2 = _interopRequireDefault(_walletCrypto);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sourceCreateHash = _crypto2.default.createHash;
_crypto2.default.createHash = function createHash(alg) {
  if (alg === 'ripemd160') {
    alg = 'rmd160';
  }
  return sourceCreateHash(alg);
};
// end
// -----------------------------------------------------------------------------

var LightWallet = function () {
  function LightWallet(gethHost) {
    _classCallCheck(this, LightWallet);

    this.gethHost = gethHost;

    this.web3 = null;
    this.pin = '';

    this.walletCrypto = new _walletCrypto2.default();
    this.provider = null;

    // KEYS
    this.keystore = null;

    // ADDRESSES
    this.mainAddress = '0x';
    this.mainAddressNonce = 0;

    // TRANSACTIONS
    this.transactionHistory = [];
  }

  _createClass(LightWallet, [{
    key: '_getActualGasPrice',
    value: function _getActualGasPrice() {
      //TODO: implemented strategy for gasPrice calculation
      return 50000000000; //50gwei
    }
  }, {
    key: 'waitingToBeMined',
    value: function waitingToBeMined(transactionHash) {
      return this._waitingToBeMined(this.transactionHistory[transactionHash].contract, transactionHash);
    }
  }, {
    key: '_createInstanceLookupContract',
    value: function _createInstanceLookupContract(address) {
      this.lookupContract = this.web3.eth.contract(IdentityLookupContract.abi).at(address);
    }
  }, {
    key: '_createInstanceIdentityContract',
    value: function _createInstanceIdentityContract(address) {
      this.identityContract = this.web3.eth.contract(IdentityContract.abi).at(address);
    }
  }, {
    key: 'exportNewKeyPair',
    value: function exportNewKeyPair(pin) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.keystore.keyFromPassword(pin, function (err, pwDerivedKey) {
          if (err) {
            reject(err);
            return;
          }

          this.keystore.generateNewAddress(pwDerivedKey, 1);
          var addresses = this.keystore.getAddresses();

          var privateKey = this.keystore.exportPrivateKey(addresses[1], pwDerivedKey);
          var publicKey = this.walletCrypto.computeCompressedEthereumPublicKey(privateKey);
          resolve({
            privateKey: privateKey,
            publicKey: publicKey
          });
        }.bind(_this));
      });
    }
  }, {
    key: '_getMainAddressNonceFromNode',
    value: function _getMainAddressNonceFromNode() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        console.log('set main adddress nonce');
        _this2.web3.eth.getTransactionCount('0x' + _this2.mainAddress, function (err, mainAddressNonce) {
          resolve(mainAddressNonce);
          if (err) {
            reject(err);
          }
        });
      });
    }
  }, {
    key: 'generateRandomSeed',
    value: function generateRandomSeed(entropy) {
      return _ethLightwallet.keystore.generateRandomSeed(entropy);
    }
  }, {
    key: 'init',
    value: function init(_ref) {
      var _this4 = this;

      var seedPhrase = _ref.seedPhrase,
          pin = _ref.pin;

      console.log('LightWallet: create LightWallet');
      console.log('LightWallet: seedPhrase -> ' + seedPhrase);
      console.log('LightWallet: pin -> ' + pin);
      return new Promise(function (resolve, reject) {
        _ethLightwallet.keystore.createVault({
          password: pin,
          seedPhrase: seedPhrase
        }, function (err, ks) {
          if (err) {
            console.log('LightWallet Error: invalid Seedphrase');
            throw err;
          }
          ks.keyFromPassword(pin, function (err, pwDerivedKey) {
            var _this3 = this;

            if (err) throw err;

            ks.generateNewAddress(pwDerivedKey, 1);
            var addresses = ks.getAddresses();

            this.setMainAddress(addresses[0]);
            console.log('LightWallet: main addresses ' + this.mainAddress);

            this._setProvider(ks, this.mainAddress);

            this.getBalances('0x' + this.mainAddress).then(function (balance) {
              console.log('LightWallet: Balance ' + balance + ' ETH');
            });

            this._getMainAddressNonceFromNode().then(function (mainAddressNonce) {
              _this3.mainAddressNonce = mainAddressNonce;
              resolve(_this3.mainAddress);
            });
          }.bind(this));
        }.bind(_this4));
      });
    }
  }, {
    key: 'initFromSerialized',
    value: function initFromSerialized(serialized) {
      var data = JSON.parse(serialized);
      var ks = _ethLightwallet.keystore.deserialize(data.keystore);
      this.setMainAddress(data.mainAddress);
      this._setProvider(ks, this.mainAddress);
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return JSON.stringify({
        keystore: this.keystore.serialize(),
        mainAddress: this.mainAddress
      });
    }
  }, {
    key: 'createContractInstance',
    value: function createContractInstance(_ref2) {
      var address = _ref2.address,
          abi = _ref2.abi;

      return this.web3.eth.contract(abi).at(address);
    }
  }, {
    key: 'toHex',
    value: function toHex(data) {
      return this.web3.toHex(data);
    }
  }, {
    key: 'toAscii',
    value: function toAscii(hex) {
      return this.web3.toAscii(hex);
    }
  }, {
    key: 'fromWei',
    value: function fromWei(wei) {
      return this.web3.fromWei(wei);
    }
  }, {
    key: 'sendEther',
    value: function sendEther(_ref3) {
      var _this5 = this;

      var receiver = _ref3.receiver,
          amountEther = _ref3.amountEther,
          data = _ref3.data,
          pin = _ref3.pin;

      return this._withPin(pin, function () {
        return new Promise(function (resolve, reject) {
          if (data != null && data != '0x') {
            console.log(data);
            data = _this5.toHex(data);
            console.log(data);
          } else {
            data = '0x';
          }

          var amountInWei = _this5.web3.toWei(amountEther, 'ether');
          var nonce = _this5._nextNonceMainAddress();
          console.log('used nonce for transaction: ' + nonce);
          _this5.web3.eth.sendTransaction({
            from: _this5.mainAddress,
            to: receiver,
            value: amountInWei,
            gas: 3000000,
            data: data,
            gasPrice: _this5._getActualGasPrice(),
            nonce: _this5.web3.toHex(nonce)
          }, function (err, result) {
            if (!err) {
              resolve(result);
            } else {
              throw err;
            }
          });
        });
      });
    }
  }, {
    key: '_withPin',
    value: function _withPin(pin, functionWhichNeedsPin) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        _this6.pin = pin;
        functionWhichNeedsPin().then(function (result) {
          _this6.pin = null;
          resolve(result);
        }).catch(function (err) {
          _this6.pin = null;
          reject(err);
        });
      });
    }
  }, {
    key: '_getPin',
    value: function _getPin() {
      return this.pin;
    }
  }, {
    key: '_setProvider',
    value: function _setProvider(ks, mainAddress) {
      var _this7 = this;

      this.keystore = ks;
      this.keystore.passwordProvider = function (callback) {
        var pin = this._getPin();
        console.log('LightWallet: Entered Pin:' + pin);
        callback(null, pin);
      }.bind(this);

      var provider = new _ethjsProviderSigner2.default(this.gethHost, {
        signTransaction: function signTransaction(rawTx, cb) {
          _this7.keystore.signTransaction(rawTx, cb);
          console.log('LightWallet: signs a raw transaction');
        },

        accounts: function accounts(cb) {
          return cb(null, [mainAddress]);
        }
      });

      this.provider = provider;
      this.web3 = new _web2.default(this.provider);
    }
  }, {
    key: 'getBalances',
    value: function getBalances(address) {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        _this8.web3.eth.getBalance(address, function (err, result) {
          if (err) {
            throw err;
          }

          var amountOfEther = _this8.web3.fromWei(result, 'ether').toString(10);
          console.log('LightWallet: Balance Address:' + address + ' ' + amountOfEther + ' ETH');
          resolve(amountOfEther);
        });
      });
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
    key: '_calculateEstimatedGas',
    value: function _calculateEstimatedGas(_data, callback) {
      this.web3.eth.estimateGas({
        data: _data
      }, function (err, estimatedGas) {
        callback(err, estimatedGas);
      });
    }
  }, {
    key: 'waitingToBeMinedFilter',
    value: function waitingToBeMinedFilter(addressToWatch, transactionHash) {
      var _this9 = this;

      return new Promise(function (resolve, reject) {
        console.log('AddressToWatch');
        console.log(addressToWatch);

        var filter = _this9.web3.eth.filter({
          address: [addressToWatch],
          fromBlock: 0,
          toBlock: 'latest'
        });
        /*this.web3.eth.filter('latest').watch(function(error, result) {
          console.log(result);
        });*/
        filter.watch(function (error, result) {
          console.log('Filter');
          console.log(result);
          console.log(error);
          if (result.transactionHash === transactionHash) {
            filter.stopWatching();
            resolve(result);
          }
        });
      });
    }
  }, {
    key: 'getTransaction',
    value: function getTransaction(transactionHash) {
      var _this10 = this;

      return new Promise(function (resolve, reject) {
        _this10.web3.eth.getTransaction(transactionHash, function (error, result) {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        });
      });
    }
  }, {
    key: '_waitingForTransactionToBeMined',
    value: function _waitingForTransactionToBeMined(transactionHash, maxWaitingTime, resolve, reject) {
      var interval = 500;
      setTimeout(function () {
        this.web3.eth.getTransaction(transactionHash, function (error, result) {
          if (result.blockNumber == null) {
            if (maxWaitingTime > 0) {
              this._waitingForTransactionToBeMined(transactionHash, maxWaitingTime - interval, resolve, reject);
            } else {
              reject('maximal waiting time reached');
            }
          } else {
            resolve(result);
          }
        }.bind(this));
      }.bind(this), interval);
    }
  }, {
    key: 'waitingForTransactionToBeMined',
    value: function waitingForTransactionToBeMined(_ref4) {
      var _this11 = this;

      var transactionHash = _ref4.transactionHash,
          maxWaitingTime = _ref4.maxWaitingTime;

      //TODO: refectoring with eth.filters
      return new Promise(function (resolve, reject) {
        _this11._waitingForTransactionToBeMined(transactionHash, maxWaitingTime, resolve, reject);
      });
    }
  }, {
    key: 'waitingForEvent',
    value: function waitingForEvent(transactionHash) {
      var _this12 = this;

      /* every transaction in the identity contract uses events
       a event notification means the transaction has been executed/mined
      */
      return new Promise(function (resolve, reject) {
        var contract = _this12.transactionHistory[transactionHash].contract;
        var myEvent = contract.EventNotification();
        myEvent.watch(function (error, result) {
          if (error) {
            throw error;
          }
          if (result.transactionHash === transactionHash) {
            myEvent.stopWatching();
            console.log('LightWallet: Event recieved!');
            resolve(result);
          }
        });
      });
    }
  }, {
    key: 'contractMethodTransaction',
    value: function contractMethodTransaction(_contract, _methodName, _args, _pin) {
      var _this13 = this;

      return this._withPin(_pin, function () {
        return new Promise(function (resolve, reject) {
          var gas = 3141592; // gas maximum
          var nonce = _this13._nextNonceMainAddress();
          console.log('used nonce for transaction: ' + nonce);
          _args.push({
            from: _this13.mainAddress,
            value: 0,
            gasPrice: _this13._getActualGasPrice(),
            gas: gas,
            nonce: _this13.web3.toHex(nonce)
          });
          _args.push(function (err, txhash) {
            if (!err) {
              this._addToTransactionHistory(txhash, _contract);
            }
            resolve(txhash);
          }.bind(_this13));
          _contract[_methodName].apply(_this13, _args);
        });
      });
    }
  }, {
    key: '_addToTransactionHistory',
    value: function _addToTransactionHistory(transactionHash, contract, status) {
      console.log('LightWallet: Transaction-> ' + transactionHash + ' added to history');
      this.transactionHistory[transactionHash] = { contract: contract };
    }
  }, {
    key: 'createContract',
    value: function createContract(_ref5) {
      var _this14 = this;

      var contractInfo = _ref5.contractInfo,
          pin = _ref5.pin;

      console.log('create contract');
      return this._withPin(pin, function () {
        return _this14._createContract(contractInfo);
      });
    }
  }, {
    key: '_getActualNonceMainAddress',
    value: function _getActualNonceMainAddress() {
      return this.mainAddressNonce;
    }
  }, {
    key: '_increaseNonceMainAddress',
    value: function _increaseNonceMainAddress() {
      this.mainAddressNonce += 1;
    }
  }, {
    key: '_nextNonceMainAddress',
    value: function _nextNonceMainAddress() {
      var nextNonce = this._getActualNonceMainAddress();
      this._increaseNonceMainAddress(); //pepare nonce for next transactionHash
      return nextNonce;
    }
  }, {
    key: '_createContract',
    value: function _createContract(contractInfo) {
      var _this15 = this;

      return new Promise(function (resolve, reject) {
        console.log('LightWallet: start  contract');
        var identityContract = _this15.web3.eth.contract(contractInfo.abi);
        var address = '0x' + _this15.mainAddress;
        _this15._calculateEstimatedGas(contractInfo.unlinked_binary, function (_err, _estimatedGas) {
          console.log('LightWallet: estimated gas for  contract deployment ' + _estimatedGas);
          var nonce = this._nextNonceMainAddress();
          console.log('used nonce for transaction: ' + nonce);
          identityContract.new({
            from: address,
            data: contractInfo.unlinked_binary,
            gasPrice: this._getActualGasPrice(),
            // gas: _estimatedGas + 10000
            gas: 3141592, // maximum gas
            nonce: this.web3.toHex(nonce)
          }, function (e, contract) {
            if (!e) {
              if (!contract.address) {
                console.log('LightWallet: Contract transaction send: TransactionHash:' + contract.transactionHash + ' waiting to be mined...');
              } else {
                console.log('LightWallet: Identity Contract created');
                console.log('LightWallet: Contract mined! Address: ' + contract.address);
                resolve(contract.address);
              }
            } else {
              reject(e);
            }
          });
        }.bind(_this15));
      });
    }
  }]);

  return LightWallet;
}();

exports.default = LightWallet;