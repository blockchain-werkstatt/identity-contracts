'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _superagent = require('superagent');

var superagent = _interopRequireWildcard(_superagent);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('superagent-promise')(superagent, Promise);

var SeedStorage = function () {
  function SeedStorage(config) {
    _classCallCheck(this, SeedStorage);

    this.config = config;
  }

  _createClass(SeedStorage, [{
    key: 'getSeed',
    value: function getSeed(_ref) {
      var email = _ref.email,
          password = _ref.password;

      return superagent.post(this.config.url + 'seed').type('form').send({ email: email, password: password }).then(function (result) {
        return result.body.seed;
      });
    }
  }, {
    key: 'storeSeed',
    value: function storeSeed(_ref2) {
      var email = _ref2.email,
          password = _ref2.password,
          seed = _ref2.seed;

      return superagent.post(this.config.url + 'register').type('form').send({ email: email, password: password, seed: seed }).then(function (result) {
        return null;
      });
    }
  }]);

  return SeedStorage;
}();

exports.default = SeedStorage;