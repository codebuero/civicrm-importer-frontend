import React from 'react'
import PropTypes from 'prop-types'

import FileUploadInput from './file-upload-input'
import SelectData from './select-data'
import EnhanceData from './enhance-data'
import Import from './import'

import styles from '../styles/style.styl'

const FIRST_SELECTION = 'upload'

export default class CiviCrmImporter extends React.Component {
  constructor(props){
    super(props)
    this.onHeaderClick = this.onHeaderClick.bind(this);
    this.resetState = this.resetState.bind(this);
    this.state = this.resetState();
  }
  resetState() {
    return {
      data: {
        upload: {
          filename: '',

        }
      },
      ui: {
        selectedTopic: FIRST_SELECTION,
      },
      header: {
        topics: [
          {key:'upload',value:'Choose File'},
          {key:'select',value: 'Select & Match'},
          {key:'enhance',value:'Enhance'}, 
          {key:'import',value: 'Import'}
        ],
      }
    }
  }
  onHeaderClick(chosenTopic){
    if (this.state.ui.selectedTopic !== FIRST_SELECTION && chosenTopic === FIRST_SELECTION) {
      const confirmed = window.confirm('Alle Änderungen verwerfen')
      if (confirmed) {
        return this.setState(this.resetState())
      } 
    } else if (chosenTopic !== FIRST_SELECTION) {
      this.setState({
        ui: {
          selectedTopic: chosenTopic
        }
      })
    }
  }
  render() {
    const { store } = this.props
    return (
      <div className="container">
        <header>
          <h1>CiviCrm Importer</h1>
          <div className="breadcrumb">
            {this.state.header.topics.map(ht => (<a key={ht.key} onClick={() => this.onHeaderClick(ht.key)} className={`breadcrumb__step ${ht.key === this.state.ui.selectedTopic ? 'breadcrumb__step--active' : ''}`} href="#">{ht.value}</a>))}
          </div>
        </header>
        {this.state.ui.selectedTopic === 'upload' && (<FileUploadInput next={() => this.setState({ ui: { selectedTopic: 'select'}})}/>)}
        {this.state.ui.selectedTopic === 'select' && (<SelectData next={() => this.setState({ ui: { selectedTopic: 'enhance'}})}/>)}
        {this.state.ui.selectedTopic === 'enhance' && (<EnhanceData next={() => this.setState({ ui: { selectedTopic: 'import'}})}/>)}
        {this.state.ui.selectedTopic === 'import' && (<Import />)}
      </div>
    )
  }
}