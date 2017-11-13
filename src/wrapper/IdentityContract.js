import IdentityContractABI from '../../build/contracts/Identity.json';

const ATTRIBUTE = {
  CREATOR: 0,
  ATTRIBUTE_HASH: 1,
  DEFINITION_URL: 2,
  AMOUNT_VERIFICATIONS: 3,
};

export default class IdentityContract {
  constructor(lightWallet, walletCrypto) {
    //LightWallet
    this.lightWallet = lightWallet;

    // ADDRESSES
    this.identityAddress = '0x';

    this.walletCrypto = walletCrypto;

    // SMART CONTRACTS
    this.identityContractInstance = undefined;
  }
  createInstanceIdentityContract(address) {
    this.identityContractInstance = this.lightWallet.createContractInstance({
      address: address,
      abi: IdentityContractABI.abi,
    });
  }
  setIdentityAddress(identityAddress) {
    this.identityAddress = identityAddress;
    // create instance of the identity smart contract
    this.createInstanceIdentityContract(this.identityAddress);
  }
  addVerificationToTargetIdentity({targetIdentityAddress, attributeId, pin}) {
    let idHash = this._createAttributeID(attributeId);

    let methodName = 'addVerificationToTargetIdentity';
    let args = [];

    args.push(targetIdentityAddress);
    args.push(idHash);

    return this.lightWallet.contractMethodTransaction(
      this.identityContractInstance,
      methodName,
      args,
      pin,
    );
  }
  getIdentityAddress() {
    return this.identityAddress;
  }
  addAttributeHashToTargetIdentity(
    {
      attributeId,
      attribute,
      definitionUrl,
      pin,
      targetIdentityAddress,
    },
  ) {
    let attributeHash = this.walletCrypto.calculateDataHash(attribute);
    let idHash = this._createAttributeID(attributeId);

    let methodName = 'addAttributeToTargetIdentity';
    let args = [];

    args.push(targetIdentityAddress);
    args.push(idHash);
    args.push(attributeHash);
    args.push(definitionUrl);
    return this.lightWallet.contractMethodTransaction(
      this.identityContractInstance,
      methodName,
      args,
      pin,
    );
  }
  addAttributeHashToIdentity(
    {
      attributeId,
      attribute,
      definitionUrl,
      pin,
      identityAddress,
    },
  ) {
    let attributeHash = this.walletCrypto.calculateDataHash(attribute);
    let idHash = this._createAttributeID(attributeId);

    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });

    console.log('IdentityAddress: ' + identityAddress);

    console.log('SmartWallet: AttributeHash->' + attributeHash);

    let methodName = 'addAttribute';
    let args = [];

    args.push(idHash);
    args.push(attributeHash);
    args.push(definitionUrl);
    return this.lightWallet.contractMethodTransaction(
      identityContract,
      methodName,
      args,
      pin,
    );
  }
  addAttributeHashAndWait(params) {
    params.identityAddress = this.getIdentityAddress();
    return this.addAttributeHashToIdentity(params).then(transactionHash => {
      console.log(
        'WalletAgent: addAttributeHash waiting to be minded ->' +
          transactionHash,
      );
      return this.lightWallet.waitingForEvent(transactionHash);
    });
  }
  addAttributeHashToTargetIdentityAndWait(params) {
    return this.addAttributeHashToTargetIdentity(
      params,
    ).then(transactionHash => {
      console.log(
        'WalletAgent: addAttributeHash waiting to be minded ->' +
          transactionHash,
      );
      return this.lightWallet.waitingForEvent(transactionHash);
    });
  }
  getAttributeHash({attributeId, identityAddress}) {
    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });

    let idHash = this._createAttributeID(attributeId);
    return new Promise((resolve, reject) => {
      identityContract.attributes(idHash, function(err, attribute) {
        if (err) {
          throw err;
        }
        console.log('SmartWallet: get Attribute Hash Call');
        resolve(attribute[ATTRIBUTE.ATTRIBUTE_HASH]);
      });
    });
  }
  getVerification({attributeId, verificationIdx, identityAddress}) {
    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });
    let idHash = this._createAttributeID(attributeId);
    return new Promise((resolve, reject) => {
      identityContract.getVerification(
        idHash,
        verificationIdx,
        function(err, result) {
          if (err) {
            throw err;
          }
          console.log('SmartWallet: get Verification call ');
          resolve(result);
        },
      );
    });
  }
  getAttributeHashCreator({attributeId, identityAddress}) {
    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });
    let idHash = this._createAttributeID(attributeId);
    return new Promise((resolve, reject) => {
      identityContract.attributes(idHash, function(err, attribute) {
        if (err) {
          throw err;
        }
        console.log('SmartWallet: get Attribute Hash Creator');
        resolve(attribute[ATTRIBUTE.CREATOR]);
      });
    });
  }
  getNumberOfVerifications({attributeId, identityAddress}) {
    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });

    let idHash = this._createAttributeID(attributeId);
    return new Promise((resolve, reject) => {
      identityContract.getNumberOfVerifications(idHash, function(err, result) {
        if (err) {
          throw err;
        }
        console.log('SmartWallet: get Attribute Hash Call');
        resolve(result);
      });
    });
  }
  _createAttributeID(attributeName) {
    return '0x' + this.walletCrypto.sha256(attributeName).toString();
  }
  createDigitalIdentity({pin}) {
    return this.lightWallet.createContract({
      contractInfo: IdentityContractABI,
      pin: pin,
    });
  }
  getProperty(propertyId) {
    let id = this._createAttributeID(propertyId);

    return new Promise((resolve, reject) => {
      this.identityContractInstance.properties(id, function(err, result) {
        if (err) {
          throw err;
        }
        console.log('SmartWallet: getProperty Call');
        resolve(result);
      });
    });
  }
  killIdentityContract({identityContractAddress, pin}) {
    console.log('LightWallet: kill Contract ' + identityContractAddress);

    let methodName = 'kill';
    let args = [];

    let identityContract = this.lightWallet.createContractInstance({
      address: identityContractAddress,
      abi: IdentityContractABI.abi,
    });

    return this.lightWallet.contractMethodTransaction(
      identityContract,
      methodName,
      args,
      pin,
    );
  }
  addProperty({id, value, pin}) {
    console.log(
      'SmartWallet start to add a property to identity contract ' +
        this.identityAddress,
    );
    let methodName = 'addProperty';
    let args = [];
    args.push(this._createAttributeID(id));
    args.push(value);
    return this.lightWallet.contractMethodTransaction(
      this.identityContractInstance,
      methodName,
      args,
      pin,
    );
  }
  addPropertyToTarget({identityAddress, id, value, pin}) {
    console.log(
      'SmartWallet start to add a property to target identity contract ' +
        identityAddress,
    );
    console.log(identityAddress);
    let methodName = 'addProperty';
    let args = [];
    args.push(this._createAttributeID(id));
    args.push(value);
    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });

    return this.lightWallet.contractMethodTransaction(
      identityContract,
      methodName,
      args,
      pin,
    );
  }
  changeIdentityOwner(
    {
      identityAddress,
      newMainAddress,
      pin,
    },
  ) {
    let methodName = 'changeOwner';
    let args = [];
    console.log(
      'SmartWallet:  changeIdentityOwner ' +
        identityAddress +
        ' to ' +
        newMainAddress,
    );
    args.push(newMainAddress);
    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });
    return this.lightWallet.contractMethodTransaction(
      identityContract,
      methodName,
      args,
      pin,
    );
  }
  getIdentityOwner(identityAddress) {
    console.log('SmartWallet: get owner call' + identityAddress);
    let identityContract = this.lightWallet.createContractInstance({
      address: identityAddress,
      abi: IdentityContractABI.abi,
    });

    return new Promise((resolve, reject) => {
      identityContract.owner(function(err, result) {
        if (err) {
          throw err;
        }
        console.log('SmartWallet: getProperty Call');
        resolve(result);
      });
    });
  }
}
