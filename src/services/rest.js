import Promise from 'bluebird'
import { isEmpty } from 'lodash'
import CrmApi from 'civicrm'

const configRemote = {
  server:'http://192.168.0.46:8081',
  path:'/sites/all/modules/civicrm/extern/rest.php',
  key:'3b64052e5f03552fbb44d07677f21ad9',
  api_key:'kreis'
};

const crmApi = new CrmApi(configRemote);

function testApi(cb) {
return crmApi.get('version', {return: 'tag,name,description'}, (err, result) => {
    if (err || isEmpty(result)) return cb(false);

    return cb(true)
  })

}

function fetchGroups(cb) {
  return crmApi.get('group', {'options[limit]': 200,return: 'id,title,description'}, cb)
}

function fetchTags(cb) {
  return crmApi.get('tag', {'options[limit]': 200,return: 'id,name,description,parent_id'}, cb)
}

function fetchPrefixes(cb) {
  return crmApi.get('option_value', { option_group_id: 6,'options[limit]': 200,return: 'id,name'}, cb)
}

function fetchCountries(cb) {
  return crmApi.get('country', {'options[limit]': 300, return: 'id, name'}, cb)
}
// const config = {
//   server:'http://example.org',
//   path:'/sites/all/modules/civicrm/extern/rest.php',
//   key:'your key from settings.civicrm.php',
//   api_key:'the user key'
// };

// const crmAPI = CrmApi(config);

// console.log(crmAPI);

const rest = {
  testApi,
  fetchGroups,
  fetchTags,
  fetchPrefixes,
  fetchCountries,
}

export {
  rest
}