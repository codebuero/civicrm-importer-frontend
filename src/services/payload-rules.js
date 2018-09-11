import moment from 'moment'
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

function parseInstrument(row){
  const source = row['source']
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
  const type = row['rectype']

  const typeIdMap = {
    'Einzelspende': 1,
    'Dauererstspende': 5,
    'Dauerfolgespende': 5,
  }

  return typeIdMap[type]
}

function calculateTagsFromDonation(row, availableTags) {
  const type = row['rectype'];

  if (!type) return [];

  const typeTagMap = {
    'Einzelspende': '',
    'Dauererstspende': 5,
    'Dauerfolgespende': 5,
  }

  return [tag]
}

const altrujaPayload = {
  contact: (row) => {
    const noContact = row['newsletter'] === 'Nein';
    const prefixId = row['anrede'] === 'Frau' ? 2 : 1;
    const genderId = row['anrede'] === 'Frau' ? 1 : 2;

    const notificationRules = {
      do_not_mail: !noContact ? 0 : 1,
      do_not_email: !noContact ? 0 : 1,
      do_not_phone: !noContact ? 0 : 1,
      is_opt_out: !noContact ? 0 : 1,
      do_not_sms: !noContact ? 0 : 1,
      do_not_trade: !noContact ? 0 : 1,
    }

    return {
      contact_type: 'Individual',
      preferred_language: 'de_DE',
      first_name: row['vorname'],
      last_name: row['nachname'],
      prefix_id: prefixId,
      gender_id: genderId,
      ...notificationRules,
    }
  },
  email: (row) => (contactId = 0) => ({
    contact_id: contactId,
    email: row['email'],
    location_type_id: 1,
    is_primary: 1,
  }),
  address: (row) => (contactId = 0) => ({
    contact_id: contactId,
    street_address: row['street'],
    location_type_id: 1,
    is_primary: 1,
    city: row['city'],
    postal_code: row['postcode'],
    country_id: row['CountryId'],
  }),
  customValue: (row) => (contactId = 0) => ({
    entity_id: contactId,
    custom_1: row['sl_iban'],
    custom_2: row['sl_bic']
  }),
  contribution: (row) => (contactId = 0) => ({ 
    contact_id: contactId,
    financial_type_id: parseFinancialType(row),
    payment_instrument_id: parseInstrument(row),
    receive_date: moment(row['datum'], 'DD.MM.YYYY').format(),
    total_amount: parseFloat(String(row['abetrag']).replace('.','').replace(',','.')),
    trxn_id: row['spende_id'],
    currency: 'EUR',
    source: 'Altruja',
    contribution_status_id: 1,
  }),
}


const onlycontactsPayload = {
  contact: () => {
    const prefixId = row['Titel'] === 'Frau' ? 2 : 1;
    const genderId = row['Titel'] === 'Frau' ? 1 : 2;

    const notificationRules = {
      do_not_mail: 0,
      do_not_email: 0,
      do_not_phone: 0,
      is_opt_out: 0,
      do_not_sms: 0,
      do_not_trade: 1,
    }

    return {
      contact_type: 'Individual',
      preferred_language: 'de_DE',
      first_name: row['Vorname'],
      last_name: row['Nachname'],
      prefix_id: prefixId,
      gender_id: genderId,
      ...notificationRules,
    }
  },
  address: () => {

  },
  email: () => {

  },
  phone: () => {

  },
  donation: () => {

  }
}

const groupPayload = (groupId) => (contactId) => ({
  contact_id: contactId,
  group_id: groupId,
  status: 'Added'
})

const tagPayload = (tagIds = []) => {
  return tagIds.map((tagId) => (contactId) => ({
    entity_table: 'civicrm_contact',
    entity_id: contactId,
    tag_id: tagId
  }))
}

const rules = {
  altruja: altrujaPayload,
  onlycontacts: onlycontactsPayload,
}


const getPayloadRules = (key) => {
  return rules[key]
}

export {
  altrujaPayload,
  onlycontactsPayload,
  groupPayload,
  tagPayload,
  parseInstrument,
  parseFinancialType,
  getPayloadRules,
}