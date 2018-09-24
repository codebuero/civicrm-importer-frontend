import CiviCrmImporter from './components/root'
import React from 'react'
import ReactDOM from 'react-dom'
import 'bulma/css/bulma.css'

const VERSION = "0.0.2"

const rootElement = document.getElementById('civicrm-importer-app')

ReactDOM.render(
  <CiviCrmImporter version={VERSION} />,
  rootElement
)

