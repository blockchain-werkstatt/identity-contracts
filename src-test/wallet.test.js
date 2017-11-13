import WalletAgent from '../src/manager';
import SmartWallet from '../src/wallet';
import WalletCrypto from '../src/wallet-crypto';
import expect from 'expect.js';
import TestConfig from './config';

const USERNAME = 'testuser';

const CONFIG = {
  debug: true,
  logger: undefined,
  lookupContractAddress: '0x',
  gethHost: TestConfig.NODE,
};
describe('testing wallet functionality', () => {
  let createdIdentityContracts = [];

  before(async function() {});

  after(async function() {
    //kill all contracts we created for testings
    let wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });
    for (let i = 0; i < createdIdentityContracts.length; i++) {
      wallet.killIdentityContract({
        identityContractAddress: createdIdentityContracts[i],
        pin: TestConfig.PIN,
      });
    }
  });

  it('should generate a IdentityContract and add one property', async function() {
    // create Lookup Contract
    let wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });

    let identityContractAddress = await wallet.createDigitalIdentity({
      userName: USERNAME,
      pin: TestConfig.PIN,
    });
    createdIdentityContracts.push(identityContractAddress);
    console.log('IdentityContract created: ' + identityContractAddress);

    let testPropertyName = 'test';
    let testPropertyValue = '0x123e';

    wallet.setIdentityAddress(identityContractAddress);
    let transactionHashAddProperty = await wallet.addProperty({
      id: testPropertyName,
      value: testPropertyValue,
      pin: TestConfig.PIN,
    });

    let waitToBeMinded = await wallet.waitingToBeMined(
      transactionHashAddProperty,
    );

    let testValueFromContract = await wallet.getProperty(testPropertyName);
    expect(testValueFromContract).to.equal(testPropertyValue);
  });
  it('should generate a webidkey and add it as attribute', async function() {
    // create Lookup Contract
    let wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });

    let identityContractAddress = await wallet.createDigitalIdentity({
      userName: USERNAME,
      pin: TestConfig.PIN,
    });
    //createdIdentityContracts.push(identityContractAddress);
    console.log('IdentityContract created: ' + identityContractAddress);

    let propertyId = 'webidkey';
    let webIDKey = wallet.generatePrivateKeyForWebID();

    console.log(webIDKey);

    let encryptedWebID = wallet.encryptPrivateKeyForWebID(webIDKey);

    console.log(encryptedWebID);

    wallet.setIdentityAddress(identityContractAddress);
    let transactionHashAddProperty = await wallet.addProperty({
      id: propertyId,
      value: encryptedWebID,
      pin: TestConfig.PIN,
    });

    let waitToBeMinded = await wallet.waitingToBeMined(
      transactionHashAddProperty,
    );

    let recievedEncryptedWebID = await wallet.getProperty(propertyId);
    console.log(recievedEncryptedWebID);
    let decryptedWebID = wallet.decryptPrivateKeyForWebID(
      recievedEncryptedWebID,
    );
    console.log(decryptedWebID);
    expect(decryptedWebID).to.equal(webIDKey);
  });

  /*  it('should generate a lookupContract and add one identityAddress', async function() {
    // create Lookup Contract

    let wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });

    let testLookupContractAddress = await wallet.createLookupContract(TestConfig.PIN);
    console.log('Lookup Contract created: ' + testLookupContractAddress);
    //let testLookupContractAddress = '0x243470d28474e82f31f378c01dada395c296756b';
    wallet.setLookupAddress(testLookupContractAddress);
    let fakeIdenityAddress = '0xa26e15a7e2583d984193781dc837a9ecb269ea5a';

    wallet.setIdentityAddress(fakeIdenityAddress);
    let transactionHash = await wallet.addIdentityAddressToLookupContract({
      identityAddress: fakeIdenityAddress,
      pin: TestConfig.PIN,
    });

    console.log(transactionHash);
    let fakeIdenityAddressFromContract = await wallet.getIdentityAddressFromLookupContract();
    console.log('fake identity address');
    console.log(fakeIdenityAddressFromContract);
    expect(fakeIdenityAddressFromContract).to.equal(fakeIdenityAddress);
  });*/
});
describe('testing identity contract functionality', () => {
  let createdIdentityContracts = [];

  let identityContractAddress = '0x';
  let wallet = undefined;

  before(async function() {
    wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });
    identityContractAddress = await wallet.createDigitalIdentity({
      userName: USERNAME,
      pin: TestConfig.PIN,
    });
    createdIdentityContracts.push(identityContractAddress);
    wallet.setIdentityAddress(identityContractAddress);
  });

  after(async function() {
    //kill all contracts we created for testings
    let wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });
    for (let i = 0; i < createdIdentityContracts.length; i++) {
      wallet.killIdentityContract({
        identityContractAddress: createdIdentityContracts[i],
        pin: TestConfig.PIN,
      });
    }
  });

  it('should add attribute hash to identity contract', async function() {
    // create Lookup Contract
    let fakeAttribute = "{email: 'email@email.com'}";
    let transactionEvent = await wallet.addAttributeHashAndWait({
      attributeId: 'email',
      attribute: fakeAttribute,
      definitionUrl: 'http:',
      pin: TestConfig.PIN,
    });

    let walletCrypto = new WalletCrypto();
    let hash = walletCrypto.calculateDataHash(fakeAttribute);

    let hashFromContract = await wallet.getAttributeHash({
      attributeId: 'email',
      identityAddress: identityContractAddress,
    });
    console.log(hash);
    console.log(hashFromContract);

    expect(hashFromContract).to.equal(hash);
  });

  it('should add a attributeHash and create an other wallet and identity and recieve it again', async function() {
    // create Lookup Contract

    let testAttribute = "{test: 'test'}";
    let transactionEvent = await wallet.addAttributeHashAndWait({
      attributeId: 'test',
      attribute: testAttribute,
      definitionUrl: 'http:',
      pin: TestConfig.PIN,
    });

    let identityAddress = wallet.getIdentityAddress();

    let attributeHash = await wallet.getAttributeHash({
      attributeId: 'test',
      identityAddress: identityAddress,
    });

    // test with other seed and wallet
    let otherTestSeed = 'over true fatigue denial settle minute mosquito dilemma shiver lounge brick entire';

    let otherWallet = new SmartWallet(CONFIG);
    let otherWalletMainAddress = await otherWallet.init({
      seedPhrase: otherTestSeed,
      pin: TestConfig.PIN,
    });

    //call needs no ether
    let attributeHashOtherWallet = await otherWallet.getAttributeHash({
      attributeId: 'test',
      identityAddress: identityAddress,
    });

    expect(attributeHashOtherWallet).to.equal(attributeHash);
  });

  it('should create a target identity and add a attribute over own identity contract and add a verification', async function() {
    // create Lookup Contract

    let targetWallet = new SmartWallet(CONFIG);
    let targetMainAddress = await targetWallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });
    let identityContractAddressTarget = await targetWallet.createDigitalIdentity(
      {
        userName: USERNAME,
        pin: TestConfig.PIN,
      },
    );
    createdIdentityContracts.push(identityContractAddressTarget);
    targetWallet.setIdentityAddress(identityContractAddressTarget);

    let fakeAttribute = "{email: 'email@email.com'}";
    let transactionEvent = await wallet.addAttributeHashToTargetIdentityAndWait(
      {
        attributeId: 'email',
        attribute: fakeAttribute,
        definitionUrl: 'http:',
        pin: TestConfig.PIN,
        targetIdentityAddress: identityContractAddressTarget,
      },
    );

    let attributeHashCreatorAddress = await targetWallet.getAttributeHashCreator(
      {
        attributeId: 'email',
        identityAddress: identityContractAddressTarget,
      },
    );

    expect(identityContractAddress).to.equal(attributeHashCreatorAddress);

    let transactionHash = await wallet.addVerificationToTargetIdentity({
      targetIdentityAddress: identityContractAddressTarget,
      attributeId: 'email',
      pin: TestConfig.PIN,
    });
    transactionEvent = await wallet.waitingToBeMined(transactionHash);

    let numberOfVerifcations = await targetWallet.getNumberOfVerifications({
      attributeId: 'email',
      identityAddress: identityContractAddressTarget,
    });

    expect(numberOfVerifcations.toString()).to.equal('1');

    let verification = await targetWallet.getVerification({
      attributeId: 'email',
      identityAddress: identityContractAddressTarget,
      verificationIdx: 0,
    });

    expect(verification[0]).to.equal(identityContractAddress);
  });
});
describe('testing send ether functionality', () => {
  let createdIdentityContracts = [];

  let identityContractAddress = '0x';
  let wallet = undefined;

  before(async function() {
    wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });
    wallet.setMainAddress(mainAddress);
  });

  it('should send a small amount of ether to another address', async function() {
    // should send a small amount of ether
    //TESTCASE ONLY FOR TESTRPC

    let toAddress = '0xc1947e1a6880335477c7de4ff07d12d359234473';

    let etherBalanceBefore = await wallet.getBalances(toAddress);
    console.log(wallet.getMainAddress());

    let transHash = await wallet.sendEther({
      receiver: toAddress,
      amountEther: 0.01,
      data: null,
      pin: TestConfig.PIN,
    });
    console.log('TransactionHash: ' + transHash);

    let transaction = await wallet.waitingForTransactionToBeMined({
      transactionHash: transHash,
      maxWaitingTime: 1000000,
    });

    console.log(transaction);

    let etherBalanceAfter = await wallet.getBalances(toAddress);
    console.log(etherBalanceAfter);
    console.log(etherBalanceBefore);
    expect(etherBalanceAfter).to.be.above(etherBalanceBefore);
  });

  it('should send a small amount of ether with extra information', async function() {
    let toAddress = '0xc1947e1a6880335477c7de4ff07d12d359234473';
    let etherBalanceBefore = await wallet.getBalances(toAddress);
    console.log(wallet.getMainAddress());

    let extraInformation = 'test123';

    let transHash = await wallet.sendEther({
      receiver: toAddress,
      amountEther: 0.01,
      data: extraInformation,
      pin: TestConfig.PIN,
    });
    console.log('TranactionHash: ' + transHash);

    let transaction = await wallet.waitingForTransactionToBeMined({
      transactionHash: transHash,
      maxWaitingTime: 1000000,
    });
    expect(transaction.data).to.be.equal(extraInformation);
  });
});
describe('testing wallet transactions in pararell', () => {
  let createdIdentityContracts = [];

  let identityContractAddress = '0x';
  let wallet = undefined;

  before(async function() {
    wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });
    wallet.setMainAddress(mainAddress);
  });

  it('should create two identity contracts in pararell', function(done) {
    // should send a small amount of ether
    //TESTCASE ONLY FOR TESTRPC

    Promise.all([
      wallet.createDigitalIdentity({
        userName: USERNAME,
        pin: TestConfig.PIN,
      }),
      wallet.createDigitalIdentity({
        userName: USERNAME,
        pin: TestConfig.PIN,
      }),
    ]).then(idenityContractAddresses => {
      console.log('created two identity contracts');
      console.log(idenityContractAddresses); // [3, 1337, "foo"]
      expect(idenityContractAddresses.length).to.be.equal(2);
      done();
    });
  });
  it('should send ether in pararell', function(done) {
    // should send a small amount of ether
    //TESTCASE ONLY FOR TESTRPC
    let toAddress = '0xc1947e1a6880335477c7de4ff07d12d359234473';
    console.log(wallet.getMainAddress());

    let extraInformation = 'test123';

    Promise.all([
      wallet.sendEther({
        receiver: toAddress,
        amountEther: 0.01,
        data: extraInformation,
        pin: TestConfig.PIN,
      }),
      wallet.sendEther({
        receiver: toAddress,
        amountEther: 0.01,
        data: extraInformation,
        pin: TestConfig.PIN,
      }),
    ]).then(transactionHashes => {
      console.log('transactionHashes');
      console.log(transactionHashes);
      expect(transactionHashes.length).to.be.equal(2);
      done();
    });
  });
});
