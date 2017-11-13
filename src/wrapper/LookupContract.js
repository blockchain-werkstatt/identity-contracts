import IdentityLookupContract from '../../build/contracts/IdentityLookup.json';

export default class LookupContract {
  constructor(lookupContractAddress, lightwallet, walletCrypto) {
    this.lookupAddress = lookupContractAddress;

    this.walletCrypto = walletCrypto;
    //LightWallet
    this.lightWallet = lightwallet;

    // SMART CONTRACTS
    this.lookupContractInstance = this.lightWallet.createContractInstance({
      address: lookupContractAddress,
      abi: IdentityLookupContract.abi,
    });
  }
  createInstanceLookupContract(address) {
    this.lookupContractInstance = this.lightWallet.createContractInstance({
      address: address,
      abi: IdentityLookupContract.abi,
    });
  }
  setLookupAddress(lookupContractAddress) {
    this.lookupAddress = lookupContractAddress;
    // create instance of the identity smart contract
    this.createInstanceLookupContract(lookupContractAddress);
  }
  getLookupAddress() {
    return this.lookupAddress;
  }
  createLookupContract(pin) {
    return this.lightWallet.createContract({
      contractInfo: IdentityLookupContract,
      pin: pin,
    });
  }
  getIdentityAddressFromLookupContract(address) {
    if (address.search('0x') == -1) {
      address = '0x' + address;
    }
    console.log('LookupContract Address: ' + this.lookupAddress);
    console.log('ownerAddress: ' + address);
    return new Promise((resolve, reject) => {
      this.lookupContractInstance.getIdentityAddress(
        address,
        function(err, result) {
          if (err) {
            reject(err);
          }
          console.log('LookupContract: idenityAddress: ' + result);
          resolve(result);
        },
      );
    });
  }
  addIdentityAddressToLookupContract({identityAddress, pin}) {
    console.log(
      'LookupContract: add identity address to Lookup Contract -> ' +
        this.lookupAddress,
    );

    console.log('LookupContract: identity address: ' + identityAddress);

    let methodName = 'addIdentityAddress';

    let args = [];
    args.push(identityAddress);

    return this.lightWallet
      .contractMethodTransaction(
        this.lookupContractInstance,
        methodName,
        args,
        pin,
      )
      .then(transactionHash => {
        return transactionHash;
      });
  }
  addIdentityAddressToLookupForOtherEntity(
    {ownerMainAddress, identityAddress, pin},
  ) {
    console.log(
      'LookupContract ' +
        this.lookupAddress +
        ': add for owner: ' +
        ownerMainAddress +
        ' identityAddress:' +
        identityAddress,
    );

    let methodName = 'addIdentityAddressForOtherEntity';

    let args = [];
    args.push(ownerMainAddress);
    args.push(identityAddress);

    return this.lightWallet
      .contractMethodTransaction(
        this.lookupContractInstance,
        methodName,
        args,
        pin,
      )
      .then(transactionHash => {
        return transactionHash;
      });
  }
}
