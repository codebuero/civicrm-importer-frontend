import React from 'react'
import PropTypes from 'prop-types'
import { Set } from 'immutable'

import FileUploadInput from './file-upload-input'
import SelectData from './select-data'
import EnhanceData from './enhance-data'
import Import from './import'
import NavigationBar from './navigation-bar'
import ErrorNotificationHandler from './error-notification'
import { rest } from '../services/rest'
import ImporterService from '../services/importer'

import styles from '../styles/style.styl'

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
        options: [
          "calculateGroupFromNewsletterAndSite": false,
          "calculateTagsFromContributionType": false,
        ],
      },
      onlycontacts: {
        key: 'onlycontacts',
        description: 'A list of contacts without account data',
        disabled: true,
      }
    }
  },
  prefixes: [],
  countries: [],
  ui: {
    enableNext: false,
    selectedTopic: FIRST_SELECTION,
    enabledHeaderTopics: Set(['upload'])
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
    selectedTags: [],
    selectedGroup: 0,
  },
  selectedRuleSet: '',
};

export default class CiviCrmImporter extends React.Component {
  static propTypes = {
    version: PropTypes.string.isRequired,
  } 

  constructor(props){
    super(props)

    this.enableNext = this.enableNext.bind(this);
    this.onHeaderClick = this.onHeaderClick.bind(this);
    this.resetState = this.resetState.bind(this);
    this.next = this.next.bind(this);
    this.selectGroup = this.selectGroup.bind(this);
    this.selectTags = this.selectTags.bind(this);
    this.enhanceNext = this.enableNext.bind(this);
    this.selectRule = this.selectRule.bind(this);
    this.selectFile = this.selectFile.bind(this);
    this.selectData = this.selectData.bind(this);
    this.resetImport = this.resetImport.bind(this);
    this.initialRequest = this.initialRequest.bind(this);

    this.startImport = this.startImport.bind(this);
    this.state = this.resetState();
  }

  async componentDidMount() {
    try {
      await rest.loadApiConfiguration()
    } catch(e) {
      console.error('Error on App Initialization');
      return console.error(e)
    }

    try {
      await this.initialRequest();
    } catch(e) {
        console.error('Error on initial request');
        console.error(err)
    }
  }

  async initialRequest() {
    try {
      await rest.testApi() 
      return this.setState({
        apiAvailable: true,
      })
    } catch(e) {
      return this.setState({
        apiAvailable: false
      })
    }

    let prefixes, countries = []

    try {
      const { prefixes, countries } = await Promise.props({ prefixes: rest.fetchPrefixes(), countries: rest.fetchCountries() })
      if (!prefixes.values.length || !countries.values.length) {
        throw new Error('No prefixes nor countries found.')
      }
    } catch(e) {
      return console.error(e)
    }

    this.setState({
      prefixes: prefixes.values,
      countries: countries.values
    })

  }

  resetState() {
    return DEFAULT_STATE;
  }

  async onHeaderClick(chosenTopic){
    if (!this.state.ui.enabledHeaderTopics.includes(chosenTopic)) return
    if (this.state.ui.selectedTopic !== FIRST_SELECTION && chosenTopic === FIRST_SELECTION) {
      const confirmed = window.confirm('Alle Änderungen verwerfen')
      if (confirmed) {
        this.setState(this.resetState())
        await this.initialRequest()
        return;
      } 
    } else if (chosenTopic !== FIRST_SELECTION) {
      this.setState(state => ({
        ...state,
        ui: {
          enabledHeaderTopics: state.ui.enabledHeaderTopics,
          selectedTopic: chosenTopic,
          enableNext: false
        }
      }))
    }
  }
  enableNext() {
    const { ui } = this.state;

    this.setState(state => ({
      ...state,
      ui: {
        ...ui,
        enableNext: true,
      }
    }))
  }
  next(e) {
    const currentTopic = e.target.dataset['currentTopic']; 
    const idx = this.state.header.topics.findIndex(t => t.key === currentTopic);
    const newTopicIdx = (idx < this.state.header.topics.length - 1) ? idx + 1 : 0; 
    this.setState(({ ...state, ui }) => ({ 
      ...state, 
      ui: { 
        ...ui, 
        selectedTopic: this.state.header.topics[newTopicIdx].key,
        enableNext: false,
      }})
    );
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
    return this.setState(state => ({
      ...state,
      selectedRuleSet: key,
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
    this.setState({
      importing: true,
    })

    const { selectedRuleSet } = this.state;
    const { data, selectedGroup, selectedTags } = this.state.importparameter;
    const importData = ImporterService.mapDataOnRuleset(data, selectedRuleSet, selectedGroup, selectedTags);

    let i = 0;
    const errors = [];

    for (let account of importData) {
      i++
      try {
        console.log('doing import for ', account.emailAddress)
        await ImporterService.doImport(account);
        console.log('done successful import for ', account.emailAddress)
      } catch (e){
        errors.push(e);
      }
      this.setState({
        progress: (i * 100) / importData.length,
      })
    }

    this.setState({
      importRuns: this.state.importRuns + 1,
      importing: false, 
      importErrors: errors,
    })
  }
  resetImport() {
    this.setState(this.resetState())
    this.initialRequest()
  }
  render() {
    return (
      <div className="container">
        <NavigationBar 
          topics={this.state.header.topics}
          enabledHeaderTopics={this.state.ui.enabledHeaderTopics}
          onHeaderClick={this.onHeaderClick}
          selectedTopic={this.state.ui.selectedTopic}
          version={this.props.version}
        />
        <ErrorNotificationHandler
          apiAvailable={this.state.apiAvailable}
          importRuns={this.state.importRuns}
          importErrors={this.state.importErrors}
        />
        {this.state.apiAvailable && (<div>
          {this.state.ui.selectedTopic === 'upload' && (
            <FileUploadInput 
              selectFile={this.selectFile}
              toggleNext={(mode) => this.setState(({ ui: { enableNext: mode, selectedTopic: 'upload', enabledHeaderTopics: this.state.ui.enabledHeaderTopics.add('select') }}))}
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
              toggleNext={(mode) => {
                let newEnabledTopics
                if (mode) {
                  newEnabledTopics = this.state.ui.enabledHeaderTopics.add('enhance')
                } else {
                  newEnabledTopics = this.state.ui.enabledHeaderTopics.remove('enhance')
                }
                
                this.setState({ 
                  ui: { 
                    enableNext: mode, 
                    selectedTopic: 'select', 
                    enabledHeaderTopics: newEnabledTopics
                  }
                }
              )}}
              next={() => this.setState({ ui: { enableNext: false, selectedTopic: 'enhance'}})}
            />
          )}
          {this.state.ui.selectedTopic === 'enhance' && (
            <EnhanceData
              toggleNext={(mode) => this.setState({ ui: { enableNext: mode, selectedTopic: 'enhance', enabledHeaderTopics: this.state.ui.enabledHeaderTopics.add('import')}})}
              next={() => this.setState({ ui: { enableNext: true, selectedTopic: 'import'}})}
              selectGroup={this.selectGroup}
              selectTags={this.selectTags}
            />
          )}
          {this.state.ui.selectedTopic === 'import' && (
            <Import 
              onStartImport={this.startImport}
              onResetImport={this.resetImport}
              importing={this.state.importing}
              importRuns={this.state.importRuns}
              progress={this.state.progress}
            />
          )}
        <section className="section">
          {this.state.ui.selectedTopic !== 'import' && (<button 
            className="button is-fullwidth is-info"
            disabled={!this.state.ui.enableNext}
            data-current-topic={this.state.ui.selectedTopic} 
            onClick={this.next}
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