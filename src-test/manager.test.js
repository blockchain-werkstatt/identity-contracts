import WalletAgent from '../src/manager';
import Wallet from '../src/wallet';
import expect from 'expect.js';
import TestConfig from './config';

describe('testing wallet manager', () => {
  let lookupContractAddress = '0x';
  let lookupContractAddr = '0x';
  let testLookupContractAddress = '0x';
  let node = TestConfig.NODE;

  before(async function() {
    let config = {
      debug: true,
      undefined,
      lookupContractAddress: '0x',
      gethHost: TestConfig.NODE,
    };
    //deploy lookup Contract
    let testSeed = 'mandate print cereal style toilet hole' +
      ' cave mom heavy fork network indoor';
    // create Lookup Contract

    let wallet = new Wallet(config);
    let mainAddress = await wallet.init({
      seedPhrase: testSeed,
      pin: TestConfig.PIN,
    });

    testLookupContractAddress = await wallet.createLookupContract(
      TestConfig.PIN,
    );
    console.log('BEFORE: lookup Contract created: ' + lookupContractAddress);

    //setup configuration

    lookupContractAddr = testLookupContractAddress;
  });

  it('should registerWithSeedPhraseFromOwnAccount', async function() {
    //let lookupContractAddr = lookupContractAddress;
    let testSeed = 'mandate print cereal style toilet hole' +
      ' cave mom heavy fork network indoor';
    let config = {
      debug: true,
      undefined,
      lookupContractAddress: lookupContractAddr,
      gethHost: node,
    };

    console.log('lookupContractAddress----->');
    console.log(lookupContractAddr);
    let walletAgent = new WalletAgent(config);
    let wallet = await walletAgent.registerWithSeedPhraseFromOwnAccount({
      userName: 'testuser',
      seedPhrase: testSeed,
      pin: TestConfig.PIN,
    });
  });
  it('should registerWithSeedPhraseFromOwnAccount and login afterwards', async function() {
    //config

    //let lookupContractAddr = lookupContractAddress;
    let testSeed = 'mandate print cereal style toilet hole' +
      ' cave mom heavy fork network indoor';
    let config = {
      debug: true,
      undefined,
      lookupContractAddress: lookupContractAddr,
      gethHost: node,
    };

    let walletAgent = new WalletAgent(config);
    let wallet = await walletAgent.registerWithSeedPhraseFromOwnAccount({
      userName: 'testuser',
      seedPhrase: testSeed,
      pin: TestConfig.PIN,
    });

    let walletAgent2 = new WalletAgent(config);
    let wallet2 = await walletAgent2.loginWithSeedPhrase({
      userName: 'testuser2',
      seedPhrase: testSeed,
      pin: TestConfig.PIN,
    });

    let webidkeyEncrypted = await wallet2.getProperty('webidkey');
    console.log(webidkeyEncrypted);

    expect(webidkeyEncrypted.length).to.be.above(100);
  });
  it('should recieve attribute hash from other wallet', async function() {
    let config = {
      debug: true,
      undefined,
      lookupContractAddress: lookupContractAddr,
      gethHost: node,
    };
    // WALLET 2
    let walletAgent2 = new WalletAgent(config);
    let wallet2 = await walletAgent2.registerWithSeedPhraseFromOwnAccount({
      userName: 'testuser2',
      seedPhrase: TestConfig.TESTSEED2,
      pin: TestConfig.PIN,
    });

    let testAttribute = "{test: 'test'}";
    let transactionEvent = await wallet2.addAttributeHashAndWait({
      attributeId: 'test',
      attribute: testAttribute,
      definitionUrl: 'http:',
      pin: TestConfig.PIN,
    });

    let identityAddress2 = wallet2.getIdentityAddress();

    let attributeHash2 = await wallet2.getAttributeHash({
      attributeId: 'test',
      identityAddress: identityAddress2,
    });

    //WALLET 1

    //register
    let walletAgent1 = new WalletAgent(config);
    let wallet1 = await walletAgent1.registerWithSeedPhraseFromOwnAccount({
      userName: 'testuser1',
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });

    //recieve attributeHash von Identity2
    let attributeHash1 = await wallet1.getAttributeHash({
      attributeId: 'test',
      identityAddress: identityAddress2,
    });

    expect(attributeHash1).to.equal(attributeHash2);
  });
  it('register identity for an other person', async function() {
    let config = {
      debug: true,
      undefined,
      lookupContractAddress: lookupContractAddr,
      gethHost: node,
    };
    // alice client side
    let walletAgentAlice = new WalletAgent(config);
    let walletData = await walletAgentAlice.initWalletAndGenerateWebIDKey({
      userName: 'alice',
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });
    let walletAlice = walletData.wallet;
    let encryptedWebIdKeyAlice = walletData.encryptedWebIdKey;
    let aliceMainAddress = '0x' + walletAlice.getMainAddress();
    console.log(encryptedWebIdKeyAlice);

    //bob server side
    let walletAgentBob = new WalletAgent(config);
    let walletBob = await walletAgentBob.registerWithSeedPhraseFromOwnAccount({
      userName: 'bob',
      seedPhrase: TestConfig.TESTSEED2,
      pin: TestConfig.PIN,
    });

    let aliceIdentityAddress = await walletBob.createDigitalIdentity({
      username: 'alice',
      pin: TestConfig.PIN,
    });

    let transactionHash = await walletBob.addIdentityAddressToLookupForOtherEntity(
      {
        ownerMainAddress: aliceMainAddress,
        identityAddress: aliceIdentityAddress,
        pin: TestConfig.PIN,
      },
    );

    console.log(transactionHash);

    let transactionEvent = await walletBob.waitingToBeMined(transactionHash);
    let propertyId = 'webidkey';

    transactionHash = await walletBob.addPropertyToTarget({
      identityAddress: aliceIdentityAddress,
      id: propertyId,
      value: encryptedWebIdKeyAlice,
      pin: TestConfig.PIN,
    });

    transactionEvent = await walletBob.waitingToBeMined(transactionHash);

    transactionHash = await walletBob.changeIdentityOwner({
      identityAddress: aliceIdentityAddress,
      newMainAddress: aliceMainAddress,
      pin: TestConfig.PIN,
    });

    transactionEvent = await walletBob.waitingToBeMined(transactionHash);

    let newOwner = await walletBob.getIdentityOwner(aliceIdentityAddress);
    expect(newOwner).to.equal(aliceMainAddress);

    //client side again
    walletAgentAlice = new WalletAgent(config);
    walletAlice = await walletAgentAlice.loginWithSeedPhrase({
      seedPhrase: TestConfig.TESTSEED1,
      userName: 'alice',
      pin: TestConfig.PIN,
    });

    expect(walletAlice.getWebIDPrivateKey().length).to.be.above(100);
  });
});
