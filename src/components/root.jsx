import React from 'react'
import PropTypes from 'prop-types'

import FileUploadInput from './file-upload-input'
import SelectData from './select-data'
import EnhanceData from './enhance-data'
import Import from './import'
import { rest } from './rest'

import styles from '../styles/style.styl'

const FIRST_SELECTION = 'upload'

const DEFAULT_STATE = {
  data: {
    rulesSet: { 
      altruja: { 
        key: 'altruja', 
        description: 'For exports of altruja donation summaries',
        validator: () => {}
      },
      betterplace: { 
        key: 'betterplace', 
        description: 'For exports of betterplace donation summaries',
        validator: () => {}
      },
      onlycontacts: {
        key: 'onlycontacts',
        description: 'A list of contacts without account data',
        validator: () => {}
      }
    }
  },
  civicrm: {
    prefixes: []
  },
  ui: {
    nextEnabled: false,
    selectedTopic: FIRST_SELECTION,
  },
  header: {
    topics: [
      {key:'upload',value:'Choose File'},
      {key:'select',value: 'Select & Match'},
      {key:'enhance',value:'Enhance'}, 
      {key:'import',value: 'Import'}
    ],
  },
  parsedData: {},
  file: {},
  importparameter: {
    data: [],
    selectedRuleSet: '',
    selectedTags: []
  },
};

export default class CiviCrmImporter extends React.Component {
  constructor(props){
    super(props)
    this.onHeaderClick = this.onHeaderClick.bind(this);
    this.resetState = this.resetState.bind(this);
    this.onNext = this.onNext.bind(this);
    this.selectGroup = this.selectGroup.bind(this);
    this.selectTags = this.selectTags.bind(this);
    this.enhanceNext = this.enableNext.bind(this);
    this.selectRule = this.selectRule.bind(this);
    this.selectFile = this.selectFile.bind(this);
    this.selectData = this.selectData.bind(this);
    this.onSwitchToSelectData = this.onSwitchToSelectData.bind(this);

    this.startImport = this.startImport.bind(this);
    this.state = this.resetState();
  }

  componentDidMount() {
    rest.fetchPrefixes(data => {
      this.setState(state => ({
        ...state,
        civicrm: {
          prefixes: data.values,
        }
      }))
    })
  }

  resetState() {
    return DEFAULT_STATE;
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
  enableNext() {
    const { ui } = this.state;
    this.setState(state => ({
      ...state,
      ui: {
        ...ui,
        nextEnabled: true,
      }
    }))
  }
  onNext(e) {
    const currentTopic = e.target.dataset['currentTopic']; 
    const idx = this.state.header.topics.findIndex(t => t.key === currentTopic);
    const newTopicIdx = (idx < this.state.header.topics.length - 1) ? idx + 1 : 0; 
    this.setState({ ui: { selectedTopic: this.state.header.topics[newTopicIdx].key }});
  }
  selectFile(file, sheets) {
    const { importparameter } = this.state;
    return this.setState(state => ({
      ...state,
      parsedData: sheets,
      file,
    }))
  }
  selectData(key = Object.keys(this.state.parsedData)[0]) {
    const { importparameter } = this.state;
    return this.setState(state => ({
      ...state,
      importparameter: {
        ...importparameter,
        data: this.state.parsedData[key],
      }
    }))
  }
  selectRule(key) {
    const { importparameter } = this.state;
    this.setState(state => ({
      ...state,
      importparameter: {
        ...importparameter,
        selectedRuleSet: key,
      }
    }))
  }
  selectGroup(groupId) {
    const { importparameter } = this.state;
    this.setState(state => ({
      ...state,
      importparameter: {
        ...importparameter,
        selectedGroup: groupId,
      }
    }))
  }
  selectTags(tagId) {
    const { importparameter } = this.state;
    this.setState(state => ({
      ...state,
      importparameter: {
        ...importparameter,
        selectedTags: this.state.importparameter.selectedTags.concat(parseInt(tagId,10))
      }
    }))  
  }
  onSwitchToSelectData() {
    this.setState(state => ({ ...state, ui: { enableNext: false, selectedTopic: 'select'}}))
  }
  startImport() {
    console.log(this.state.importparameter);
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
        {this.state.ui.selectedTopic === 'upload' && (
          <FileUploadInput 
            selectFile={this.selectFile}
            toggleNext={(mode) => this.setState({ ui: { enableNext: mode, selectedTopic: 'upload'}})}
            next={this.onSwitchToSelectData}
          />
        )}
        {this.state.ui.selectedTopic === 'select' && (
          <SelectData 
            rulesSet={this.state.data.rulesSet}
            selectRule={this.selectRule}
            parsedData={this.state.parsedData}
            selectData={this.selectData}
            toggleNext={(mode) => this.setState({ ui: { enableNext: mode, selectedTopic: 'select'}})}
            next={() => this.setState({ ui: { enableNext: false, selectedTopic: 'enhance'}})}
          />
        )}
        {this.state.ui.selectedTopic === 'enhance' && (
          <EnhanceData
            toggleNext={(mode) => this.setState({ ui: { enableNext: mode, selectedTopic: 'enhance'}})}
            next={() => this.setState({ ui: { enableNext: true, selectedTopic: 'import'}})}
            selectGroup={this.selectGroup}
            selectTags={this.selectTags}
          />
        )}
        {this.state.ui.selectedTopic === 'import' && (<Import onStartImport={this.startImport}/>)}
        <section className="section">
          <button 
            className="btn"
            disabled={!this.state.ui.enableNext}
            data-current-topic={this.state.ui.selectedTopic} 
            onClick={this.onNext}
          >
            Next Step
          </button>
        </section>
      </div>
    )
  }
}