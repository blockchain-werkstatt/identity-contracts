'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _superagent = require('superagent');

var superagent = _interopRequireWildcard(_superagent);

var _ethLightwallet = require('eth-lightwallet');

var _wallet = require('./wallet');

var _wallet2 = _interopRequireDefault(_wallet);

var _seedStorage = require('./seed-storage');

var _seedStorage2 = _interopRequireDefault(_seedStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WalletManager = function () {
  function WalletManager(config) {
    _classCallCheck(this, WalletManager);

    this._config = config;

    var seedStorageConfig = config.seedStorage;
    if (seedStorageConfig) {
      var SeedStorageClass = seedStorageConfig.storageClass || _seedStorage2.default;
      this._seedStorage = new SeedStorageClass(seedStorageConfig);
    }
    this.jolocomEtherAddress = config.jolocomEtherAddress;

    this._logger = config.logger || (config.debug ? console.log.bind(console) : function () {});
  }

  _createClass(WalletManager, [{
    key: 'generateSeedPhrase',
    value: function generateSeedPhrase(entropy) {
      var seed = _ethLightwallet.keystore.generateRandomSeed(entropy);
      return seed;
    }
  }, {
    key: 'initWalletAndGenerateWebIDKey',
    value: function initWalletAndGenerateWebIDKey(_ref) {
      var userName = _ref.userName,
          seedPhrase = _ref.seedPhrase,
          pin = _ref.pin;

      var wallet = new _wallet2.default(this._config);
      return new Promise(function (resolve, reject) {
        wallet.init({ seedPhrase: seedPhrase, pin: pin }).then(function (mainAddress) {
          var webIdKey = wallet.generatePrivateKeyForWebID();
          var encryptedWebIdKey = wallet.encryptPrivateKeyForWebID(webIdKey);
          wallet.setWebIDPrivateKey(webIdKey);
          wallet.setWebId('https://' + userName + '.webid.jolocom.de/profile/card#me');
          resolve({ encryptedWebIdKey: encryptedWebIdKey, wallet: wallet });
        });
      });
    }
  }, {
    key: 'registerWithSeedPhrase',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(_ref3) {
        var userName = _ref3.userName,
            seedPhrase = _ref3.seedPhrase,
            pin = _ref3.pin;

        var _ref4, encryptedWebIdKey, wallet, result;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this._logger('WalletAgent: See Transactions at: https://ropsten.etherscan.io/');

                _context.next = 3;
                return this.initWalletAndGenerateWebIDKey({
                  userName: userName,
                  seedPhrase: seedPhrase,
                  pin: pin
                });

              case 3:
                _ref4 = _context.sent;
                encryptedWebIdKey = _ref4.encryptedWebIdKey;
                wallet = _ref4.wallet;
                _context.next = 8;
                return superagent.post(this.jolocomEtherAddress + '/identity/create').type('form').send({
                  walletAddress: wallet.mainAddress,
                  userName: userName,
                  encryptedWebIdPrivateKey: encryptedWebIdKey
                });

              case 8:
                result = _context.sent;


                wallet.setIdentityAddress(result.body.identityAddress);
                return _context.abrupt('return', wallet);

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function registerWithSeedPhrase(_x) {
        return _ref2.apply(this, arguments);
      }

      return registerWithSeedPhrase;
    }()
  }, {
    key: 'registerWithSeedPhraseFromOwnAccount',
    value: function registerWithSeedPhraseFromOwnAccount(_ref5) {
      var _this = this;

      var userName = _ref5.userName,
          seedPhrase = _ref5.seedPhrase,
          pin = _ref5.pin;

      /*
      complete register process will be payed from own account
      mainAddress need to have ether in in advance
      */
      this._logger(seedPhrase);
      var wallet = new _wallet2.default(this._config);
      return new Promise(function (resolve, reject) {
        wallet.init({ seedPhrase: seedPhrase, pin: pin }).then(function (result) {
          return wallet.createDigitalIdentity({
            userName: userName,
            pin: pin
          });
        }).then(function (identityAddress) {
          wallet.setIdentityAddress(identityAddress);
          return wallet.addIdentityAddressToLookupContract({
            identityAddress: identityAddress,
            pin: pin
          });
        }).then(function (transactionHash) {
          _this._logger('WalletAgent: identityAddress addedtoLookupContract Transaction ' + 'waiting to be mined txhash -> ' + transactionHash);

          return wallet.waitingToBeMined(transactionHash);
        }).then(function (transaction) {
          _this._logger('WalletAgent: Transaction add address to lookup contracted got' + ' mined -> ' + transaction.transactionHash);
          var privateKeyWebID = wallet.generatePrivateKeyForWebID();
          wallet.setWebIDPrivateKey(privateKeyWebID);
          _this._logger('WalletAgent: privatekey WebID');
          _this._logger(privateKeyWebID);
          var encryptedWebID = wallet.encryptPrivateKeyForWebID(privateKeyWebID);
          _this._logger('WalletAgent: privatekey WebID encrypted');
          _this._logger(encryptedWebID);
          return wallet.addProperty({
            id: 'webidkey',
            value: encryptedWebID,
            pin: pin
          });
        }).then(function (txhash) {
          _this._logger('WalletAgent: addPropertyTransaction waiting to be mined txhash: ' + txhash);
          return wallet.waitingToBeMined(txhash);
        }).then(function (transaction) {
          _this._logger('WalletAgent: addPropertyTransaction got minded txhash: ' + transaction.transactionHash);
          resolve(wallet);
        });
      });
    }
  }, {
    key: 'registerWithCredentials',
    value: function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref7) {
        var userName = _ref7.userName,
            email = _ref7.email,
            password = _ref7.password,
            pin = _ref7.pin;
        var seedPhrase;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                seedPhrase = this.generateSeedPhrase();
                _context2.next = 3;
                return this._seedStorage.storeSeed({ email: email, password: password, seed: seed });

              case 3:
                _context2.next = 5;
                return this.registerWithSeedPhrase({
                  userName: userName,
                  seedPhrase: seedPhrase,
                  pin: pin
                });

              case 5:
                return _context2.abrupt('return', _context2.sent);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function registerWithCredentials(_x2) {
        return _ref6.apply(this, arguments);
      }

      return registerWithCredentials;
    }()
  }, {
    key: 'loginWithSeedPhrase',
    value: function loginWithSeedPhrase(_ref8) {
      var _this2 = this;

      var seedPhrase = _ref8.seedPhrase,
          pin = _ref8.pin;

      this._logger('WalletAgent: Login with Seedphrase');
      this._logger(seedPhrase);
      var wallet = new _wallet2.default(this._config);
      return new Promise(function (resolve, reject) {
        wallet.init({ seedPhrase: seedPhrase, pin: pin }).then(function (result) {
          return wallet.getIdentityAddressFromLookupContract();
        }).then(function (identityAddress) {
          _this2._logger('WalletAgent: got identity Address from Lookup Table');
          _this2._logger(identityAddress);
          wallet.setIdentityAddress(identityAddress);
          return wallet.getProperty('webid');
        }).then(function (webid) {
          wallet.setWebId(webid);
          return wallet.getProperty('webidkey');
        }).then(function (webIdEncrypted) {
          _this2._logger('WalletAgent: private key of the webId');
          wallet.setWebIDPrivateKey(wallet.decryptPrivateKeyForWebID(webIdEncrypted));
          _this2._logger(wallet.getWebIDPrivateKey());
          resolve(wallet);
        });
      });
    }
  }, {
    key: 'loginWithCredentials',
    value: function () {
      var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(_ref10) {
        var email = _ref10.email,
            password = _ref10.password,
            pin = _ref10.pin;
        var seedPhrase;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._seedStorage.getSeed({ email: email, password: password });

              case 2:
                seedPhrase = _context3.sent;
                _context3.next = 5;
                return this.loginWithSeedPhrase({ seedPhrase: seedPhrase, pin: pin });

              case 5:
                return _context3.abrupt('return', _context3.sent);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function loginWithCredentials(_x3) {
        return _ref9.apply(this, arguments);
      }

      return loginWithCredentials;
    }()
  }, {
    key: 'loginFromSerialized',
    value: function loginFromSerialized(serialized) {
      var wallet = new _wallet2.default(this._config);
      wallet.initFromSerialized(serialized);
      return wallet;
    }
  }]);

  return WalletManager;
}();

exports.default = WalletManager;