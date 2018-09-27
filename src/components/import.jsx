import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class Import extends React.Component {
  static propTypes = {
    onStartImport: PropTypes.func.isRequired,
    onResetImport: PropTypes.func.isRequired,
    importing: PropTypes.bool.isRequired,
    importRuns: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props)

    this.displayName = 'Import';

    this.state = {
      loading: false,
      lastRunCount: props.importRuns
    }
  }

  render() {
    const btnClasses = classnames('button','is-fullwidth','is-info', { 'is-loading': this.props.importing})

    return (
      <section className="import content">
        {this.state.lastRunCount === this.props.importRuns && (
          <div>
            <progress className="progress is-success" value={this.props.progress} max="100">0</progress>
            <button className={btnClasses} onClick={this.props.onStartImport}>Begin Import</button>
          </div>
        )}
        {this.state.lastRunCount < this.props.importRuns && (
          <button 
            className="button is-success is-fullwidth" 
            onClick={this.props.onResetImport}
          >
            Reset Importer
          </button>)}
      </section>
    );
  }
}

