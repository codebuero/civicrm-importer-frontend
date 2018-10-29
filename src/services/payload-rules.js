import moment from 'moment'
import { get } from 'lodash'
import {
  CONTRIBUTION_SOURCE,
  CONTRIBUTION_TYPE,
  NEWSLETTER,
  TITLE,
  FIRSTNAME,
  LASTNAME,
  EMAIL,
  ADDRESS,
  CITY,
  COUNTRY_ID,
  ZIP,
  IBAN,
  BIC,
  AMOUNT,
  CONTRUBUTION_EXTERNAL_ID,
  DATE
} from './key-mapping'

const { EMAIL_1, EMAIL_2 } = { EMAIL_1: 'Email (1)', EMAIL_2: 'Email (2)'}

const PREFERRED_LANGUAGE_INTERNATIONAL_JOURNALISTS = 'en_GB'

function extractEmployerId(employerId) {
  if (employerId !== undefined || employerId !== 0 || employerId !== "0") {
    return employerId
  }
  return undefined
}

function parseInstrument(row){
  const source = row['Quelle']
  const sourceIdMap = {
    'Online (Wirecard/Kreditkarte)': 10,
    'Online (Wirecard/Lastschrift)': 9,
    'direkt / PayPal': 8,
    'Soforüberweisung': 7,
    'Offline-Spende': 3,
  }
  return sourceIdMap[source]
}

function parseFinancialType(row){
  const type = row['Spenden-Typ']

  const typeIdMap = {
    'Einzelspende': 1,
    'Dauererstspende': 5,
    'Dauerfolgespende': 5,
  }

  return typeIdMap[type]
}

function calculateTagsFromDonation(row, availableTags) {
  const type = row['Spenden-Typ'];

  if (!type) return [];

  const typeTagMap = {
    'Einzelspende': '',
    'Dauererstspende': 5,
    'Dauerfolgespende': 5,
  }

  return [tag]
}

const altrujaPayload = {
  contact: (row) => (employerId) => {
    const noContact = row['Kontakt erlaubt'] === 'Nein' ? 1 : 0;
    const prefixId = row['Anrede'] === 'Frau' ? 2 : 1;
    const genderId = row['Anrede'] === 'Frau' ? 1 : 2;

    const notificationRules = {
      do_not_mail: noContact,
      do_not_email: noContact,
      do_not_phone: noContact,
      is_opt_out: noContact,
      do_not_sms: noContact,
      do_not_trade: noContact,
    }

    const employer_id = extractEmployerId(employerId)

    return {
      contact_type: 'Individual',
      preferred_language: 'de_DE',
      first_name: row['Vorname'],
      last_name: row['Nachname'],
      prefix_id: prefixId,
      gender_id: genderId,
      employer_id,
      ...notificationRules,
    }

  },
  organization: (row) => {
    const noContact = row['Kontakt erlaubt'] === 'Nein' ? 1 : 0;
    const notificationRules = {
      do_not_mail: noContact,
      do_not_email: noContact,
      do_not_phone: noContact,
      is_opt_out: noContact,
      do_not_sms: noContact,
      do_not_trade: noContact,
    }

    if (row['Firma'] && row['Firma'].length) {
      return {
        contact_type: 'Organization',
        preferred_language: 'de_DE',
        organization_name: row['Firma'],
        ...notificationRules,
      }
    } 

    return;
  },
  email: (row) => (contactId = 0) => ({
    contact_id: contactId,
    email: row['Email'],
    location_type_id: 1,
    is_primary: 1,
  }),
  address: (row) => (contactId = 0) => ({
    contact_id: contactId,
    street_address: row['Strasse'],
    location_type_id: 1,
    is_primary: 1,
    city: row['Ort'],
    postal_code: row['Postleitzahl'],
    country_id: row['CountryId'],
  }),
  customValue: (row) => (contactId = 0) => ({
    entity_id: contactId,
    custom_1: row['IBAN'],
    custom_2: row['BIC']
  }),
  contribution: (row) => (contactId = 0) => ({ 
    contact_id: contactId,
    financial_type_id: parseFinancialType(row),
    payment_instrument_id: parseInstrument(row),
    receive_date: moment(row['Datum'], 'DD.MM.YYYY').startOf('day').format(),
    total_amount: row['Spendenbetrag'].replace(',',''),
    trxn_id: row['Spenden-ID'],
    currency: 'EUR',
    source: 'Altruja',
    contribution_status_id: 1,
  }),
}


const journalistsPayload = {
  contact: (row) => (employerId) => {
    const notificationRules = {
      do_not_mail: 0,
      do_not_email: 0,
      do_not_phone: 0,
      is_opt_out: 0,
      do_not_sms: 0,
      do_not_trade: 1,
    }

    const employer_id = extractEmployerId(employerId)

    const SPLIT_CHARACTER = ' '
    const first = get(row, 'Name (First Last)', '').trim().split(SPLIT_CHARACTER).slice(0, -1).join(' ')
    const last = get(row, 'Name (First Last)', '').trim().split(SPLIT_CHARACTER).slice(-1)[0] 
    const language = get(row, 'Preferred Language', PREFERRED_LANGUAGE_INTERNATIONAL_JOURNALISTS)
    const job_title = get(row, 'Position', undefined)

    return {
      contact_type: 'Individual',
      preferred_language: language,
      first_name: first,
      last_name: last,
      employer_id,
      job_title,
      ...notificationRules,
    }
  },
  organization: (row) => {
    const notificationRules = {
      do_not_mail: 0,
      do_not_email: 0,
      do_not_phone: 0,
      is_opt_out: 0,
      do_not_sms: 0,
      do_not_trade: 1,
    }

    const language = get(row, 'Preferred Language', PREFERRED_LANGUAGE_INTERNATIONAL_JOURNALISTS)

    if (row['Organisation'] && row['Organisation'].length) {
      return {
        contact_type: 'Organization',
        preferred_language: language,
        organization_name: row['Organisation'],
        ...notificationRules,
      }
    } 

    return;
  },
  address: (row) => (contactId) => {  
    return {
      contact_id: contactId,
      location_type_id: 2,
      is_primary: 1,
      country_id: row.countryId,    
    }
  },
  email_work: (row) => (contactId = 0) => ({
    contact_id: contactId,
    email: row['Email (1)'],
    location_type_id: 2,
    is_primary: 1,
  }),
  email_other: (row) => (contactId = 0) => {
    const email = get(row, 'Email (2)', '')
    if (!email) return {}
    return {
      contact_id: contactId,
      email,
      location_type_id: 4,
      is_primary: 0,
  }},
  phone_work: (row) => (contactId = 0) => {
    const phone = get(row, 'Phone (office, personal or newsdesk)', '')
    if (!phone) return {}
    return{
      contact_id: contactId,
      phone: phone,
      location_type_id: 2,
      phone_type_id: 1,
      is_primary: 1,
    }
  },
  phone_mobile: (row) => (contactId = 0) => {
    const phone = get(row, 'Phone (mobile or satellite)', '')
    if (!phone) return {}
    return {
      contact_id: contactId,
      phone: phone,
      location_type_id: 2,
      phone_type_id: 2,
      is_primary: 0,    
    }
  }
}


const supporterPayload = {
  contact: (row) => () => {
    const notificationRules = {
      do_not_mail: 0,
      do_not_email: 0,
      do_not_phone: 0,
      is_opt_out: 0,
      do_not_sms: 0,
      do_not_trade: 1,
      preferred_communication_method: 2,
    }

    const SPLIT_CHARACTER = ' '
    const first = get(row, 'Name (First Last)', '').trim().split(SPLIT_CHARACTER).slice(0, -1).join(' ')
    const last = get(row, 'Name (First Last)', '').trim().split(SPLIT_CHARACTER).slice(-1)[0] 

    return {
      contact_type: 'Individual',
      preferred_language: 'de_DE',
      first_name: first,
      last_name: last,
      ...notificationRules,
    }
  },
  email: (row) => (contactId = 0) => ({
    contact_id: contactId,
    email: row[EMAIL_1],
    location_type_id: 1,
    is_primary: 1,
  }),
}

const groupPayload = (groupId) => (contactId) => ({
  contact_id: contactId,
  group_id: groupId,
  status: 'Added'
})

const tagPayload = (tagIds = []) => 
  tagIds.map((tagId) => (contactId) => ({
    entity_table: 'civicrm_contact',
    entity_id: contactId,
    tag_id: tagId
  }))

const rules = {
  altruja: altrujaPayload,
  journalists: journalistsPayload,
  supporter: supporterPayload,
}


const getPayloadRules = (key) => {
  return rules[key]
}

export {
  altrujaPayload,
  journalistsPayload,
  supporterPayload,
  groupPayload,
  tagPayload,
  parseInstrument,
  parseFinancialType,
  getPayloadRules,
}