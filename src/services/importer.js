import Promise from 'bluebird'
import { Set } from 'immutable'
import {
    isString,
    isFunction,
    isEmpty
} from 'lodash'
import {
    groupPayload,
    tagPayload,
    parseInstrument,
    parseFinancialType,
    getPayloadRules,
} from './payload-rules'
import {
    rest
} from './rest'

const PAYLOAD_ALLOW_LIST = [
    'address',
    'email',
    'email_work',
    'email_other',
    'contribution',
    'customValue',
    'group_contact',
    'entity_tag',
    'phone_work',
    'phone_mobile',
]

const log = console.log

class ImportService {
    constructor(rest) {
        if (isEmpty(rest)) throw Error('Provide a rest client')
        this.rest = rest
        this.importData = Set()
        this.countries = Set()
        this.prefixes = Set()
        this.groups = Set()
        this.tags = Set()

    } 
    async init() {
        try {
          const { prefixes = { values: [] }, countries = { values: [] } } = await Promise.props({ prefixes: this.rest.fetchPrefixes(), countries: this.rest.fetchCountries() })
          if (!prefixes.values.length || !countries.values.length) {
            throw new Error('No prefixes or countries found.')
          }
          this.prefixes = prefixes.values
          this.countries = countries.values
        } catch(e) {
          return console.error(e)
        }

    }
    addSelectedData(data, selectedRuleSet, selectedGroup, selectedTags) {
        console.log(data)
        const _mappedData = this.mapDataOnRuleset(data, selectedRuleSet, selectedGroup, selectedTags)
        console.log(_mappedData)
        this.importData = Set(_mappedData)
        return
    }
    mapDataOnRuleset(data = [], ruleSet = {}, groupId = 0, selectedTags = [], countries = []) {
        return data.map(row => this._mapRowToRules(row, ruleSet, groupId, selectedTags, countries));
    }
    _getCountryIdForFullCountryName(countryName) {
        const countryIds = {
            'Deutschland': '1082',
            'Belgien': '1020',
            'Dänemark': '1059',
            'Europäische Union': '1014',
            'Finnland': '1075',
            'Frankreich': '1076',
            'Irland': '1105',
            'Italien': '1107',
            'Kanada': '1039',
            'Luxemburg': '1126',
            'Österreich': '1014',
            'Mexiko': '1140',
            'Niederlande': '1152',
            'Polen': '1172',
            'Portugal': '1173',
            'Schweden': '1204',
            'Schweiz': '1205',
            'Senegal': '1188',
            'Singapur': '1191',
            'Spanien': '1198',
            'Vereinigte Arabische Emirate': '1225',
            'Vereinigte Staaten': '1228',
            'Vereinigtes Königreich': '1226',
        };
        return countryIds[countryName];
    }
    _getCountryIdForCountryISOCode(countryIsoCode, availableCountries) {
        const foundCountry = availableCountries.filter(c => c['iso_code'] === countryIsoCode)
        if (!foundCountry.length) return
        return foundCountry[0]['id']
    }
    _getCountryId(country, availableCountries) {
        if (!isString(country)) return

        if (country.length === 2) {
            return this._getCountryIdForCountryISOCode(country, availableCountries)
        }
        return this._getCountryIdForFullCountryName(country)
    }
    _enhanceWithGroupPayload(basePayload, groupId = 0) {
        if (!groupId) return basePayload

        return {
            ...basePayload,
            group_contact: groupPayload(groupId),
        }
    }
    _enhanceWithTagPayload(basePayload, selectedTags = []) {
        if (!selectedTags.length) return
        return {
            ...basePayload,
            entity_tag: tagPayload(selectedTags),
        }
    }
    _mapRowToRules(row, ruleSetTitle, groupId = 0, selectedTags, countries) {
        const countryId = this._getCountryId(row['Land'] ||  row['Country'], countries)

        let enhancedRow = {}

        enhancedRow = this._enhanceWithGroupPayload(enhancedRow, groupId)
        enhancedRow = this._enhanceWithTagPayload(enhancedRow, selectedTags)

        const ruleSet = getPayloadRules(ruleSetTitle)
        const keysToMatch = Object.keys(ruleSet)

        const reducer = (acc, key) => {
            const _o = { ...acc }
            const _r = ruleSet[key]({ ...row, countryId })

            //if (isEmpty(_r) || !isFunction(_r)) return _o
            _o[key] = _r 
            return _o
        }

        enhancedRow = keysToMatch.reduce(reducer, { ...enhancedRow })

        return enhancedRow;
    }
    _filterContent(k, data) {
        if (k === 'customValue') {
            if (!data['custom_1']) return false
            if (!data['custom_1'] && !data['custom_2']) return false
        }
        if (k === 'contribution') {
            if (data['total_amount'] < 0) return false
        }
        return true;
    }
    rejectWithEmail(emails = [], errors = []) {
        const err = new Error(`Couldnt create new account for email ${emails.join(',')}`)
        err.data = errors
        return Promise.reject(err);
    }
    _extractEmails(account) {
        const out = []
        const emailAliasRegex = /(email|email_)/ 

        Object.keys(account)
              .filter(key => emailAliasRegex.test(key) && isFunction(account[key]))
              .forEach(key => out.push(account[key]().email)) 

        return out
    }
    async _checkForAccountExistence(account) {
        let existingUserId = 0
        let knownEmails = this._extractEmails(account)
        for (let email of knownEmails) {
            try {
                existingUserId = await rest.checkIfEmailExists(email)
                break;
            } catch (e) {
                continue
            }
        }
        return {
            knownEmails,
            existingUserId
        }
    }
    async doImport(setProgress, makeDryRun = false) {
        var counter = 0
        const existing = []
        const errors = []

        try {
            for (let account of this.importData.values()) {
                counter++
                log(counter, account)
                const { knownEmails = [], existingUserId = 0 } = await this._checkForAccountExistence(account)

                if (existingUserId !== 0) {
                    existing.push({ knownEmails, contactId: existingUserId })
                }
                log('+++++++++++++++++++add contact data', log(Object.keys(account)))
                setProgress(counter, this.importData.size)
         
                
                // existence promise: if rejected, account does not exist. if resolved, it contains an id. 

                /*   const existingContactId = await account.exists()
                 *   
                 *   if (!existingContactId) return await account.create() - incl. all contact related entities and contributions
                 *   
                 *   account.setContactId(existingContactId)
                 *   await account.createContribution()
                 */

                if (!existingUserId) {
                    let organizationId
                    if (account['organization']) {
                        const organizationPayload = account['organization']
                        const {
                            is_error,
                            id: orgaId
                        } = await rest.createEntity('contact', organizationPayload)
                     
                        // we skip further creation of organition dependent entities
                        // if the organisation creation fails   
                        if (is_error || !orgaId) {
                            errors.push(new Error(`Organisation creation failed for ${knownEmails.join(',')}`))
                            continue
                        }
                        organizationId = orgaId
                    }

                    const contactPayload = account['contact'](organizationId)
                    const {
                        is_error,
                        id
                    } = await rest.createEntity('contact', contactPayload)

                    // we skip further creation of contact dependent entities
                    // if the contact creation fails
                    if (is_error || !id) {
                        errors.push(new Error(`Contact creation failed for ${knownEmails.join(',')}`))
                        continue
                    }

                    for (const k of PAYLOAD_ALLOW_LIST) {
                        // the tag payloads are in an array of functions, not only a function
                        if (!account[k]) continue
                        if (Array.isArray(account[k])) {
                            const payloadsWithContactId = account[k].map(p => p(id))
                            for (let p of payloadsWithContactId) {
                                const pRes = await rest.createEntity(k, p)
                                if (pRes.is_error) errors.push(pRes)
                            }
                        }
                        // all other payloads are a curried function where the payload is derived
                        // after calling the function with the id of the created contact
                        if (typeof account[k] === "function") {
                            if (isEmpty(account[k](id))) continue
                            const payloadWithContactId = account[k](id)
                            if (this._filterContent(k, payloadWithContactId)) {
                                const pRes = await rest.createEntity(k, payloadWithContactId)
                                if (pRes.is_error) errors.push(pRes)
                            }
                        }
                    }
                } 
                if (!account['contribution']) continue
                const payload = account['contribution'](existingUserId)
                const contributionExists = await rest.checkForExistingContribution(existingUserId, payload['total_amount'], payload['receive_date'])
                if (contributionExists) continue
                const pRes = await rest.createEntity('contribution', payload)
                if (pRes.is_error) errors.push(new Error(`Contribution creation failed for contactId ${existingUserId}`))
                
            }
        } catch (e) {
            console.error(e)
            errors.push(e)
        }

        return {
            existing,
            errors
        }
    }


}

export default ImportService;