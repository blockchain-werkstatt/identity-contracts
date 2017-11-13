/*

covers basic functionality for testing on a ethereum testnet (ropsten,rinkeby)

*/
import WalletAgent from '../src/manager';
import Wallet from '../src/wallet';
import expect from 'expect.js';
import TestConfig from './config';

describe('testing wallet manager', () => {
  let lookupContractAddress = '0x';
  let testLookupContractAddress = '0x';

  let nodeLocalhostTestRPC = 'http://localhost:8545';

  let node = '';
  let lookupContractAddr = '';

  before(async function() {
    let config = {
      debug: true,
      undefined,
      lookupContractAddress: '0x',
      gethHost: TestConfig.NODE,
    };
    //deploy lookup Contract
    let testSeed = TestConfig.TESTSEED1;
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
    node = nodeLocalhostTestRPC;
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
});
