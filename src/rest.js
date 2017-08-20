const request = require('superagent')
const assert = require('assert')

module.exports = class RestClient {
  constructor() {
    this.baseUrl = 'http://192.168.0.46:8081/sites/all/modules/civicrm/extern/rest.php'
    //this.appId = '4276a76c2f8e0dd666e06ec3f1a80259'
    this.appId = '3b64052e5f03552fbb44d07677f21ad9'
    this.apiKey = 'kreis'

    this.genericQueries = { json: 1,
                            key: this.appId,
                            api_key: this.apiKey,
                          }
  }

  async getEntity(entityName, query) {
    assert(entityName, 'an entity name has to be defined');
    const final = { ...this.genericQueries, ...{ action: 'get', entity: entityName }, ...query }
    return request.get(this.baseUrl).query(final)
  }

  async createEntity(entityName, queries) {
    assert(entityName, 'an entity name has to be defined')
    const final = {...this.genericQueries, ...{ action: 'create', entity: entityName }, ...queries}
    return request.post(this.baseUrl).query(final)
  }
}