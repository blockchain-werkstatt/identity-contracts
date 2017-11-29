import WalletCrypto from './wallet-crypto';
import LightWallet from './light-wallet.js';

import IdentityContract from './wrapper/IdentityContract';
import LookupContract from './wrapper/LookupContract';

const ATTRIBUTE = {
  CREATOR: 0,
  ATTRIBUTE_HASH: 1,
  DEFINITION_URL: 2,
  AMOUNT_VERIFICATIONS: 3,
};

export default class SmartWallet {
  constructor(config) {
    this.gethHost = config.gethHost;
    this.lookupContractAddress = config.lookupContractAddress;

    this.walletCrypto = new WalletCrypto();

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

  init({seedPhrase, pin}) {
    this.lightWallet = new LightWallet(this.gethHost);
    return this.lightWallet
      .init({seedPhrase, pin})
      .then(address => {
        console.log('Main Address:' + address);
        this.setMainAddress(address);

        this.identityContract = new IdentityContract(
          this.lightWallet,
          this.walletCrypto,
        );
        this.lookupContract = new LookupContract(
          this.lookupContractAddress,
          this.lightWallet,
          this.walletCrypto,
        );
        return this.lightWallet.exportNewKeyPair(pin);
      })
      .then(newKeyPair => {
        this.encryptionKeys = newKeyPair;
        return this.getMainAddress();
      });
  }
  generateRandomSeed(entropy) {
    let lightWallet = new LightWallet(this.gethHost)
    return lightWallet.generateRandomSeed(entropy);
  }

  initFromSerialized(serialzed) {
    const data = JSON.parse(serialzed);
    this.lightWallet = new LightWallet(this.gethHost);
    this.lightWallet.initFromSerialized(data.lightWallet);
    this.identityContract = new IdentityContract(
      this.lightWallet,
      this.walletCrypto,
    );
    this.lookupContract = new LookupContract(
      this.lookupContractAddress,
      this.lightWallet,
      this.walletCrypto,
    );
    this.setMainAddress(data.mainAddress);
    this.setIdentityAddress(data.identityAddress);
    this.setWebId(data.webId);
  }

  serialize() {
    return JSON.stringify({
      mainAddress: this.mainAddress,
      identityAddress: this.identityAddress,
      lightWallet: this.lightWallet.serialize(),
      webId: this.webId,
    });
  }

  setWebIDPrivateKey(webIDprivateKey) {
    this.webIDPrivateKey = webIDprivateKey;
  }
  setWebId(webId) {
    if (webId.indexOf('0x') === 0) {
      webId = new Buffer(webId.substr(2), 'hex').toString();
    }

    this.webId = webId;
  }
  getWebIDPrivateKey() {
    return this.webIDPrivateKey;
  }
  addVerificationToTargetIdentity(params) {
    return this.identityContract.addVerificationToTargetIdentity(params);
  }

  addAttributeHashToTargetIdentity(params) {
    return this.identityContract.addAttributeHashToTargetIdentity(params);
  }

  addAttributeHashToIdentity(params) {
    return this.identityContract.addAttributeHashToIdentity(params);
  }

  addAttributeHashAndWait(params) {
    return this.identityContract.addAttributeHashAndWait(params);
  }
  addAttributeHashToTargetIdentityAndWait(params) {
    return this.identityContract.addAttributeHashToTargetIdentityAndWait(
      params,
    );
  }

  getAttributeHash(params) {
    return this.identityContract.getAttributeHash(params);
  }
  getVerification(params) {
    return this.identityContract.getVerification(params);
  }
  getAttributeHashCreator(params) {
    return this.identityContract.getAttributeHashCreator(params);
  }
  getNumberOfVerifications(params) {
    return this.identityContract.getNumberOfVerifications(params);
  }

  createDigitalIdentity(params) {
    return this.identityContract.createDigitalIdentity(params);
  }

  createLookupContract(pin) {
    return this.lookupContract.createLookupContract(pin);
  }

  getIdentityAddressFromLookupContract(address) {
    if (address == undefined) {
      address = this.mainAddress;
    }
    return this.lookupContract.getIdentityAddressFromLookupContract(address);
  }

  getSeed() {
    return this.lightWallet.getSeed();
  }
  getEncryptionKeys() {
    return this.encryptionKeys;
  }
  setIdentityAddress(identityAddress) {
    this.identityAddress = identityAddress;
    // create instance of the identity smart contract
    this.identityContract.setIdentityAddress(identityAddress);
  }
  setLookupAddress(lookupContractAddress) {
    this.lookupContractAddress = lookupContractAddress;
    // create instance of the identity smart contract
    this.lookupContract.setLookupAddress(lookupContractAddress);
  }
  getLookupAddress() {
    return this.lookupContractAddress;
  }
  getIdentityAddress() {
    return this.identityAddress;
  }
  generatePrivateKeyForWebID() {
    return this.walletCrypto.generatePrivateRSAKey();
  }

  getProperty(propertyId) {
    return this.identityContract.getProperty(propertyId);
  }

  killIdentityContract(params) {
    return this.identityContract.killIdentityContract(params);
  }

  sendEther(params) {
    return this.lightWallet.sendEther(params);
  }

  addProperty(params) {
    return this.identityContract.addProperty(params);
  }
  addPropertyToTarget(params) {
    return this.identityContract.addPropertyToTarget(params);
  }

  changeIdentityOwner(params) {
    return this.identityContract.changeIdentityOwner(params);
  }

  getIdentityOwner(params) {
    return this.identityContract.getIdentityOwner(params);
  }

  encryptPrivateKeyForWebID(privateKeyWebID) {
    return '0x' +
      this.walletCrypto.encryptMessage(
        this.encryptionKeys.publicKey,
        privateKeyWebID,
      );
  }
  decryptPrivateKeyForWebID(privateKeyWebIDEncrypted) {
    privateKeyWebIDEncrypted = privateKeyWebIDEncrypted.replace('0x', '');
    return this.walletCrypto.decryptMessage(
      this.encryptionKeys.privateKey,
      privateKeyWebIDEncrypted,
    );
  }

  addIdentityAddressToLookupContract(params) {
    return this.lookupContract.addIdentityAddressToLookupContract(params);
  }
  addIdentityAddressToLookupForOtherEntity(params) {
    return this.lookupContract.addIdentityAddressToLookupForOtherEntity(params);
  }
  waitingForTransactionToBeMined({transactionHash, maxWaitingTime}) {
    return this.lightWallet
      .waitingForTransactionToBeMined({transactionHash, maxWaitingTime})
      .then(transaction => {
        return Promise.resolve({
          from: transaction.from,
          to: transaction.to,
          data: this.lightWallet.toAscii(transaction.input),
          value: this.lightWallet.fromWei(transaction.value.toString()),
        });
      });
  }

  getBalance() {
    return this.getBalances(this.mainAddress);
  }

  getBalances(address) {
    return this.lightWallet.getBalances(address);
  }

  setMainAddress(address) {
    this.mainAddress = address;
  }
  getMainAddress() {
    return this.mainAddress;
  }

  waitingToBeMinedFilter(addressToWatch, transactionHash) {
    return this.lightWallet.waitingToBeMinedFilter(
      addressToWatch,
      transactionHash,
    );
  }
  getTransaction(transactionHash) {
    return this.lightWallet
      .getTransaction(transactionHash)
      .then(transaction => {
        console.log('--');
        console.log(transaction.input);
        return Promise.resolve({
          from: transaction.from,
          to: transaction.to,
          data: this.lightWallet.toAscii(transaction.input),
          value: this.lightWallet.fromWei(transaction.value.toString()),
        });
      });
  }

  waitingToBeMined(transactionHash) {
    //TODO: change method name into waitingForEvents
    //every method in the identity contract uses events
    return this.lightWallet.waitingForEvent(transactionHash);
  }
}
