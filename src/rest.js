const request = require('superagent')
const assert = require('assert')
const process = require('process')

module.exports = class RestClient {
  constructor() {
    this.baseUrl = ''
    this.appId = ''
    this.appKey = 'kreis'

    this.genericQueries = { json: 1,
                            key: this.appId,
                            api_key: this.apiKey,
                          }

    this._evaluateEnvironment()
  }

  _evaluateEnvironment() {
    const { NODE_ENV } = process.env

    assert(NODE_ENV !== undefined, 'Please set your environment variable')
    assert(['home','remote','local'].includes(NODE_ENV), 'Choose an NODE_ENV variable of these types: home, remote || local')

    if (NODE_ENV === 'home') {
      this.baseUrl = `http://192.168.0.46:8081/sites/all/modules/civicrm/extern/rest.php`
      this.appId = '3b64052e5f03552fbb44d07677f21ad9'
    }
    if (NODE_ENV === 'remote') {
      this.baseUrl = `http://192.168.188.31/sites/all/modules/civicrm/extern/rest.php`
      this.appId = '0f4b43d1e6298c3f57f8cbfaafb764ae'
    }

    if (NODE_ENV === 'local') {
      this.baseUrl = `http://localhost:8081/sites/all/modules/civicrm/extern/rest.php`
      this.appId = '4276a76c2f8e0dd666e06ec3f1a80259'
    }
  }

  async getEntity(entity, query) {
    const action = 'get'
    assert(entity, 'an entity name has to be defined');
    const final = { ...{ action, entity }, ...this.genericQueries, ...query }
    return request.get(this.baseUrl).query(final)
  }

  async createEntity(entity, queries) {
    const action = 'create'
    assert(entity, 'an entity name has to be defined')
    const final = {...{ action, entity }, ...this.genericQueries, ...queries}
    return request.post(this.baseUrl).query(final)
  }
}