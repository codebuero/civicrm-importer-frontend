#!/usr/bin/env node

const XLSX = require('xlsx')
const { OrderedSet } = require('immutable')
const _ = require('lodash')
const RestClient = require('./rest')
const program = require('commander')
const CSVParser = require('csvparser')
const fs = require('fs')
const util = require('util')
const moment = require('moment')
const csvwriter = require('csvwriter')
const crypto = require('crypto')
const parseDecimalNumber = require('parse-decimal-number')

const inspect = function(output) { console.log(util.inspect(output, false, null))}

const ExcelCiviCrmKeyMap = require('./excel_civicrm_keymap')

const DEFAULT_LANGUAGE = 'en_GB'

const MAXIMUM_RESULTS = 6000

const {
 ID,
 GENDER,
 TITLE,
 FIRST,
 LAST,
 ORGA,
 FUNCTION,
 OPT_OUT,
 EMAIL_WORK,
 EMAIL_HOME,
 DONATE_PLATTFORM,
 PHONE_WORK,
 MOBILE_HOME,
 PHONE_HOME,
 FAX,
 WEBSITE,
 POSTCODE,
 CITY,
 STREET,
 COUNTRY,
 BIRTH,
 GROUP,
 TAG,
 MEMBER,
 SOURCE,
 IBAN,
 BIC,
 ACCOUNT_DATA_OK
} = require('./constants.js')

const PREFIXES = []

const LANGUAGE_CODES = {
  'Deutschland': 'de_DE',
  'Österreich': 'de_DE',
  'UK': 'en_GB',
  'Belgien': 'nl_NL',
  'Frankreich': 'fr_FR',
  'Italien': 'it_IT',
  'Schweiz': 'de_DE',
  'Kanada': 'en_CA',
  'Irland': 'en_GB',
  'Niederlanden': 'nl_NL',
}

const GROUP_IDS = {
  'Pressevertreter*innen_BPK': 3,
  'Presseverteiler Englisch': 4,
  'Presseverteiler Deutsch': 5,
  'Presseverteiler Institutionen': 6,
  'Verteiler Seenotrettung': 7,
  'Ordentliches Mitglied': 8,
  'Vorstand': 9,
}

const TAG_IDS = {}

async function createInstitutionContact(contact, noExternalId = false) {
  console.log('creating Organization contactId:', contact[ID])

  const req = new RestClient()

  const resCheck = await req.getEntity('contact', { contact_type: 'Organization', organization_name: contact[ORGA]})

  if (resCheck && resCheck.body && resCheck.body.count && resCheck.body.count !== 0) {
    return Object.keys(resCheck.body.values)[0]
  }

  let query = {
    contact_type: 'Organization',
    do_not_sms: 1,
    do_not_trade: 1,
    organization_name: contact[ORGA],
  }
  query = (!noExternalId) ? { ...query, ...{ external_identifier: contact[ID] } } : query;

  const res = await req.createEntity('contact', query)
  return res.body.id
}

function preferredLanguage(contact) {
  if (contact[GROUP]) {
    if (contact[GROUP].includes('Englisch') ||
        contact[GROUP].includes('Verteiler Seenotrettung')) {
      return 'en_GB'
    }
    if (contact[GROUP].includes('Deutsch') ||
        contact[GROUP].includes('Pressevertreter*innen_BPK') ||
        contact[GROUP].includes('Presseverteiler Institutionen')) {
      return 'de_DE'
    }
  }

  if (contact[COUNTRY]) {
    if (contact[COUNTRY].includes('Deutschland') ||
      contact[COUNTRY].includes('Österreich')) {
      return 'de_DE'
    }
  }

  if (!contact[COUNTRY]) {
    return 'de_DE'
  }

  return DEFAULT_LANGUAGE
}

function calculateGenderId(contact) {
  if (contact[GENDER]) {
    const g = contact[GENDER].trim()
    return (g === 'Frau') ? 1 : 2
  }
}

async function getPrefixes() {
  const req = new RestClient()
  const q = {
    option_group_id: 6,
    'options[limit]': MAXIMUM_RESULTS,
  }
  const res = await req.getEntity('option_value', q)
  if (res.body.count && res.body.count > 0 && res.body.values) {
    for (const v in res.body.values) {
      PREFIXES[res.body.values[v].name] = res.body.values[v].value
    }
  }
  return
}

async function getTags() {
  const req = new RestClient()
  const res = await req.getEntity('tag')

  if (res.body.count && res.body.count > 0 && res.body.values) {
    for (const v of Object.values(res.body.values)) {
      TAG_IDS[v.name] = v.id
    }
  }

  return
}

async function getAllContactsWithIban() {
  let val = []

  let range = _.range(0, 5500, 500)

  for (let i of range) {
    const q = {
      entity: 'contact',
      json: `{"sequential":1,"api.CustomValue.get":{}}`,
      'options[offset]': i
    }
    const values = await getEntitiesBy(q)
    if (values) {
      val = val.concat(values)
    }
  }
  //
  console.log(val)
  console.log(`retrieved ${val.length} accounts`)
  return val
}

async function getEntitiesBy(query) {
  const req = new RestClient()
  const baseQuery = {
    'options[limit]': MAXIMUM_RESULTS,
  }

  const { entity } = query
  delete query.entity
  const res = await req.getEntity(entity, { ...baseQuery, ...query })

  return res.body.values
}

async function createPrefix(name) {
  console.log('creating prefix for title:', name)

  const q = {
    option_group_id: 6,
    name: name
  }

  const req = new RestClient()
  const res = await req.createEntity('option_value', q)

  if (res.body && res.body.values && res.body.count && res.body.count > 0) {
    const createdPrefix = res.body.values[Object.keys(res.body.values)[0]]
    PREFIXES[createdPrefix.name] = createdPrefix.value
    console.log('created prefix for title:', createdPrefix.name, ' id:', createdPrefix.value)
  }
  return
}

async function calculatePrefixId(contact) {
  if (contact[GENDER] && contact[TITLE]) {
    const prefix = `${contact[GENDER].trim()} ${contact[TITLE].trim()}`
    if (!PREFIXES[prefix]) {
      await createPrefix(prefix)
    }
    return PREFIXES[prefix]
  }
  if (contact[GENDER]) {
    const prefix = `${contact[GENDER].trim()}`
    if (PREFIXES[prefix]) {
      return PREFIXES[prefix]
    }
    await createPrefix(prefix)
    return PREFIXES[prefix]
  }
  return
}

async function createHouseholdContact(contact) {
  console.log('creating Household contactId:', contact[ID])

  let query = {
      contact_type: 'Household',
      do_not_sms: 1,
      do_not_trade: 1,
      external_identifier: contact[ID],
      preferred_language: preferredLanguage(contact),
      household_name: contact['household_name'],
  }
  const req = new RestClient()

  const contactResponse = await req.createEntity('contact', query)

  return contactResponse.body.id
}

async function createIndividualContact(contact, employerId = null, householdId = null, memberId = null) {
  let prefixId = await calculatePrefixId(contact)
  console.log('creating Individual contactId:', contact[ID],' with prefix id', prefixId)

  let extId = ''

  if (contact[ID]) {
    extId = (memberId) ? `${contact[ID]}_${memberId}` : contact[ID]
  }

  let query = {
    contact_type: 'Individual',
    do_not_sms: 1,
    do_not_trade: 1,
    external_identifier: extId,
    gender_id: calculateGenderId(contact),
    prefix_id: prefixId,
    first_name: contact[FIRST],
    last_name: contact[LAST],
    birth_date: contact[BIRTH],
    preferred_language: preferredLanguage(contact),
    job_title: contact[FUNCTION],
  }

  query = (employerId) ? { ...query, ...{ employer_id: employerId }} : query;

  if (contact[OPT_OUT] && contact[OPT_OUT].toLowerCase() === 'nein') {
    query['do_not_mail'] = 1
    query['do_not_email'] = 1
    query['do_not_phone'] = 1
  }

  const req = new RestClient()
  const contactResponse = await req.createEntity('contact', query)

  if (householdId) {
    const relationsQuery = {
      contact_id_a: contactResponse.body.id,
      contact_id_b: householdId,
      relationship_type_id: 8,
    }
    const householdRelationResponse = await req.createEntity('relationship', relationsQuery)
  }


  return contactResponse.body.id
}

async function createEmails(id, contact, workFirst = false) {
  console.log('creating emails contactId:', contact[ID], id)
  const req = new RestClient()
  if (contact[EMAIL_WORK]) {
    let workEmailQuery = {
      contact_id: id,
      email: contact[EMAIL_WORK],
      location_type_id: 2
    }
    workEmailQuery = (workFirst) ? { ...workEmailQuery, ...{ is_primary: 1 } } : workEmailQuery;
    await req.createEntity('email', workEmailQuery)
  }

  if (contact[EMAIL_HOME]) {
    let privateEmailQuery = {
      contact_id: id,
      email: contact[EMAIL_HOME],
      location_type_id: 1
    }
    privateEmailQuery = (!workFirst) ? { ...privateEmailQuery, ...{ is_primary: 1 } } : privateEmailQuery;
    await req.createEntity('email', privateEmailQuery)
  }
}

async function createWebsite(id, contact) {
  console.log('creating website external ContactId - internal ContactId:', contact[ID], ' - ', id)
  const req = new RestClient()
  if (contact[WEBSITE]) {
    let query = {
      contact_id: id,
      url: contact[WEBSITE],
      website_type_id: 1,
    }

    await req.createEntity('website', query)
  }
}

async function createPhones(id, contact, workFirst) {
  console.log('creating phones/fax external ContactId - internal ContactId:', contact[ID], ' - ', id)
  const req = new RestClient()
  if (contact[PHONE_WORK]) {
    let workPhoneQuery = {
      contact_id: id,
      phone: contact[PHONE_WORK],
      location_type_id: 2,
      phone_type_id: 1
    }
    workPhoneQuery = (workFirst) ? { ...workPhoneQuery, ...{ is_primary: 1 } } : workPhoneQuery;
    await req.createEntity('phone', workPhoneQuery)
  }

  if (contact[MOBILE_HOME]) {
    const mobilePhoneQuery = {
      contact_id: id,
      phone: contact[MOBILE_HOME],
      location_type_id: 1,
      phone_type_id: 2
    }
    await req.createEntity('phone', mobilePhoneQuery)
  }

  if (contact[PHONE_HOME]) {
    let homePhoneQuery = {
      contact_id: id,
      phone: contact[PHONE_HOME],
      location_type_id: 1,
      phone_type_id: 1
    }
    homePhoneQuery = (!workFirst) ? { ...homePhoneQuery, ...{ is_primary: 1 } } : homePhoneQuery;
    await req.createEntity('phone', homePhoneQuery)
  }

  if (contact[FAX]) {
    let faxQuery = {
      contact_id: id,
      phone: contact[FAX],
      location_type_id: 2,
      phone_type_id: 3,
    }

    await req.createEntity('phone', faxQuery)
  }
}

async function createAddress(id, contact, workPlace = false) {
  console.log('creating address external ContactId - internal ContactId:', contact[ID], ' - ', id)
  const req = new RestClient()
  const countryCodes = {
    'Australien': '1013',
    'Belgien': '1020',
    'Deutschland': '1082',
    'Großbritannien': '1226',
    'Kanada': '1039',
    'UK': '1226',
    'Schweiz': '1205',
    'Niederlande': '1152',
    'Italien': '1107',
    'Vereinigte Staaten': '1228',
    'USA': '1228',
    'Norwegen': '1161',
    'Israel': '1106',
    'Schottland': '1226',
    'Vereinigte Staaten von Amerika': '1228',
    'Spanien': '1198',
    'Österreich': '1014',
    'Niederlanden': '1152',
    'Südafrika': '1196',
    'Schweden': '1204',
    'Malta': '1134',
    'Rumänien': '1176',
    'Irland': '1105',
  }

  const countryCode = countryCodes[contact[COUNTRY]] || '1082'

  const processPostCode = function(postCode = '') {
    const _p = `${postCode}`.trim()
    return (postCode.length < 5) ? `0${postCode}` : postCode
  }

  const addressQuery = {
    contact_id: id,
    postal_code: processPostCode(contact[POSTCODE]),
    city: contact[CITY],
    street_address: contact[STREET],
    country_id: countryCode,
    location_type_id: (workPlace) ? 2 : 1,
  }

  await req.createEntity('address', addressQuery)
}

async function createBankAccount(id, contact) {
  console.log('creating bank data external ContactId - internal ContactId:', contact[ID], ' - ', id)
  const req = new RestClient()
  if (contact[IBAN]) {
    let ibanQuery = {
      entity_id: id,
      custom_1: contact[IBAN]
    }

    ibanQuery = (contact[BIC]) ? { ...ibanQuery, ...{ custom_2: contact[BIC] }} : ibanQuery

    await req.createEntity('customValue', ibanQuery)
  }
}

function parseMemberStates(memberStates) {
  let _o = []
  let _m = memberStates.split(',').map(g => g.trim())

  if (_m.length > 0) {
    (_m.includes('Ordentliches Mitglied')) ? _o.push(8):null;
  }
  return _o
}

function parseDonatePlatformStates(donationPlatform) {
  let platforms = donationPlatform.split(',').map(g => g.trim())
  return platforms
}

function parseNameField(name) {
  return name.split('+').map(n => n.trim())
}

async function parseHouseholdContact(row) {
  var him
  var her
  var household
  var hisResponseId
  var herResponseId
  var householdResponseId

  if (row[LAST]) {
    let lastNames = parseNameField(row[LAST])
    let firstNames = parseNameField(row[FIRST])


    if (lastNames.length === 2 && firstNames.length === 2) {
      household = _.clone(row)
      her = _.clone(row)
      him = _.clone(row)

      household[LAST] = ''
      household[FIRST] = ''
      household['household_name'] = lastNames.join(' + ')

      her[LAST] = lastNames[1]
      her[GENDER] = 'Frau'
      const herTitleName = firstNames[1].split(' ')

      if (herTitleName.length > 1) {
        her[TITLE] = herTitleName.slice(0, herTitleName.length - 1).join(' ')
        her[FIRST] = herTitleName[herTitleName.length - 1]
      } else {
        her[FIRST] = firstNames[1]
      }

      him[LAST] = lastNames[0]
      him[GENDER] = 'Herr'
      const hisTitleName = firstNames[0].split(' ')

      if (hisTitleName.length > 1) {
        him[TITLE] = hisTitleName.slice(0, hisTitleName.length - 1).join(' ')
        him[FIRST] = hisTitleName[hisTitleName.length - 1]
      } else {
        him[FIRST] = firstNames[0]
      }
      if (row[TITLE]) {
        him[TITLE] = row[TITLE]
      }
    }
    if (lastNames.length === 1 && firstNames.length === 2) {
      household = _.clone(row)
      her = _.clone(row)
      him = _.clone(row)

      household[LAST] = ''
      household[FIRST] = ''
      household['household_name'] = lastNames[0]


      her[LAST] = lastNames[0]
      her[GENDER] = 'Frau'
      her[TITLE] = ''
      const herTitleName = firstNames[1].split(' ')

      if (herTitleName.length > 1) {
        her[TITLE] = herTitleName.slice(0, herTitleName.length - 1).join(' ')
        her[FIRST] = herTitleName[herTitleName.length - 1]
      } else {
        her[FIRST] = firstNames[1]
      }

      him[LAST] = lastNames[0]
      him[GENDER] = 'Herr'
      const hisTitleName = firstNames[0].split(' ')

      if (hisTitleName.length > 1) {
        him[TITLE] = hisTitleName.slice(0, hisTitleName.length - 1).join(' ')
        him[FIRST] = hisTitleName[hisTitleName.length - 1]
      } else {
        him[FIRST] = firstNames[0]
      }
      if (row[TITLE]) {
        him[TITLE] = row[TITLE]
      }
    }
    if (lastNames.length === 2 && firstNames.length === 0) {
      household = _.clone(row)

      household[LAST] = ''
      household[FIRST] = ''
      household['household_name'] = lastNames.join(' + ')
    }
    if (lastNames.length === 1 && firstNames[0].trim() === '') {
      household = _.clone(row)

      household[LAST] = ''
      household[FIRST] = ''
      household['household_name'] = lastNames[0]
    }
    if (lastNames.length === 1 && firstNames.length === 0) {
      household[LAST] = ''
      household[FIRST] = ''
      household['household_name'] = lastNames[0]
    }
  }

  if (household) {
    householdResponseId = await createHouseholdContact(household)
  }

  if (her) {
    herResponseId = await createIndividualContact(her, null, householdResponseId, 1)
  }

  if (him) {
    hisResponseId = await createIndividualContact(him, null, householdResponseId, 2)
  }

  console.log(`created Household with ID ${householdResponseId} and her ID ${herResponseId} and his ID ${hisResponseId}`)

  return householdResponseId

}

async function createGroupMembership(contactId, groupId) {
  const req = new RestClient()
  const q = {
    contact_id: contactId,
    group_id: groupId,
    status: 'Added'
  }
  await req.createEntity('group_contact', q)
}

async function createTag(contactId, tagId) {
  const req = new RestClient()
  const q = {
    entity_table: 'civicrm_contact',
    entity_id: contactId,
    tag_id: tagId
  }
  await req.createEntity('entity_tag', q)
}

function parseGroupsField(contactId, contact) {
  let groupsAndTags = _.compact([contact[GROUP],contact[TAG],contact[MEMBER],contact[DONATE_PLATTFORM]])
  let groups = []
  let tags = []
  groupsAndTags = groupsAndTags.join(',').split(',').map(g => g.trim())
  console.log(`found ${groupsAndTags.length} potential groups and tags`)
  groupsAndTags.forEach(g => {
    if (Object.keys(GROUP_IDS).includes(g)) {
      return groups.push(GROUP_IDS[g])
    }
    if (Object.keys(TAG_IDS).includes(g)) {
      return tags.push(TAG_IDS[g])
    }
  })
  console.log(`found ${groups.length} groups and ${tags.length} tags`)
  return [groups, tags]
}

async function createGroupsAndTags(contactId, contact) {
  console.log('creating group and/or tag membership external ContactId - internal ContactId:', contact[ID], ' - ', contactId)
  if (contact[GROUP] || contact[TAG] || contact[MEMBER] || contact[DONATE_PLATTFORM]) {
    const [groupsToCreate, tagsToCreate] = parseGroupsField(contactId, contact)

    for (let g of groupsToCreate) {
      await createGroupMembership(contactId, g)
    }

    for (let t of tagsToCreate) {
      await createTag(contactId, t)
    }
  }
}

async function createContactGeneratedBy(contactId, contact) {
  console.log('creating contact reference external ContactId - internal ContactId:', contact[ID], ' - ', contactId)
  const req = new RestClient()
  const addedByQuery = {
    entity_id: contactId,
    custom_3: contact[SOURCE],
  }
  await req.createEntity('customValue', addedByQuery)
}

async function checkForContactExistence(id) {
  const req = new RestClient()
  const q = {
    external_identifier: id,
  }
  const res = await req.getEntity('contact', q)

  if (res && res.body && res.body.count && res.body.count > 0) {
    return true
  }

  return false
}

async function processRow(row) {
  let queries = []
  let contactId
  let employerId
  let householdId

  if (row[ORGA] && !row[FIRST] && !row[LAST]) {
    contactId = await createInstitutionContact(row)
    employerId = contactId
  }
  if (row[ORGA] && row[FIRST] && row[LAST] &&
      (!row[FIRST].includes('+') && !row[LAST].includes('+'))) {
    contactId = await createInstitutionContact(row, true)
    employerId = contactId
    //contactId = await createIndividualContact(row, contactId)
    await createIndividualContact(row, employerId)
  }

  if (!row[ORGA] && row[FIRST] && row[LAST] &&
     (row[FIRST].split('+').length > 1 || row[LAST].split('+').length > 1)) {
     householdId = await parseHouseholdContact(row)
  }

  if (!row[ORGA] && row[FIRST] && row[LAST] &&
     (!row[FIRST].includes('+') && !row[LAST].includes('+'))) {
     contactId = await createIndividualContact(row)
  }

  const id = contactId || householdId

  if (row[EMAIL_WORK] || row[EMAIL_HOME]) {
    await createEmails(id, row, employerId)
  }

  if (row[PHONE_WORK] || row[MOBILE_HOME] || row[PHONE_HOME] || row[FAX]) {
    await createPhones(id, row)
  }

  if (row[WEBSITE]) {
    await createWebsite(id, row)
  }

  if (row[POSTCODE] || row[STREET] || row[CITY] || row[COUNTRY]) {
    await createAddress(id, row, employerId)
  }

  if (row[IBAN] || row[BIC]) {
    await createBankAccount(id, row)
  }

  if (row[SOURCE]) {
    await createContactGeneratedBy(id, row)
  }

  if (row[GROUP] || row[TAG] || row[MEMBER] || row[DONATE_PLATTFORM]) {
    await createGroupsAndTags(id, row)
  }

  console.log(`finished extern: ${row[ID] || 'No externalId set'} - intern: ${id}`)
  console.log(`${row[ORGA] || 'No organisation set'} -  ${row[FIRST]} - ${row[LAST]}`)
  return
}

async function jobRowMainRoutine(row) {
  if (row[ID]) {
    const userExists = await checkForContactExistence(row[ID])

    if (!userExists) {
      await processRow(row)
    } else {
      console.log('User existiert bereits: ', row[ID])
    }
  } else {
    console.log('User has no external Id set, proceeding creation')
    await processRow(row)
  }
  return
}

function jobRowPressFilterRoutine(row) {
  // if (row[ID] === '787') {
  //   return true
  // }

  //filter specific ids that should be inserted manually
  if (['2246', '138', '2005', '2314', '3245'].includes(row[ID])) {
    return false
  }

  // if (Object.keys(row).includes(GROUP)) {
  //   let groups = row[GROUP].split(',').map(g => g.trim())

  //   return groups.includes('Pressevertreter*innen_BPK') ||
  //       groups.includes('Presseverteiler Englisch') ||
  //       groups.includes('Presseverteiler Deutsch') ||
  //       groups.includes('Presseverteiler Institutionen') ||
  //       groups.includes('Verteiler Seenotrettung')
  //  }

  // 2.
  // if (Object.keys(row).includes(DONATE_PLATTFORM)) {
  //   console.log(DONATE_PLATTFORM)
  //   let donatePlattform = row[DONATE_PLATTFORM].split(',').map(g => g.trim())
  //   return donatePlattform.includes('Betterplace') ||
  //     donatePlattform.includes('Altruja')
  // }

  // 3.
  return true
}

// console.log(process.argv[2])

//const testEntries = filteredEntries.filter(r => ['1010', '3979', '673'].includes(r[ID]))

async function parseCsvFile(filelocation) {
  const readFile = util.promisify(fs.readFile)
  const csvContent = await readFile(filelocation, 'utf8')
  const parser = new CSVParser(csvContent, { delimiter: ';'})
  return parser.json()
}

function enhancedContactsWithEmails(accounts, emails) {
  const emailContactIds = Object.keys(emails).map(emailId => ({emailId, contactId: emails[emailId].contact_id}))
  for( let id in accounts) {
    const foundEmails = emailContactIds.filter(emailContactId => id === emailContactId.contactId)
    accounts[id]['emails'] = foundEmails.map((foundEmail) => emails[foundEmail.emailId].email)
  }
  return accounts
}

const BETTERPLACE_AMOUNT = 'Spendenbetrag in Euro'
const ALTRUJA_AMOUNT = 'Spendenbetrag'
const BETTERPLACE_WHEN = 'Gespendet am'
const ALTRUJA_WHEN = 'Datum'
const BETTERPLACE_MAIL = 'E-Mail'
const ALTRUJA_MAIL = 'Email'
const EFT_WHEN = 'Valutadatum'
const EFT_AMOUNT = 'Betrag'
const EFT_TYPE = 'Spendentyp'

function enhanceContactsWithFoundContributions(accounts, statements, processor) {
  let unprocessedStatements = _.clone(statements)

  if (processor === 'betterplace' || processor === 'altruja') {
    for (let id in accounts) {
      let contributions = []
      for (let email of accounts[id]['emails']) {
        let foundInStatements = statements.filter(s => {
          if (processor === 'betterplace') {
            return s[BETTERPLACE_MAIL].toLowerCase() === email.toLowerCase()
          }
          if (processor === 'altruja') {
            return s[ALTRUJA_MAIL].toLowerCase() === email.toLowerCase()
          }
        })
        contributions = contributions.concat(foundInStatements)
      }
      accounts[id]['contributions'] = contributions

      for(let c of contributions) {
        const idToRemove = unprocessedStatements.findIndex(p => (c[BETTERPLACE_MAIL] === p[BETTERPLACE_MAIL] && c[BETTERPLACE_WHEN] === p[BETTERPLACE_WHEN]) ||
                                                                (c[ALTRUJA_MAIL] === p[ALTRUJA_MAIL] && c[ALTRUJA_WHEN] === p[ALTRUJA_WHEN]))
        unprocessedStatements = unprocessedStatements.splice(idToRemove, 1)
      }
    }
    console.log('unprocessedStatements')
    console.log(unprocessedStatements)
    console.log(unprocessedStatements.length)
    console.log('Accounts enhanced: ', Object.keys(accounts).length)
  }

  if (processor === 'eft') {
    for (let ac of accounts) {
      let contributions = []
      let toLookupIban = ac.iban
      let foundInStatements = statements.filter(s => {
        if (s['Kontonummer']) {
          return s['Kontonummer'] === toLookupIban
        }
        return false
      })
      contributions = contributions.concat(foundInStatements)

      ac.contributions = contributions

      for(let c of contributions) {
        const idToRemove = unprocessedStatements.findIndex(p => p['Valutadatum'] === c['Valutadatum'] && p['Kontonummer'] === c['Kontonummer'] && p['BLZ'] === c['BLZ'])
        unprocessedStatements = unprocessedStatements.splice(idToRemove, 1)
      }
    }


    console.log('unprocessedStatements')
    console.log(unprocessedStatements)
    console.log(unprocessedStatements.length)
    console.log('Accounts enhanced: ', Object.keys(accounts).length)
    return accounts
  }

  return accounts
}

async function addBetterplaceContributions(contactId, contributions) {
  const req = new RestClient()


  for (const con of contributions) {
    const q = {
      contact_id: contactId,
      financial_type_id: 1,
      payment_instrument_id: 5,
      receive_date: con[BETTERPLACE_WHEN],
      total_amount: con[BETTERPLACE_AMOUNT],
      currency: 'EUR',
      source: 'Betterplace',
      contribution_status_id: 1,
    }
    const res = await req.createEntity('contribution', q)

    console.log(`created contribution with id ${res.body.id} for contact ${contactId}`)
  }
  return
}

const canceldPayments = []

function parseInstrument(contribution){
  const source = contribution['Quelle']
  const sourceIdMap = {
    'Online (Wirecard/Kreditkarte)': 10,
    'Online (Wirecard/Lastschrift)': 9,
    'direkt / PayPal': 8,
    'Soforüberweisung': 7,
    'Offline-Spende': 3,
  }
  return sourceIdMap[source]
}

function parseFinancialType(contribution){
  const type = contribution['Spenden-Typ']

  const typeIdMap = {
    'Einzelspende': 1,
    'Dauererstspende': 5,
    'Dauerfolgespende': 5,
  }

  return typeIdMap[type]
}

async function addAltrujaContributions(contactId, contributions) {
  const req = new RestClient()

  for (const con of contributions) {
    if (['durchgefuehrt', 'Offline-Spende'].includes(con['Altruja Status'])) {
      const receiveDate = moment(con[ALTRUJA_WHEN], 'DD.MM.YY').format()
      const q = {
        contact_id: contactId,
        financial_type_id: parseFinancialType(con),
        payment_instrument_id: parseInstrument(con),
        receive_date: receiveDate,
        total_amount: con[ALTRUJA_AMOUNT],
        trxn_id: con['Spenden-ID'],
        currency: 'EUR',
        source: 'Altruja',
        contribution_status_id: 1,
      }
      const res = await req.createEntity('contribution', q)

      console.log(`created contribution with id ${res.body.id} from ${receiveDate} for contact ${contactId}`)
    } else {
      canceldPayments.push(con)
    }
  }

  return
}

async function addEftContributions(contactId, contributions) {
  const req = new RestClient()

  for (const con of contributions) {
    const receiveDate = moment(con[EFT_WHEN], 'DD.MM.YYYY').format()
    const q = {
      contact_id: contactId,
      financial_type_id: con[EFT_TYPE] || 1,
      payment_instrument_id: 5,
      receive_date: receiveDate,
      total_amount: con[EFT_AMOUNT],
      currency: 'EUR',
      source: 'Überweisung',
      contribution_status_id: 1,
    }
    const res = await req.createEntity('contribution', q)

    console.log(`created contribution with id ${res.body.id} from ${receiveDate} for contact ${contactId}`)
  }
  return true
}

async function eft(eftFileLocation = null, dry) {
  if (eftFileLocation) {

    const accountsWithIban = await getAllContactsWithIban()

    function contactMapper(contact) {
      let o = {}
      if (contact.id) {
        o.id = contact.id
      }
      if (contact['api.CustomValue.get'] &&
          contact['api.CustomValue.get'].count &&
          contact['api.CustomValue.get'].values &&
          contact['api.CustomValue.get'].values.findIndex(v => v["id"] === "1") > -1) {
        o.iban = contact['api.CustomValue.get'].values.filter(v => v["id"] === "1")[0]["0"]
        o.bic = contact['api.CustomValue.get'].values.filter(v => v["id"] === "2")[0]["0"]
      }
      return o
    }

    const contactIdIban = accountsWithIban.map(contactMapper).filter(ac => ac.iban)

    const statements = await parseCsvFile(eftFileLocation)

    const accounts = enhanceContactsWithFoundContributions(contactIdIban, statements, 'eft')

    let statementsOnAccount = 0
    if (!dry) {
      for (let ac of accounts) {
        statementsOnAccount += ac.contributions.length
        await addEftContributions(ac.id, ac.contributions)
      }
    }

    // console.log('canceld Altruja Payments', canceldPayments.length)
    // console.log(canceldPayments)
    console.log('Amount Statements added to Contacts', statementsOnAccount)
    console.log('Amount Statements EFT: ', statements.length)

  }
}

async function contacts(contactFileLocation, dry = false) {
  await getPrefixes()
  await getTags()

  console.log('found existing Prefixes')
  console.log(PREFIXES)

  const workbook = XLSX.readFile(contactFileLocation)
  const rawSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonSheet = XLSX.utils.sheet_to_json(rawSheet)

  console.log('Anzahl aller Kontakteinträge: ', jsonSheet.length)
  const filteredEntries = jsonSheet.filter(jobRowPressFilterRoutine)
  console.log('Anzahl gefilterter Einträge : ' + filteredEntries.length)

  if (!dry) {
    for (let row of filteredEntries) {
      await jobRowMainRoutine(row)
    }
  }
}

async function betterplace(betterplaceFileLocation, dry) {
  let accounts = await getEntitiesBy({ entity: 'contact', tag: 7 })
  const emails = await getEntitiesBy({ entity: 'email' })
  accounts = enhancedContactsWithEmails(accounts, emails)

  const statements = await parseCsvFile(betterplaceFileLocation)
  accounts = enhanceContactsWithFoundContributions(accounts, statements, 'betterplace')

  console.log(accounts)

  if (!dry) {
    for (let id in accounts) {
      await addBetterplaceContributions(id, accounts[id]['contributions'])
    }
  }
}

async function missingBetterplace(betterplaceStatements) {
  const emailEntities = await getEntitiesBy({ entity: 'email' })
  const allEmails = _.values(emailEntities).map(ee => ee.email.toLowerCase())
  const statements = await parseCsvFile(betterplaceStatements)

  console.log('Amount Statements found: ', statements.length)
  const leftStatements = statements.filter(s => !allEmails.includes(s['E-Mail'].toLowerCase()))
                                   .filter(s => s['Vorname'] !== 'Vorname')
  console.log(leftStatements)
  console.log('Number of unfound Emailaddress: ',leftStatements.length)
}

async function missingAltruja(altrujaStatements, statistics) {
  const altrujaContributions = await getEntitiesBy({ entity: 'contribution', json: '{"sequential":1,"source":"Altruja"}'})
  const existingTrxIds = altrujaContributions.map(ac => parseInt(ac.trxn_id))

  const statements = await parseCsvFile(altrujaStatements)

  const condition = s => { return ['SMS','Offline-Spende'].includes(s['Quelle']) || !existingTrxIds.includes(s['Spenden-ID']) || !['durchgefuehrt'].includes(s['Altruja Status'])}

  const leftStatements = statements.filter(condition)

  const csvOutput = await formatToCSVOutput(leftStatements)

  console.log(csvOutput)

  if (statistics) {
    console.log('Amount Altruja Contributions in Civi: ', existingTrxIds.length)
    console.log('Amount Statements found: ', statements.length)
    console.log('Number of unfound Contributions: ',leftStatements.length)
  }
}

function createHashFromString(stringToHash) {
  const md5sum = crypto.createHash('md5')
  md5sum.update(stringToHash)
  return md5sum.digest('hex')
}

async function calculateMissingEft(completesFile, foundsfile) {
  const completeStatements = await parseCsvFile(completesFile)
  const foundStatements = await parseCsvFile(foundsfile)

  const m = []

  const foundStatementsHash = []
  const completeStatementsHash = []

  function foundAttrToHash(fstate) {
    const o = `${fstate.iban}${fstate.currency}${fstate.total_amount}${moment(fstate.receive_date).format('DDMMYYYY')}`
    return o
  }

  foundStatements.forEach(fstate => {
    const s =  foundAttrToHash(fstate)
    //console.log(s)
    foundStatementsHash.push(s)
  })

  function completeAttrToHash(cstate) {
    let nn = parseDecimalNumber('' + cstate['Betrag'], {thousands:'',decimal:','})
    let complete = true
    if (!cstate['Kontonummer'] || !cstate['Waehrung'] || !nn) {
      complete = false
    }

    const o = `${cstate['Kontonummer']}${cstate['Waehrung']}${nn}${moment(cstate['Valutadatum'], 'MM/DD/YY').format('DDMMYYYY')}`
    return {
      o,
      complete
    }
  }

  completeStatements.forEach(cstate => {
    const { o, complete } =  completeAttrToHash(cstate)
    //console.log(o)
    if (!complete) {
      m.push(cstate)
    } else {
      if (!foundStatementsHash.includes(o)) {
        m.push(cstate)
      }
    }
  })

  const c = completeStatementsHash

  const f = foundStatementsHash

  console.log('amount complete statements', completeStatements.length)
  console.log('amount found statements', foundStatements.length)
  console.log('amount complete statement hashs ', c.length)
  console.log('amount found statement hashs ', f.length)

  console.log('already incomplete statements', m.length)

  csvwriter(m,{delimiter: ';'}, (err, csv) => fs.writeFileSync('missing_eft.csv', csv))

}

async function missingEft(eftStatements, statements, dry) {
  const CUSTOM_KEY = 'api.CustomValue.get'
  const CONTRIB_KEY = 'api.Contribution.get'

  const eftContributions = await getEntitiesBy({ entity: 'contribution', json: '{"sequential":1,"source":"Überweisung"}'})

  let contributionsWithContactAndIban = []

  for (let i = 0; i < eftContributions.length; i++ ) {
    let contrib = eftContributions[i]

    let contactPayload = {
      entity: 'contact',
      id: contrib['contact_id'],
      json: '{"sequential":1,"api.CustomValue.get":{}}'
    }
    let contact = await getEntitiesBy(contactPayload)

    console.log('retrieving contact', contrib['contact_id'])

    if (contact[0]) {
      contributionsWithContactAndIban.push({
        contactId: contrib['contact_id'],
        iban: contact[0][CUSTOM_KEY].values.filter(customValue => customValue.id === '1')[0]['0'],
        total_amount: contrib['total_amount'],
        receive_date: contrib['receive_date'],
        contribution_id: contrib['contribution_id'],
        currency: contrib['currency'],
        financial_type: contrib['financial_type'],
        payment_instrument: contrib['payment_instrument'],
      })
    } else {
      console.log('no contact found for contribution', contrib.id)
    }
  }
//  const contacts = await getEntitiesBy({ entity: 'contact', json: '{"sequential":1,"api.Contribution.get":{},"api.CustomValue.get":{}}'})

  // const eftFilter = con => con.contribution_source === 'Überweisung'

  // const contactFilter = c => {
  //   return c[CONTRIB_KEY].count > 0 &&
  //   c[CONTRIB_KEY].values.filter(eftFilter).length > 0 &&
  //   c[CUSTOM_KEY].count > 0 &&
  //   c[CUSTOM_KEY].values.filter(customValue => customValue.id === '1').length > 0
  // }

  // const contributionMapper = contact => {
  //   const o = Object.create(null)

  //   o.contactId = contact.contact_id
  //   o.contributions = contact[CONTRIB_KEY].values.filter(eftFilter)
  //   o.iban = contact[CUSTOM_KEY].values.filter(customValue => customValue.id === '1')[0]['0']
  //   return o
  // }


  // const contactsWithContributions = contacts.filter(contactFilter)
  //                                           .map(contributionMapper)

  // console.log('contacts total',contacts.length)
  // console.log('contactsWithContributions',contactsWithContributions.length)
  // let contributionCount = 0
  // contactsWithContributions.forEach(cc => contributionCount += cc.contributions.length)
  // console.log('contributionCount on contacts', contributionCount)
  // console.log('eftContributions total',eftContributions.length)
  // console.log('group by contact id', Object.keys(_.groupBy(eftContributions, 'contact_id')).length)
  // const contactIdsOnContributions = Object.keys(_.groupBy(eftContributions, 'contact_id'))
  // const contactIdsWithContributions = contactsWithContributions.map(cc => cc.contactId)

  // const contributionsWithContactAndIban = []

  // contactsWithContributions.forEach(c => {
  //   const { contactId, iban } = c
  //   c.contributions.forEach(con => {
  //     const {
  //       total_amount: amount,
  //       receive_date: date,
  //       contribution_id: contributionId,
  //       currency,
  //       financial_type: type,
  //       payment_instrument: instrument,
  //     } = con
  //     contributionsWithContactAndIban.push({ contactId, iban, amount, currency, date, contributionId, type, instrument})
  //   })
  // })


  // console.log('cIds @ both',_.intersection(contactIdsOnContributions, contactIdsWithContributions).length)
  // console.log('cIds @ either or', _.xor(contactIdsOnContributions, contactIdsWithContributions).length)
  // console.log('cIds @ either or', _.xor(contactIdsOnContributions, contactIdsWithContributions))

  if (!dry) {
    csvwriter(contributionsWithContactAndIban,{delimiter: ';'}, (err, csv) => fs.writeFileSync('found_eft_contributionwise.csv', csv))
  }
}

async function formatToCSVOutput(json) {
  return new Promise((resolve, reject) => {
    csvwriter(json, (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  })
}

async function altruja(altrujaFileLocation, dry) {
  let accounts = await getEntitiesBy({ entity: 'contact', tag: 6 })
  const emails = await getEntitiesBy({ entity: 'email' })
  accounts = enhancedContactsWithEmails(accounts, emails)

  const rawStatements = await parseCsvFile(altrujaFileLocation)
  const statements = rawStatements.filter(s => !['SMS', 'Offline-Spende'].includes(s['Quelle']))

  accounts = enhanceContactsWithFoundContributions(accounts, statements, 'altruja')

  let statementsOnAccount = 0
  if (!dry) {
    for (let id in accounts) {
      statementsOnAccount += accounts[id]['contributions'].length
      await addAltrujaContributions(id, accounts[id]['contributions'])

    }
  }
  console.log('canceld Altruja Payments', canceldPayments.length)
  console.log(canceldPayments)
  console.log('Amount Statements added to Contacts', statementsOnAccount)
  console.log('Amount Statements Altruja: ', statements.length)
}

async function calculatePeriodSupporter(fileLocation, dry) {
  const bpFile = await parseCsvFile(fileLocation)

  const periodSupporter = bpFile.filter(bpc => bpc['Einzelspende/Dauerspende'] === 'Dauerspende')
  console.log(periodSupporter.length)

  const contactServer = await getEntitiesBy({ entity: 'contact' })
  const bpServer = await getEntitiesBy({ entity: 'contribution', json: '{"sequential":1,"source":"Betterplace"}'})

  const betterplaceDonator = []

  bpServer.forEach(bpc => {
    let cId = bpc.contact_id
    contact = contactServer[cId]
    betterplaceDonator.push({ c: contact, d: bpc })
  })

  const donIds = []
  const missingDonIds = []

  for (let i = 0; i < periodSupporter.length; i++) {
    let current = periodSupporter[i]
    let existingDonation = betterplaceDonator.filter(b => {
      return b.c.email === current['E-Mail'] &&
        parseDecimalNumber('' + b.d.total_amount, {thousands:'',decimal:'.'})  === parseDecimalNumber('' + current['Spendenbetrag in Euro'], {thousands:'.',decimal:','}) &&
        moment(b.d.receive_date).format('DD-MM-YYYY') === moment(current['Gespendet am']).format('DD-MM-YYYY')
    })

    if (existingDonation.length > 0) {
      donIds.push(parseInt(existingDonation[0].d.id))
    } else {
      missingDonIds.push(current)
    }
  }

  //inspect(donIds.join(','))
  inspect(missingDonIds)
  inspect(missingDonIds.length)
}

async function calculatePeriodSupporterEft(filelocation, dry) {
  const eftFile = await parseCsvFile(filelocation)

  const periodSupporter = eftFile.filter(bpc => bpc['Buchungstext'].toLowerCase() === 'DAUERAUFTRAG'.toLowerCase())
  const unique = _.uniqBy(periodSupporter, ps => ps['Beguenstigter/Zahlungspflichtiger'].toLowerCase())


  unique.forEach(ps => {
    inspect(`${ps['Beguenstigter/Zahlungspflichtiger'].toLowerCase()},${ps['Kontonummer']}`)
  })
}

async function checkForIbanExistence(iban) {
  const rest = new RestClient()

  const { body: { count, values} } = await rest.getEntity('contact', { json: JSON.stringify({ "sequential":1,"return":"id","custom_1": iban })})
  if (count > 0) {
    return values[0]['contact_id']
  }
  return false
}

const contributionKeys = [
  '20.07.2016',
  '31.08.2016',
  '30.09.2016',
  '04.11.2016',
  '30.11.2016',
  '30.12.2016',
  '31.01.2017',
  '28.02.2017',
  '30.03.2017',
  '28.04.2017',
  '31.05.2017',
  '30.06.2017',
  '31.07.2017',
  '31.08.2017'
]

async function importCollectedContributions(contactFilePath, schemeFilePath) {
  try {
    const eftFile = await parseCsvFile(contactFilePath)
    const rest = new RestClient()

    for (let i = 0; i < eftFile.length; i++) {
      const entry = eftFile[i]
      const iban = entry[IBAN]
      const name = entry[LAST]
      const contactId = await checkForIbanExistence(iban)
      if (iban && contactId) {
        const contributions = []
        for (const date of contributionKeys) {
          if (entry[date]) {
            const contributionParams = {
              [EFT_WHEN]: date,
              [EFT_TYPE]: 5,
              [EFT_AMOUNT]: entry[date]
            }
            contributions.push(contributionParams)
          }
        }
        await addEftContributions(contactId, contributions)
      } else {
        console.log(`no contact found for IBAN ${iban}, NAME ${name}`)
      }   
    } 
    return   

  } catch (e) {
    console.error(e)
  }
}

program
  .version('0.1.0')
  .option('-C, --contacts [loc]', 'file location for contacts', '')
  .option('-a, --altruja [loc]', 'file location for altruja statements', '')
  .option('-b, --betterplace [loc]', 'file location for betterplace statements', '')
  .option('-e, --eft [loc]', 'file location for bank statements', '')
  .option('-d, --dry', 'dry run file analysis', false)
  .option('-mb, --missingBetterplace [loc]', 'print out not imported betterplace cons', '')
  .option('-ma, --missingAltruja [loc]', 'print out not imported altruja cons', '')
  .option('-me, --missingEft [loc]', 'print out not imported eft cons', '')
  .option('-s, --statistics', 'print further statistics', false)
  .option('-c, --calculateMissingEft', 'calculate missing efts', false)
  .option('-f, --foundEft [loc]', 'already persisted Eft', '')
  .option('-cd, --calculatePeriodSupporter [loc]', 'find betterplace contributions that are period supporter', '')
  .option('-ce, --calculatePeriodSupporterEft [loc]', 'find eft contributions that are period supporter', '')
  .option('-cod, --importCollectedContributions [loc]', 'import collected contributions', '')
  .option('-sch, --importScheme [loc]', 'path to the import scheme (mandatory)', '')
  .parse(process.argv)

if (program.contacts) {
  return contacts(program.contacts, program.dry)
}

if (program.betterplace) {
  return betterplace(program.betterplace, program.dry)
}

if (program.altruja) {
  return altruja(program.altruja, program.dry)
}

if (program.eft) {
  return eft(program.eft, program.dry)
}

if (program.missingBetterplace) {
  return missingBetterplace(program.missingBetterplace, program.statistics)
}

if (program.missingAltruja) {
  return missingAltruja(program.missingAltruja, program.statistics)
}

// if (program.missingEft) {
//   return missingEft(program.missingEft, program.statistics, program.dry)
// }

if (program.calculateMissingEft) {
  console.log(program.missingEft, program.foundEft)
  return calculateMissingEft(program.missingEft, program.foundEft)
}

if (program.calculatePeriodSupporter) {
  return calculatePeriodSupporter(program.calculatePeriodSupporter, program.dry)
}

if (program.calculatePeriodSupporterEft) {
  return calculatePeriodSupporterEft(program.calculatePeriodSupporterEft, program.dry)
}

if (program.importCollectedContributions) {
  return importCollectedContributions(program.importCollectedContributions, program.importScheme)
}