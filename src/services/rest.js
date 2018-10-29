import Promise from 'bluebird'
import {
    isEmpty
} from 'lodash'
import CrmApi from 'civicrm'

let configRemote = {}
let crmApi = {}

const setApiConfiguration = (config) => {
    configRemote = config
    crmApi = new CrmApi(configRemote);
}

const loadApiConfiguration = () => {
    return fetch(IMPORTER_CONFIG_FILE_PATH).then(response => {
        return response.json();
    }).then(json => {
        setApiConfiguration(json)
        Promise.resolve()
    })
}

function testApi(cb) {
    return new Promise((resolve, reject) => {
        crmApi.get('email', {
            id: 1,
            return: 'id, email'
        }, (result) => {
            if (isEmpty(result) || (result['is_error'] && result['is_error'] === 1)) return reject(new Error('Api not available'))
            return resolve()
        })
    })

}

function checkIfEmailExists(email = '') {
    const _email = email.toLowerCase();
    return new Promise((resolve, reject) => {
        crmApi.get('email', {
            sequential: 1,
            'email': _email,
            return: 'id, contact_id'
        }, (res) => {
            if (res.is_error) return reject(new Error(res.error_message));
            if (res.count === 0) return reject(new Error(`Email ${email} not found.`));
            if (res.count > 0) return resolve(res.values[0].contact_id);
        })
    })
}

function fetchContributionPromisified(contactId, amount, date) {
    return new Promise((resolve, reject) => {
        crmApi.get('contribution', {
            sequential: 1,
            contact_id: contactId,
            total_amount: amount,
            receive_date: date,
            return: 'id'
        }, (res) => {
            if (res.is_error) return reject(new Error(res.error_message));
            if (res.count > 0) return resolve(true);
            if (res.count === 0) return resolve(false);
        })
    })
}

function fetchEntity(name = '', options = {}) {
    return new Promise((resolve, reject) => {
        crmApi.get(name, options, (res) => {
            if (res && res.is_error) return reject(new Error(res.error_message));
            return resolve(res)
        })
    })
}

function fetchGroups() {
    return fetchEntity('group', {
        'options[limit]': 200,
        return: 'id,title,description'
    });
}

function fetchTags() {
    return fetchEntity('tag', {
        'options[limit]': 200,
        return: 'id,name,description,parent_id'
    });
}

function fetchPrefixes() {
    return fetchEntity('option_value', {
        option_group_id: 6,
        'options[limit]': 200,
        return: 'id,name'
    });
}

function fetchCountries() {
    return fetchEntity('country', {
        'options[limit]': 300,
        return: 'id, name, iso_code'
    })
}

async function create(name, payload) {
    return new Promise((resolve, reject) => {
        crmApi.create(name, payload, (res) => {
            if (res.is_error) return reject(new Error(res.error_message));
            return resolve(res)
        })
    })
}

async function createEntity(name = '', payload) {
    const entitiesToTest = /(email|phone)/
    const _name = (entitiesToTest.test(name)) ? name.split('_')[0] : name
    try {
        return await create(_name, payload)
    } catch (e) {
        throw new Error('Creation failed for ' + _name + ' with payload ' + JSON.stringify(payload))
    }
}

async function checkForExistingContribution(contactId, amount, date) {
    try {
        return await fetchContributionPromisified(contactId, amount, date);
    } catch (e) {
        throw new Error('Contribution check failed')
    }
}

const rest = {
    loadApiConfiguration,
    setApiConfiguration,
    testApi,
    fetchGroups,
    fetchTags,
    fetchPrefixes,
    fetchCountries,
    createEntity,
    checkIfEmailExists,
    checkForExistingContribution
}

export {
    rest
}