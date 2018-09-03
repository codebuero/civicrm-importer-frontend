import { groupPayload, tagPayload, parseInstrument, parseFinancialType } from './payload-rules'

const ImportService = {
  mapDataOnRuleset: function(data = [], ruleSet = {}) {
    return data.map(row => this._mapRowToRules(row, ruleSet));
  },
  addTagsAndGroups: function(data = [], groupId = 0, selectedTags = []) {
    return data.map(d => {
      let out = { ...d };

      if (groupId) {
        out = { 
          ...out,
          group: groupPayload(groupId),
        }
      }

      if (data['Spenden-Typ']) {

      }

      if (selectedTags.length) {
        out = { 
          ...out,
          tags: tagPayload(selectedTags),
        }        
      }
      
      return out;
    })
  },
  _mapRowToRules: function(row, ruleSet) {
    const keysToMatch = Object.keys(ruleSet);
    const out = {};

    debugger;

    keysToMatch.forEach((key) => {
      out[key] = ruleSet[key](row);
    });

    return out;
  }
};

export default ImportService;