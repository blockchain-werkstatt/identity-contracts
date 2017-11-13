import * as superagent from 'superagent';
import {keystore} from 'eth-lightwallet';
import SmartWallet from './wallet';
import SeedStorage from './seed-storage';

export default class WalletManager {
  constructor(config) {
    this._config = config;

    const seedStorageConfig = config.seedStorage;
    if (seedStorageConfig) {
      const SeedStorageClass = seedStorageConfig.storageClass || SeedStorage;
      this._seedStorage = new SeedStorageClass(seedStorageConfig);
    }
    this.jolocomEtherAddress = config.jolocomEtherAddress;

    this._logger = config.logger ||
      (config.debug ? console.log.bind(console) : () => {});
  }

  generateSeedPhrase(entropy) {
    let seed = keystore.generateRandomSeed(entropy);
    return seed;
  }

  initWalletAndGenerateWebIDKey(
    {
      userName,
      seedPhrase,
      pin,
    },
  ) {
    let wallet = new SmartWallet(this._config);
    return new Promise((resolve, reject) => {
      wallet.init({seedPhrase: seedPhrase, pin: pin}).then(mainAddress => {
        let webIdKey = wallet.generatePrivateKeyForWebID();
        let encryptedWebIdKey = wallet.encryptPrivateKeyForWebID(webIdKey);
        wallet.setWebIDPrivateKey(webIdKey);
        wallet.setWebId(`https://${userName}.webid.jolocom.de/profile/card#me`)
        resolve({encryptedWebIdKey, wallet});
      });
    });
  }

  async registerWithSeedPhrase(
    {
      userName,
      seedPhrase,
      pin,
    },
  ) {
    this._logger(
      'WalletAgent: See Transactions at: https://ropsten.etherscan.io/',
    );

    const {
      encryptedWebIdKey,
      wallet,
    } = await this.initWalletAndGenerateWebIDKey({
      userName,
      seedPhrase,
      pin,
    });

    const result = await superagent
      .post(this.jolocomEtherAddress + '/identity/create')
      .type('form')
      .send({
        walletAddress: wallet.mainAddress,
        userName,
        encryptedWebIdPrivateKey: encryptedWebIdKey,
      });

    wallet.setIdentityAddress(result.body.identityAddress);
    return wallet;
  }

  registerWithSeedPhraseFromOwnAccount(
    {
      userName,
      seedPhrase,
      pin,
    },
  ) {
    /*
    complete register process will be payed from own account
    mainAddress need to have ether in in advance
    */
    this._logger(seedPhrase);
    let wallet = new SmartWallet(this._config);
    return new Promise((resolve, reject) => {
      wallet
        .init({seedPhrase: seedPhrase, pin: pin})
        .then(result => {
          return wallet.createDigitalIdentity({
            userName: userName,
            pin: pin,
          });
        })
        .then(identityAddress => {
          wallet.setIdentityAddress(identityAddress);
          return wallet.addIdentityAddressToLookupContract({
            identityAddress: identityAddress,
            pin: pin,
          });
        })
        .then(transactionHash => {
          this._logger(
            'WalletAgent: identityAddress addedtoLookupContract Transaction ' +
              'waiting to be mined txhash -> ' +
              transactionHash,
          );

          return wallet.waitingToBeMined(transactionHash);
        })
        .then(transaction => {
          this._logger(
            'WalletAgent: Transaction add address to lookup contracted got' +
              ' mined -> ' +
              transaction.transactionHash,
          );
          let privateKeyWebID = wallet.generatePrivateKeyForWebID();
          wallet.setWebIDPrivateKey(privateKeyWebID);
          this._logger('WalletAgent: privatekey WebID');
          this._logger(privateKeyWebID);
          let encryptedWebID = wallet.encryptPrivateKeyForWebID(
            privateKeyWebID,
          );
          this._logger('WalletAgent: privatekey WebID encrypted');
          this._logger(encryptedWebID);
          return wallet.addProperty({
            id: 'webidkey',
            value: encryptedWebID,
            pin: pin,
          });
        })
        .then(txhash => {
          this._logger(
            'WalletAgent: addPropertyTransaction waiting to be mined txhash: ' +
              txhash,
          );
          return wallet.waitingToBeMined(txhash);
        })
        .then(transaction => {
          this._logger(
            'WalletAgent: addPropertyTransaction got minded txhash: ' +
              transaction.transactionHash,
          );
          resolve(wallet);
        });
    });
  }

  async registerWithCredentials(
    {
      userName,
      email,
      password,
      pin,
    },
  ) {
    const seedPhrase = this.generateSeedPhrase();
    await this._seedStorage.storeSeed({email, password, seed});
    return await this.registerWithSeedPhrase({
      userName,
      seedPhrase,
      pin,
    });
  }

  loginWithSeedPhrase({seedPhrase, pin}) {
    this._logger('WalletAgent: Login with Seedphrase');
    this._logger(seedPhrase);
    let wallet = new SmartWallet(this._config);
    return new Promise((resolve, reject) => {
      wallet
        .init({seedPhrase: seedPhrase, pin: pin})
        .then(result => {
          return wallet.getIdentityAddressFromLookupContract();
        })
        .then(identityAddress => {
          this._logger('WalletAgent: got identity Address from Lookup Table');
          this._logger(identityAddress);
          wallet.setIdentityAddress(identityAddress);
          return wallet.getProperty('webid');
        })
        .then(webid => {
          wallet.setWebId(webid);
          return wallet.getProperty('webidkey');
        })
        .then(webIdEncrypted => {
          this._logger('WalletAgent: private key of the webId');
          wallet.setWebIDPrivateKey(
            wallet.decryptPrivateKeyForWebID(webIdEncrypted),
          );
          this._logger(wallet.getWebIDPrivateKey());
          resolve(wallet);
        });
    });
  }

  async loginWithCredentials({email, password, pin}) {
    const seedPhrase = await this._seedStorage.getSeed({email, password});
    return await this.loginWithSeedPhrase({seedPhrase, pin});
  }

  loginFromSerialized(serialized) {
    const wallet = new SmartWallet(this._config);
    wallet.initFromSerialized(serialized);
    return wallet;
  }
}
