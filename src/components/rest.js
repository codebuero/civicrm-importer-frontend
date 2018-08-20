import Promise from 'bluebird'

import CrmApi from 'civicrm'

const configRemote = {
  server:'http://localhost:8081',
  path:'/sites/all/modules/civicrm/extern/rest.php',
  key:'4276a76c2f8e0dd666e06ec3f1a80259',
  api_key:'kreis'
};

const crmApi = new CrmApi(configRemote);

function fetchGroups(cb) {
  return crmApi.get('group', {'options[limit]': 200,return: 'id,title,description'}, cb)
}

function fetchTags(cb) {
  return crmApi.get('tag', {'options[limit]': 200,return: 'id,name,description,parent_id'}, cb)
}

function fetchPrefixes(cb) {
  return crmApi.get('option_value', { option_group_id: 6,'options[limit]': 200,return: 'id,name'}, cb)
}

function fetchGender(cb) {
  return crmApi.get('option_value', { option_group_id: 3,'options[limit]': 200,return: 'id,name'}, cb)
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
  fetchGroups,
  fetchTags,
  fetchPrefixes,
  fetchGender,
}

export {
  rest
}