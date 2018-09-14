import React from 'react';
import PropTypes from 'prop-types'
import { rest } from '../services/rest'

export default class EnhanceData extends React.Component {
  static propTypes = {
    selectGroup: PropTypes.func.isRequired,
    selectTags: PropTypes.func.isRequired,
    toggleNext: PropTypes.func.isRequired,
    next: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.displayName = 'EnhanceData';

    this.onGroupSelectionChange = this.onGroupSelectionChange.bind(this);
    this.onTagSelectionChange = this.onTagSelectionChange.bind(this);

    this.state = {
      loading: false,
      availableGroups: [],
      availableTags: [],
    }
  }
  componentDidMount(){
    this.setState({ loading: true })

    Promise.all([rest.fetchGroups(), rest.fetchTags()])
           .then(([groups, tags]) => {
              this.setState(state => ({
                ...state,
                availableGroups: groups.values,
                loading: false,
                availableTags: tags.values,
              }))           
           }) 
           .catch(err => {
              console.error(err)
           })
  }

  onSelectGroup() {

  }

  onSelectTag() {

  }

  onGroupSelectionChange(e) {
    this.props.selectGroup(e.target.value)
  }
  onTagSelectionChange(id) {
    this.props.selectTags(id)
  }

  render() {
    return (
      <section className="enhancedata content section">   
        {this.state.loading && (<span>Loading Groups & Tags</span>)}
        {!this.state.loading && (<div>
          <div className="container groupselection">
            <div className="field">
              <label className="label">
                Select Group 
              </label>
              <div className="control" style={{ width: '100%' }}>
                <div className="select is-large is-multiple">
                  <select onChange={this.onGroupSelectionChange}>
                    <option key={0} value="0">Choose 1 Group the Contact will be added too.</option>
                    {this.state.availableGroups.map(r => (<option key={r.id} value={r.id}>{r.id + ' - ' + r.title}</option>))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="container tagselection" style={{ marginTop: '4vh' }}>
            <label className="label">
              Select Tags (multiselect possible) 
            </label>
            <div className="field" style={{ height: '49vh', overflow: 'auto' }}>
              <table className="table is-bordered is-fullwidth is-hoverable">
                <thead>
                  <tr>
                    <th></th>
                    <th>Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.availableTags.map(r => 
                    (<tr key={`${r.id}-tr`}>
                      <td key={`${r.id}-check`}>
                        <input 
                          type="checkbox" 
                          onChange={() => this.onTagSelectionChange(r.id)}
                        />
                      </td>
                      <td 
                        key={`${r.id}-tag`} 
                      >
                        <span>{r.id + ' - ' + r.name}</span>
                        <br />
                        <span className="bottom">{r.description}</span>
                      </td>
                    </tr>
                    )
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>)}
      </section>);
  }
}

