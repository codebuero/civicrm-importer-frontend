const request = require('superagent')

const HOST = '192.168.0.46'

module.exports = function (externalId, callback) {
  request
    .get('http://' + HOST + '/sites/all/modules/civicrm/extern/rest.php')
    .query({
      json: 1,
      key: '3b64052e5f03552fbb44d07677f21ad9',
      api_key: 'kreis',
      action: 'get',
      entity: 'contact',
      external_id: externalId
    })
    .end(function(err, result){
      callback(null, result.body)
    })
}