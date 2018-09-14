import React from 'react';
import PropTypes from 'prop-types'

export default class Import extends React.Component {
  static propTypes = {
    onStartImport: PropTypes.func.isRequired,
    onResetImport: PropTypes.func.isRequired,
    importing: PropTypes.bool.isRequired,
    importRuns: PropTypes.number.isRequired,
  }
  constructor(props) {
    super(props)

    this.startImport = this.startImport.bind(this);

    this.state = {
      loading: false,
      lastRunCount: props.importRuns
    }
  }
  startImport() {

  }
  render() {
    return (
      <section className="import content">
        {this.state.lastRunCount === this.props.importRuns && (
          <div>
            <progress className="progress is-success" value={this.props.progress} max="100">0</progress>
            <button disabled={this.props.importing} className="btn" onClick={this.props.onStartImport}>Begin Import</button>
          </div>
        )}
        {this.state.lastRunCount < this.props.importRuns && (<button className="btn" onClick={this.props.onResetImport}>Reset Importer</button>)}
      </section>
    );
  }
}

