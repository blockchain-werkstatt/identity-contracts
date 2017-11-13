'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sha = require('crypto-js/sha256');

var _sha2 = _interopRequireDefault(_sha);

var _keypair = require('keypair');

var _keypair2 = _interopRequireDefault(_keypair);

var _bitcoreLib = require('bitcore-lib');

var _bitcoreLib2 = _interopRequireDefault(_bitcoreLib);

var _bitcoreEcies = require('bitcore-ecies');

var _bitcoreEcies2 = _interopRequireDefault(_bitcoreEcies);

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EC = require('elliptic').ec;

var ec = new EC('secp256k1');

var WalletCrypto = function () {
  function WalletCrypto() {
    _classCallCheck(this, WalletCrypto);
  }

  _createClass(WalletCrypto, [{
    key: 'sha256',
    value: function sha256(message) {
      return (0, _sha2.default)(message);
    }
  }, {
    key: 'sha3',
    value: function sha3(message) {
      return '0x' + new _web2.default().sha3(message);
    }
  }, {
    key: 'serializeStringMap',
    value: function serializeStringMap(obj) {
      var keys = Object.keys(obj).sort();
      var pairs = [];
      keys.forEach(function (key) {
        var val = obj[key];
        if (typeof val !== 'string') {
          throw new Error('Key "' + key + '" is not a string value');
        }

        pairs.push([key, val]);
      });
      return JSON.stringify(pairs);
    }
  }, {
    key: 'serializeData',
    value: function serializeData(stringOrMap) {
      var serialized = void 0;
      console.log(stringOrMap);
      if ((typeof stringOrMap === 'undefined' ? 'undefined' : _typeof(stringOrMap)) === 'object') {
        serialized = this.serializeStringMap(stringOrMap);
      } else if (typeof stringOrMap === 'string') {
        serialized = stringOrMap;
      } else {
        throw Error('Expected stringOrMap to either string or object containing only strings');
      }

      return serialized;
    }
  }, {
    key: 'calculateDataHash',
    value: function calculateDataHash(stringOrMap) {
      var serialized = this.serializeData(stringOrMap);
      var hash = this.sha3(serialized);
      var algorithm = 'sha3',
          iterations = 1,
          seperator = ':';
      var dataHash = algorithm + seperator + iterations + seperator + hash;
      return dataHash;
    }
  }, {
    key: 'generatePrivateRSAKey',
    value: function generatePrivateRSAKey() {
      var pair = new _keypair2.default({ bits: 2048 });
      var privateKey = pair.private.substring(32);
      privateKey = privateKey.substring(0, privateKey.length - 31);
      return privateKey;
    }
  }, {
    key: 'computeCompressedEthereumPublicKey',
    value: function computeCompressedEthereumPublicKey(privKey) {
      var keyPair = ec.genKeyPair();
      keyPair._importPrivate(privKey, 'hex');
      var compact = true;
      var pubKey = keyPair.getPublic(compact, 'hex');
      return pubKey;
    }
  }, {
    key: 'encryptMessage',
    value: function encryptMessage(publicKey, message) {
      // dummy privateKey needed to init ECIES
      var privKey = new _bitcoreLib2.default.PrivateKey('91e9ed756fbad763a24d3263d86d47881d5cae53c7bd27deb7de6c1793821038');
      var ecies = (0, _bitcoreEcies2.default)().privateKey(privKey).publicKey(new _bitcoreLib2.default.PublicKey(publicKey));
      var encrypted = ecies.encrypt(message);
      return encrypted.toString('hex');
    }
  }, {
    key: 'decryptMessage',
    value: function decryptMessage(privateKey, encrypted) {
      var privKey = new _bitcoreLib2.default.PrivateKey(privateKey);
      var ecies = (0, _bitcoreEcies2.default)().privateKey(privKey);
      var decryptBuffer = new Buffer(encrypted, 'hex');
      var decrypted = ecies.decrypt(decryptBuffer);
      return decrypted.toString('ascii');
    }
  }]);

  return WalletCrypto;
}();

exports.default = WalletCrypto;