import UIStore from './stores/ui-store'
import CiviCrmImporter from './components/root'
import React from 'react'
import ReactDOM from 'react-dom'

const uiStore = new UIStore()
const rootElement = document.getElementById('civicrm-importer-app')

ReactDOM.render(
  <CiviCrmImporter store={uiStore} />,
  rootElement
)

