import Promise from 'bluebird'
import { isEmpty } from 'lodash'
import CrmApi from 'civicrm'

let configRemote = {}
let crmApi = {}

const setApiConfiguration = (config) => {
  configRemote = config
  crmApi = new CrmApi(configRemote);
}

function testApi(cb) {
  return crmApi.get('email', { id: 1, return: 'id, email'}, (result) => {
    if (isEmpty(result) || (result['is_error'] && result['is_error'] === 1)) return cb(false);
    return cb(true)
  })
}

function fetchUserForEmailPromisified(email) {
  return new Promise((resolve, reject) => {
    crmApi.get('Contact', { sequential: 1, 'email': email, return: 'id, display_name, email' }, (res) => {
      console.log('fetchUserForEmail', email)
      console.log('fetchUserForEmail', res.values)
      if (res.is_error) return reject(res);
      if (res.count > 0) return resolve(res.values[0].contact_id);
      if (res.count === 0) return resolve(0);
    })
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

async function createPromisified(name, payload) {
  return new Promise((resolve, reject) => {
    crmApi.create(name, payload, (res) => {
      if (res.is_error) return reject(res);
      return resolve(res)
    })
  })
} 

async function checkUser(email) {
  try {
    return await fetchUserForEmailPromisified(email);
  } catch(e) {
    console.log('ErrorinCheckUser');
    console.log(e);
    throw new Error('User Check failed')
  }
}

async function createEntity(name, payload) {
  try {
    return await createPromisified(name, payload)
  } catch(e) {
    console.log('ErrorinCreateEntity');
    console.log(e);
    throw new Error('Creation failed')
  }
}

const rest = {
  setApiConfiguration,
  testApi,
  fetchGroups,
  fetchTags,
  fetchPrefixes,
  fetchCountries,
  createEntity,
  checkUser,
}

export {
  rest
}