import {keystore} from 'eth-lightwallet';
import Web3 from 'web3';
import SignerProvider from 'ethjs-provider-signer';
import WalletCrypto from './wallet-crypto';

// -----------------------------------------------------------------------------
// WORKARROUND
// TODO: migrate to webpack 2 to remove workarround
// https://github.com/ConsenSys/eth-lightwallet/issues/102
// start
import crypto from 'crypto';
const sourceCreateHash = crypto.createHash;
crypto.createHash = function createHash(alg) {
  if (alg === 'ripemd160') {
    alg = 'rmd160';
  }
  return sourceCreateHash(alg);
};
// end
// -----------------------------------------------------------------------------

export default class LightWallet {
  constructor(gethHost) {
    this.gethHost = gethHost;

    this.web3 = null;
    this.pin = '';

    this.walletCrypto = new WalletCrypto();
    this.provider = null;

    // KEYS
    this.keystore = null;

    // ADDRESSES
    this.mainAddress = '0x';
    this.mainAddressNonce = 0;

    // TRANSACTIONS
    this.transactionHistory = [];
  }

  _getActualGasPrice() {
    //TODO: implemented strategy for gasPrice calculation
    return 50000000000; //50gwei
  }

  waitingToBeMined(transactionHash) {
    return this._waitingToBeMined(
      this.transactionHistory[transactionHash].contract,
      transactionHash,
    );
  }

  _createInstanceLookupContract(address) {
    this.lookupContract = this.web3.eth
      .contract(IdentityLookupContract.abi)
      .at(address);
  }
  _createInstanceIdentityContract(address) {
    this.identityContract = this.web3.eth
      .contract(IdentityContract.abi)
      .at(address);
  }

  exportNewKeyPair(pin) {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(
        pin,
        function(err, pwDerivedKey) {
          if (err) {
            reject(err);
            return;
          }

          this.keystore.generateNewAddress(pwDerivedKey, 1);
          let addresses = this.keystore.getAddresses();

          let privateKey = this.keystore.exportPrivateKey(
            addresses[1],
            pwDerivedKey,
          );
          let publicKey = this.walletCrypto.computeCompressedEthereumPublicKey(
            privateKey,
          );
          resolve({
            privateKey: privateKey,
            publicKey: publicKey,
          });
        }.bind(this),
      );
    });
  }

  _getMainAddressNonceFromNode() {
    return new Promise((resolve, reject) => {
      console.log('set main adddress nonce');
      this.web3.eth.getTransactionCount(
        '0x' + this.mainAddress,
        function(err, mainAddressNonce) {
          resolve(mainAddressNonce);
          if (err) {
            reject(err);
          }
        },
      );
    });
  }
  generateRandomSeed(entropy) {
  return keystore.generateRandomSeed(entropy);
}

  init({seedPhrase, pin}) {
    console.log('LightWallet: create LightWallet');
    console.log('LightWallet: seedPhrase -> ' + seedPhrase);
    console.log('LightWallet: pin -> ' + pin);
    return new Promise((resolve, reject) => {
      keystore.createVault(
        {
          password: pin,
          seedPhrase: seedPhrase,
        },
        function(err, ks) {
          if (err) {
            console.log('LightWallet Error: invalid Seedphrase');
            throw err;
          }
          ks.keyFromPassword(
            pin,
            function(err, pwDerivedKey) {
              if (err) throw err;

              ks.generateNewAddress(pwDerivedKey, 1);
              let addresses = ks.getAddresses();

              this.setMainAddress(addresses[0]);
              console.log('LightWallet: main addresses ' + this.mainAddress);

              this._setProvider(ks, this.mainAddress);

              this.getBalances('0x' + this.mainAddress).then(balance => {
                console.log('LightWallet: Balance ' + balance + ' ETH');
              });

              this._getMainAddressNonceFromNode().then(mainAddressNonce => {
                this.mainAddressNonce = mainAddressNonce;
                resolve(this.mainAddress);
              });
            }.bind(this),
          );
        }.bind(this),
      );
    });
  }
  initFromSerialized(serialized) {
    const data = JSON.parse(serialized);
    const ks = keystore.deserialize(data.keystore);
    this.setMainAddress(data.mainAddress);
    this._setProvider(ks, this.mainAddress);
  }

  serialize() {
    return JSON.stringify({
      keystore: this.keystore.serialize(),
      mainAddress: this.mainAddress,
    });
  }

  createContractInstance({address, abi}) {
    return this.web3.eth.contract(abi).at(address);
  }
  toHex(data) {
    return this.web3.toHex(data);
  }
  toAscii(hex) {
    return this.web3.toAscii(hex);
  }
  fromWei(wei) {
    return this.web3.fromWei(wei);
  }

  sendEther({receiver, amountEther, data, pin}) {
    return this._withPin(pin, () => {
      return new Promise((resolve, reject) => {
        if (data != null && data != '0x') {
          console.log(data);
          data = this.toHex(data);
          console.log(data);
        } else {
          data = '0x';
        }

        let amountInWei = this.web3.toWei(amountEther, 'ether');
        let nonce = this._nextNonceMainAddress();
        console.log('used nonce for transaction: ' + nonce);
        this.web3.eth.sendTransaction(
          {
            from: this.mainAddress,
            to: receiver,
            value: amountInWei,
            gas: 3000000,
            data: data,
            gasPrice: this._getActualGasPrice(),
            nonce: this.web3.toHex(nonce),
          },
          function(err, result) {
            if (!err) {
              resolve(result);
            } else {
              throw err;
            }
          },
        );
      });
    });
  }

  _withPin(pin, functionWhichNeedsPin) {
    return new Promise((resolve, reject) => {
      this.pin = pin;
      functionWhichNeedsPin()
        .then(result => {
          this.pin = null;
          resolve(result);
        })
        .catch(err => {
          this.pin = null;
          reject(err);
        });
    });
  }

  _getPin() {
    return this.pin;
  }

  _setProvider(ks, mainAddress) {
    this.keystore = ks;
    this.keystore.passwordProvider = function(callback) {
      let pin = this._getPin();
      console.log('LightWallet: Entered Pin:' + pin);
      callback(null, pin);
    }.bind(this);

    let provider = new SignerProvider(this.gethHost, {
      signTransaction: (rawTx, cb) => {
        this.keystore.signTransaction(rawTx, cb);
        console.log('LightWallet: signs a raw transaction');
      },

      accounts: cb => cb(null, [mainAddress]),
    });

    this.provider = provider;
    this.web3 = new Web3(this.provider);
  }
  getBalances(address) {
    return new Promise((resolve, reject) => {
      this.web3.eth.getBalance(address, (err, result) => {
        if (err) {
          throw err;
        }

        let amountOfEther = this.web3.fromWei(result, 'ether').toString(10);
        console.log(
          'LightWallet: Balance Address:' +
            address +
            ' ' +
            amountOfEther +
            ' ETH',
        );
        resolve(amountOfEther);
      });
    });
  }

  setMainAddress(address) {
    this.mainAddress = address;
  }
  getMainAddress() {
    return this.mainAddress;
  }

  _calculateEstimatedGas(_data, callback) {
    this.web3.eth.estimateGas(
      {
        data: _data,
      },
      function(err, estimatedGas) {
        callback(err, estimatedGas);
      },
    );
  }

  waitingToBeMinedFilter(addressToWatch, transactionHash) {
    return new Promise((resolve, reject) => {
      console.log('AddressToWatch');
      console.log(addressToWatch);

      let filter = this.web3.eth.filter({
        address: [addressToWatch],
        fromBlock: 0,
        toBlock: 'latest',
      });
      /*this.web3.eth.filter('latest').watch(function(error, result) {
        console.log(result);
      });*/
      filter.watch(function(error, result) {
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

  getTransaction(transactionHash) {
    return new Promise((resolve, reject) => {
      this.web3.eth.getTransaction(transactionHash, function(error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  }

  _waitingForTransactionToBeMined(
    transactionHash,
    maxWaitingTime,
    resolve,
    reject,
  ) {
    let interval = 500;
    setTimeout(
      function() {
        this.web3.eth.getTransaction(
          transactionHash,
          function(error, result) {
            if (result.blockNumber == null) {
              if (maxWaitingTime > 0) {
                this._waitingForTransactionToBeMined(
                  transactionHash,
                  maxWaitingTime - interval,
                  resolve,
                  reject,
                );
              } else {
                reject('maximal waiting time reached');
              }
            } else {
              resolve(result);
            }
          }.bind(this),
        );
      }.bind(this),
      interval,
    );
  }

  waitingForTransactionToBeMined({transactionHash, maxWaitingTime}) {
    //TODO: refectoring with eth.filters
    return new Promise((resolve, reject) => {
      this._waitingForTransactionToBeMined(
        transactionHash,
        maxWaitingTime,
        resolve,
        reject,
      );
    });
  }

  waitingForEvent(transactionHash) {
    /* every transaction in the identity contract uses events
     a event notification means the transaction has been executed/mined
    */
    return new Promise((resolve, reject) => {
      let contract = this.transactionHistory[transactionHash].contract;
      let myEvent = contract.EventNotification();
      myEvent.watch((error, result) => {
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

  contractMethodTransaction(_contract, _methodName, _args, _pin) {
    return this._withPin(_pin, () => {
      return new Promise((resolve, reject) => {
        let gas = 3141592; // gas maximum
        let nonce = this._nextNonceMainAddress();
        console.log('used nonce for transaction: ' + nonce);
        _args.push({
          from: this.mainAddress,
          value: 0,
          gasPrice: this._getActualGasPrice(),
          gas: gas,
          nonce: this.web3.toHex(nonce),
        });
        _args.push(
          function(err, txhash) {
            if (!err) {
              this._addToTransactionHistory(txhash, _contract);
            }
            resolve(txhash);
          }.bind(this),
        );
        _contract[_methodName].apply(this, _args);
      });
    });
  }

  _addToTransactionHistory(transactionHash, contract, status) {
    console.log(
      'LightWallet: Transaction-> ' + transactionHash + ' added to history',
    );
    this.transactionHistory[transactionHash] = {contract: contract};
  }

  createContract({contractInfo, pin}) {
    console.log('create contract');
    return this._withPin(pin, () => {
      return this._createContract(contractInfo);
    });
  }

  _getActualNonceMainAddress() {
    return this.mainAddressNonce;
  }
  _increaseNonceMainAddress() {
    this.mainAddressNonce += 1;
  }
  _nextNonceMainAddress() {
    let nextNonce = this._getActualNonceMainAddress();
    this._increaseNonceMainAddress(); //pepare nonce for next transactionHash
    return nextNonce;
  }

  _createContract(contractInfo) {
    return new Promise((resolve, reject) => {
      console.log('LightWallet: start  contract');
      var identityContract = this.web3.eth.contract(contractInfo.abi);
      var address = '0x' + this.mainAddress;
      this._calculateEstimatedGas(
        contractInfo.unlinked_binary,
        function(_err, _estimatedGas) {
          console.log(
            'LightWallet: estimated gas for  contract deployment ' +
              _estimatedGas,
          );
          let nonce = this._nextNonceMainAddress();
          console.log('used nonce for transaction: ' + nonce);
          identityContract.new(
            {
              from: address,
              data: contractInfo.unlinked_binary,
              gasPrice: this._getActualGasPrice(),
              // gas: _estimatedGas + 10000
              gas: 3141592, // maximum gas
              nonce: this.web3.toHex(nonce),
            },
            function(e, contract) {
              if (!e) {
                if (!contract.address) {
                  console.log(
                    'LightWallet: Contract transaction send: TransactionHash:' +
                      contract.transactionHash +
                      ' waiting to be mined...',
                  );
                } else {
                  console.log('LightWallet: Identity Contract created');
                  console.log(
                    'LightWallet: Contract mined! Address: ' + contract.address,
                  );
                  resolve(contract.address);
                }
              } else {
                reject(e);
              }
            },
          );
        }.bind(this),
      );
    });
  }
}
