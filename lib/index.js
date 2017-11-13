'use strict';

var _manager = require('./manager');

var _manager2 = _interopRequireDefault(_manager);

var _wallet = require('./wallet');

var _wallet2 = _interopRequireDefault(_wallet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = { Wallet: _wallet2.default, WalletManager: _manager2.default };