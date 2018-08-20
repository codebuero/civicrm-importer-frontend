
const altrujaPayload = {
  contact: (contactType = '', extId = '', lang = '', gender = '', birthDate = '', jobTitle = '',title = '', firstName = '', lastName = '', noContact = false) => {
    const notificationRules = {
      ['do_not_mail']: !noContact ? 0 : 1,
      ['do_not_email']: !noContact ? 0 : 1,
      ['do_not_phone']: !noContact ? 0 : 1,
      ['is_opt_out']: !noContact ? 0 : 1,
      ['do_not_sms']: !noContact ? 0 : 1,
      ['do_not_trade']: !noContact ? 0 : 1,
    }

    return {
      ...notificationRules,
      ['external_identifier']: extId,
      ['contact_type']: contactType,
      ['preferred_language']: 'de_DE',
      ['first_name']: firstName,
      ['last_name']: lastName,
      ['prefix_id']: title,
      ['gender_id']: gender,
      ['birth_date']: birthDate,
      ['job_title']: jobTitle,
    }
  },
  email: (contactId = 0, email = '', isPrimary = 0, locationTypeId = 1) => ({
    ['contact_id']: contactId,
    email: email,
    ['location_type_id']: locationTypeId,
  }),
  address: (contactId = 0, streetAddress = '', locationTypeId = 1, isPrimary = 1, city = '', postalCode = '', countryId = '1082') => ({
    ['contact_id']: contacId,
    ['street_address']: streetAddress,
    ['location_type_id']: locationTypeId,
    ['is_primary']: isPrimary,
    city,
    ['postal_code']: postalCode,
    ['country_id']: countryId,
  }),
  phone: (contactId = 0, number = '', isPrimary = 0, locationTypeId = 1, phoneTypeId = 1) => ({
      ['contact_id']: contactId,
      phone: number,
      ['is_primary']: isPrimary,
      ['location_type_id']: locationTypeId,
      ['phone_type_id']: phoneTypeId,
  }),
  donation: (contactId = '', amount = '', extId = '', date) => ({
    ['contact_id']: contactId,
    amount: amount,
    transaction_id: extId,
    date: date,
  }),
}


const onlycontactsPayload = {

}

export {
  altrujaPayload,
  onlycontactsPayload
}