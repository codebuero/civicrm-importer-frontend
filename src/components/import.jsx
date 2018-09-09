import React from 'react';
import PropTypes from 'prop-types'

export default class Import extends React.Component {
  static propTypes = {
    onStartImport: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props)

    this.startImport = this.startImport.bind(this);

    this.state = {
      loading: false,
    }
  }
  startImport() {

  }
  render() {
    return (
      <section className="import content">
        <progress className="progress is-success" value={this.props.progress} max="100">0</progress>
        <button className="btn" onClick={this.props.onStartImport}>Begin Import</button>
        {this.props.importing && (<button className="btn" onClick={this.props.onCancelImport}>Cancel Import</button>)}
      </section>
    );
  }
}

