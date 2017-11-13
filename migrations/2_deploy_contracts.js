var Identity = artifacts.require("./Identity.sol");
var IdentityLookup = artifacts.require("./IdentityLookup.sol");

module.exports = function(deployer) {
  deployer.deploy(Identity);
  deployer.deploy(IdentityLookup);

};
