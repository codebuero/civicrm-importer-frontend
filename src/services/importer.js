import Promise from 'bluebird'
import { groupPayload, tagPayload, parseInstrument, parseFinancialType, getPayloadRules } from './payload-rules'
import { rest } from './rest'

const ImportService = {
  mapDataOnRuleset: function(data = [], ruleSet = {}, groupId = 0, selectedTags = []) {
    
    const enhancedData = data.map(row => this._applyCountryId(row));
    const out = enhancedData.map(row => this._mapRowToRules(row, ruleSet, groupId, selectedTags));
  
    console.log('data->ruleset', out);
    return out
  },
  _applyCountryId: function(row) {
      const countryIds = {
        'Deutschland': '1082',
        'Belgien': '1020',
        'Europäische Union': '1014',
        'Finnland': '1075',
        'Frankreich': '1076',
        'Irland': '1105',
        'Kanada': '1039',
        'Luxemburg': '1126',
        'Österreich': '1014',
        'Polen': '1172',
        'Schweiz': '1205',
        'Vereinigte Staaten': '1228',
        'Vereinigtes Königreich': '1226',
      };

      return { ...row, CountryId: countryIds[row['country']]}
  },
  _mapRowToRules: function(row, ruleSetTitle, groupId, selectedTags) {
    let out = {
      emailAddress: row['email'],
    };

    if (groupId) {
      out = { 
        ...out,
        group_contact: groupPayload(groupId),
      }
    }

    if (selectedTags.length) {
      out = { 
        ...out,
        entity_tag: tagPayload(selectedTags),
      }        
    }

    const ruleSet = getPayloadRules(ruleSetTitle)
    const keysToMatch = Object.keys(ruleSet);
    keysToMatch.forEach((key) => {
      out[key] = ruleSet[key](row);
    });

    return out;
  },
  _filterContent: function(k, data) {
    if (k === 'customValue') {
      if (!data['custom_1']) return false
      if (!data['custom_1'] && !data['custom_2']) return false  
    }
    if (k === 'contribution') {
      if (data['total_amount'] < 0) return false
    }
    return true;
  }, 
  rejectWithEmail(email) {
    return Promise.reject(new Error(`Couldnt create new account for email ${email}`));
  },
  doImport: async function(account) {
      const existingUserId = await rest.checkUser(account.emailAddress)

      if (!existingUserId) {
        const contactPayload = account['contact'];

        const keys = Object.keys(account).filter(k => k !== 'contact');

        const { is_error, id } = await rest.createEntity('contact', contactPayload)

        if (is_error || !id) {
          return this.rejectWithEmail(account.email().email);
        }
        // ['address','email','contribution','customValue', 'group']

        for (const k of Array.from(['address','email','contribution','customValue', 'group_contact', 'entity_tag'])) {
          if (Array.isArray(account[k])) {
            const payloadsWithContactId = account[k].map(p => p(id))

            for(let p of payloadsWithContactId) {
              const pRes = await rest.createEntity(k, p)
              if (pRes.is_error) return this.rejectWithEmail(account.email().email);
            }
            continue;
          }

          if (typeof account[k] === "function") {
            const payloadWithContactId = account[k](id);
            if (this._filterContent(k, payloadWithContactId)) {
              const pRes = await rest.createEntity(k, payloadWithContactId)
              if (pRes.is_error) return this.rejectWithEmail(account.email().email);
            } 
          }
        }

      } else {
        const payload = account['contribution'](existingUserId)
        const contributionExists = await rest.checkForExistingContribution(existingUserId, payload['total_amount'], payload['receive_date'])
        if (!contributionExists) {
          const pRes = await rest.createEntity('contribution', payload)
          if (pRes.is_error) return Promise.reject(account);
        }
      }
      

      return Promise.resolve();
    }
};

export default ImportService;