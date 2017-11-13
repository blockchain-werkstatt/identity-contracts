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
describe('testing lookup Contract ', () => {
  it('should generate a lookupContract and add one identity address', async function() {
    // create Lookup Contract
    let wallet = new SmartWallet(CONFIG);
    let mainAddress = await wallet.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });

    let testLookupContractAddress = await wallet.createLookupContract(
      TestConfig.PIN,
    );
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
  });
  it('should generate a lookupContract and add address for other owner', async function() {
    // create Lookup Contract
    //Wallet BOB
    let walletBob = new SmartWallet(CONFIG);
    let mainAddress = await walletBob.init({
      seedPhrase: TestConfig.TESTSEED1,
      pin: TestConfig.PIN,
    });

    //ALICE
    let walletAlice = new SmartWallet(CONFIG);
    let mainAddressAlice = await walletAlice.init({
      seedPhrase: TestConfig.TESTSEED2,
      pin: TestConfig.PIN,
    });

    let testLookupContractAddress = await walletBob.createLookupContract(
      TestConfig.PIN,
    );
    console.log('Lookup Contract created: ' + testLookupContractAddress);
    //let testLookupContractAddress = '0x243470d28474e82f31f378c01dada395c296756b';
    walletBob.setLookupAddress(testLookupContractAddress);
    let fakeIdenityAddress = '0xa26e15a7e2583d984193781dc837a9ecb269ea5a';
    let c1947e1a6880335477c7de4ff07d12d359234473;

    let transactionHash = await walletBob.addIdentityAddressToLookupForOtherEntity(
      {
        ownerMainAddress: '0x' + mainAddressAlice,
        identityAddress: fakeIdenityAddress,
        pin: TestConfig.PIN,
      },
    );

    let event = await walletBob.waitingToBeMined(transactionHash);

    console.log(event);

    walletAlice.setLookupAddress(testLookupContractAddress);
    let fakeIdenityAddressFromContract = await walletAlice.getIdentityAddressFromLookupContract();
    console.log('fake identity address');
    console.log(fakeIdenityAddressFromContract);

    expect(fakeIdenityAddressFromContract).to.equal(fakeIdenityAddress);
  });
});
