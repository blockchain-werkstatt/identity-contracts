var IdentityLookup = artifacts.require("./IdentityLookup.sol");

var checkEvent = function (solidityTransactionObject, eventType) {
	return solidityTransactionObject.logs[0].args.eventType == eventType;
}
const Event = {
	SUCCESS: 0,
	WARNING: 1,
	ERROR: 2,
	INFO: 3

}

contract('IdentityLookup', function (accounts) {
	var testIdentityContractAddress = "0x758698f8347b14bb446789af41d3e54ba9d4aef0";
  var identityLookup;
	it("add identity contract address", function () {

		return IdentityLookup.deployed().then(function (_instance) {
      identityLookup = _instance;
			return identityLookup.addIdentityAddress(testIdentityContractAddress);
		}).then(function (_transactionResult) {
			assert.equal(checkEvent(_transactionResult, Event.SUCCESS), true, "identity contract not correctly deployed");
			return identityLookup.getIdentityAddress.call(accounts[0]);
		}).then(function (_identityAddress) {
			assert.equal(_identityAddress, testIdentityContractAddress, "identityAddress not stored correctly")

		});

	});
});
