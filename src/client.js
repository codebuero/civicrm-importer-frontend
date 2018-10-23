import CiviCrmImporter from './components/root'
import React from 'react'
import ReactDOM from 'react-dom'
import 'bulma/css/bulma.css'
import runtime from 'serviceworker-webpack-plugin/lib/runtime';
 
if ('serviceWorker' in navigator) {
  const registration = runtime.register();
}

const VERSION = "0.0.3"

const rootElement = document.getElementById('civicrm-importer-app')

ReactDOM.render(
  <CiviCrmImporter version={VERSION} />,
  rootElement
)

