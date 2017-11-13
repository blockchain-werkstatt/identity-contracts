import * as superagent from 'superagent'
require('superagent-promise')(superagent, Promise)


export default class SeedStorage {
  constructor(config) {
    this.config = config
  }

  getSeed({email, password}) {
    return superagent
      .post(this.config.url + 'seed')
      .type('form')
      .send({email, password})
      .then(result => result.body.seed)
  }

  storeSeed({email, password, seed}) {
    return superagent
      .post(this.config.url + 'register')
      .type('form')
      .send({email, password, seed})
      .then(result => null)
  }
}
