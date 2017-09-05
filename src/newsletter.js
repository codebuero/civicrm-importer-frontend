#!/usr/bin/env node

const XLSX = require('xlsx')
const fs = require('fs')
const _ = require('lodash')

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
 ACCOUNT_DATA_OK,
} = require('./constants.js')

const baseDirectory = __dirname + '/../../import-daten'
const contactFileLocation = `${baseDirectory}/erweiterteKontakte_edit_20170824opwd.xlsx`

const contactFileOutputFilename = 'out.xlsx'
const newsletterOutputFilename = 'nl_out.xlsx'

const newsletterListLocation = `${baseDirectory}/newsletterlisten/ListeNewsletterDeutsch.xlsx`

const contactWorkbook = XLSX.readFile(contactFileLocation)
const contactRawSheet = contactWorkbook.Sheets[contactWorkbook.SheetNames[0]]
const contactSheet = XLSX.utils.sheet_to_json(contactRawSheet)

const newsletterWorkbook = XLSX.readFile(newsletterListLocation)
const newsletterRawSheet = newsletterWorkbook.Sheets[newsletterWorkbook.SheetNames[0]]
const newsletterSheet = XLSX.utils.sheet_to_json(newsletterRawSheet)

const log = console.log
const NL_EMAIL = 'E-Mail-Adresse'
const NL_TAG = 'Newsletter Deutsch'

contactSheet.forEach((c) => {
  const emailsToLookUp = _.compact([c[EMAIL_HOME], c[EMAIL_WORK]])
  log('checking emails', emailsToLookUp.toString())
  const foundInNL = newsletterSheet.filter(n => emailsToLookUp.includes(n[NL_EMAIL]))
  log('found in NL List', foundInNL.length)
  const currentGroupsIncludesNLTag = `${c[GROUP]}`.includes(NL_TAG)
  log('already have correct Tag', currentGroupsIncludesNLTag)
  if (!currentGroupsIncludesNLTag && foundInNL.length > 0) {
    let _g = c[GROUP] || ''
    _g = _.compact(_g.split(','))
    _g.push(NL_TAG)
    c[GROUP] = _g.join(',')
    log('updated user with Id', c[ID])
  }
})

const enhancedWs = XLSX.utils.json_to_sheet(contactSheet)

contactWorkbook.Sheets[contactWorkbook.SheetNames[0]] = enhancedWs

XLSX.writeFile(contactWorkbook, contactFileOutputFilename)