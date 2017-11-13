import SHA256 from 'crypto-js/sha256';

import Keypair from 'keypair';
import bitcore from 'bitcore-lib';
import ECIES from 'bitcore-ecies';
import Web3 from 'web3';
var EC = require('elliptic').ec;

let ec = new EC('secp256k1');

export default class WalletCrypto {
  sha256(message) {
    return SHA256(message);
  }
  sha3(message) {
    return '0x' + new Web3().sha3(message);
  }
  serializeStringMap(obj) {
    const keys = Object.keys(obj).sort();
    const pairs = [];
    keys.forEach(key => {
      const val = obj[key];
      if (typeof val !== 'string') {
        throw new Error('Key "' + key + '" is not a string value');
      }

      pairs.push([key, val]);
    });
    return JSON.stringify(pairs);
  }

  serializeData(stringOrMap) {
    let serialized;
    console.log('Serialize Data:' + stringOrMap);
    if (typeof stringOrMap === 'object') {
      serialized = this.serializeStringMap(stringOrMap);
    } else if (typeof stringOrMap === 'string') {
      serialized = stringOrMap;
    } else {
      throw Error(
        'Expected stringOrMap to either string or object containing only strings',
      );
    }

    return serialized;
  }

  calculateDataHash(stringOrMap) {
    const serialized = this.serializeData(stringOrMap);
    const hash = this.sha3(serialized);
    const algorithm = 'sha3', iterations = 1, seperator = ':';
    const dataHash = algorithm + seperator + iterations + seperator + hash;
    return dataHash;
  }

  generatePrivateRSAKey() {
    let pair = new Keypair({bits: 2048});
    let privateKey = pair.private.substring(32);
    privateKey = privateKey.substring(0, privateKey.length - 31);
    return privateKey;
  }
  computeCompressedEthereumPublicKey(privKey) {
    let keyPair = ec.genKeyPair();
    keyPair._importPrivate(privKey, 'hex');
    var compact = true;
    var pubKey = keyPair.getPublic(compact, 'hex');
    return pubKey;
  }
  encryptMessage(publicKey, message) {
    // dummy privateKey needed to init ECIES
    let privKey = new bitcore.PrivateKey(
      '91e9ed756fbad763a24d3263d86d47881d5cae53c7bd27deb7de6c1793821038',
    );
    let ecies = ECIES()
      .privateKey(privKey)
      .publicKey(new bitcore.PublicKey(publicKey));
    let encrypted = ecies.encrypt(message);
    return encrypted.toString('hex');
  }
  decryptMessage(privateKey, encrypted) {
    let privKey = new bitcore.PrivateKey(privateKey);
    let ecies = ECIES().privateKey(privKey);
    let decryptBuffer = new Buffer(encrypted, 'hex');
    let decrypted = ecies.decrypt(decryptBuffer);
    return decrypted.toString('ascii');
  }
}
