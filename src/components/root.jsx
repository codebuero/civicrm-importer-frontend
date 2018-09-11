import React from 'react'
import PropTypes from 'prop-types'

import FileUploadInput from './file-upload-input'
import SelectData from './select-data'
import EnhanceData from './enhance-data'
import Import from './import'
import { rest } from '../services/rest'
import ImporterService from '../services/importer'

import styles from '../styles/style.styl'

const CONFIG_FILE_PATH = '/public/js/config.json';

const FIRST_SELECTION = 'upload';

const DEFAULT_STATE = {
  importing: false,
  progress: 0,
  importRuns: 0,
  importErrors: [],
  apiAvailable: false,
  data: {
    rulesSet: { 
      altruja: { 
        key: 'altruja', 
        description: 'For exports of altruja donation summaries',
        disabled: false,
        validator: () => {}
      },
      betterplace: { 
        key: 'betterplace', 
        description: 'For exports of betterplace donation summaries',
        disabled: true, 
        validator: () => {}
      },
      onlycontacts: {
        key: 'onlycontacts',
        description: 'A list of contacts without account data',
        disabled: true,
        validator: () => {}
      }
    }
  },
  prefixes: [],
  countries: [],
  ui: {
    nextEnabled: false,
    selectedTopic: FIRST_SELECTION,
    enabledHeaderTopics: ['upload']
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
    selectedTags: [],
    selectedGroup: 0,
  },
};

export default class CiviCrmImporter extends React.Component {
  constructor(props){
    super(props)
    this.enableNext = this.enableNext.bind(this);
    this.onHeaderClick = this.onHeaderClick.bind(this);
    this.resetState = this.resetState.bind(this);
    this.onNext = this.onNext.bind(this);
    this.selectGroup = this.selectGroup.bind(this);
    this.selectTags = this.selectTags.bind(this);
    this.enhanceNext = this.enableNext.bind(this);
    this.selectRule = this.selectRule.bind(this);
    this.selectFile = this.selectFile.bind(this);
    this.selectData = this.selectData.bind(this);
    this.cancelImport = this.cancelImport.bind(this);
    this.testApi = this.testApi.bind(this);

    this.startImport = this.startImport.bind(this);
    this.state = this.resetState();
  }

  componentDidMount() {
    fetch(CONFIG_FILE_PATH).then(response => {
      return response.json();
    }).then(json => {
      rest.setApiConfiguration(json)
      this.testApi();
    });
  }

  testApi() {
    rest.testApi(apiState => {
      if (!apiState) {
        return this.setState({
          apiAvailable: false
        })
      }
      this.setState({
        apiAvailable: true
      })
      rest.fetchPrefixes(data => {
        this.setState({
          prefixes: data.values,
        })
        rest.fetchCountries(data => {
          this.setState({
            countries: data.values,
          })
        })
      })
    })      
  }

  resetState() {
    return DEFAULT_STATE;
  }

  onHeaderClick(chosenTopic){
    if (!this.state.ui.enabledHeaderTopics.includes(chosenTopic)) return
    if (this.state.ui.selectedTopic !== FIRST_SELECTION && chosenTopic === FIRST_SELECTION) {
      const confirmed = window.confirm('Alle Änderungen verwerfen')
      if (confirmed) {
        return this.setState(this.resetState())
      } 
    } else if (chosenTopic !== FIRST_SELECTION) {
      this.setState({
        ui: {
          selectedTopic: chosenTopic,
          enabledHeaderTopics: this.state.ui.enabledHeaderTopics.concat([chosenTopic])
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
    this.setState(({ ...state, ui }) => ({ ...state, ui: { ...ui, selectedTopic: this.state.header.topics[newTopicIdx].key }}));
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
        selectedGroup: parseInt(groupId, 10),
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
  async startImport() {
    const { data, selectedRuleSet, selectedGroup, selectedTags } = this.state.importparameter;
    const importData = ImporterService.mapDataOnRuleset(data, selectedRuleSet, selectedGroup, selectedTags);

    let i = 0;
    for (let account of importData) {
      i++
      try {
        await ImporterService.doImport(account);
      } catch (e){
        console.log('error during import');
        console.log(e);
      }
      this.setState({
        progress: (i * 100) / importData.length,
      })
    }
  }
  cancelImport() {
    this.setState({
      importing: false,
    }); 
  }
  render() {
    const { store } = this.props

    return (
      <div className="container">
        <header>
          <h1>CiviCrm Importer</h1>
          <div className="breadcrumb">
            {this.state.header.topics.map(ht => 
              (<a 
                key={ht.key}
                disabled={!this.state.ui.enabledHeaderTopics.includes(ht.key)} 
                onClick={() => this.onHeaderClick(ht.key)}
                className={`breadcrumb__step button ${ht.key === this.state.ui.selectedTopic ? 'breadcrumb__step--active' : ''}`}
                href="#">{ht.value}</a>))
            }
          </div>
        </header>
        {this.state.importRuns > 0 && (<div className="notification is-success alertbox">
          Finished without errors.
        </div>)}
        {this.state.importRuns > 0 && this.state.importErrors.length > 0 && (<div>
          <div className="notification is-warning alertbox">
            Finished with errors.
          </div>
          <div className="content">
            <ul>
              {this.state.importErrors.map(e => (<li></li>))}
            </ul>
          </div>
        </div>)}
        {!this.state.apiAvailable && (<div className="notification is-danger alertbox">
          No API available with this configuration
        </div>)}
        {this.state.apiAvailable && (<div>
          {this.state.ui.selectedTopic === 'upload' && (
            <FileUploadInput 
              selectFile={this.selectFile}
              toggleNext={(mode) => this.setState(({ ui: { enableNext: mode, selectedTopic: 'upload', enabledHeaderTopics: this.state.ui.enabledHeaderTopics.concat(['select']) }}))}
              next={() => 
                this.setState(({ ...state, ui }) => ({ ...state, ui: { ...ui, enableNext: false, selectedTopic: 'select' }}))
              }
            />
          )}
          {this.state.ui.selectedTopic === 'select' && (
            <SelectData 
              rulesSet={this.state.data.rulesSet}
              selectRule={this.selectRule}
              parsedData={this.state.parsedData}
              selectData={this.selectData}
              toggleNext={(mode) => this.setState({ ui: { enableNext: mode, selectedTopic: 'select', enabledHeaderTopics: this.state.ui.enabledHeaderTopics.concat(['enhance'])}})}
              next={() => this.setState({ ui: { enableNext: false, selectedTopic: 'enhance'}})}
            />
          )}
          {this.state.ui.selectedTopic === 'enhance' && (
            <EnhanceData
              toggleNext={(mode) => this.setState({ ui: { enableNext: mode, selectedTopic: 'enhance', enabledHeaderTopics: this.state.ui.enabledHeaderTopics.concat(['import'])}})}
              next={() => this.setState({ ui: { enableNext: true, selectedTopic: 'import'}})}
              selectGroup={this.selectGroup}
              selectTags={this.selectTags}
            />
          )}
          {this.state.ui.selectedTopic === 'import' && (
            <Import 
              onStartImport={this.startImport}
              onCancelImport={this.cancelImport}
              importing={false}
              progress={this.state.progress}
            />
          )}

        <section className="section">
          {this.state.ui.selectedTopic !== 'import' && (<button 
            className="btn"
            disabled={!this.state.ui.enableNext}
            data-current-topic={this.state.ui.selectedTopic} 
            onClick={this.onNext}
          >
            Next Step
          </button>)}
        </section>
         </div>
        )}
      </div>
    )
  }
}