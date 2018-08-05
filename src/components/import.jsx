import React from 'react';
import PropTypes from 'prop-types'

export default class Import extends React.Component {
  static propTypes = {
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
      <section>
        <div className="fileUpload--container">
          <button className="btn" onClick={this.startImport}>Start Import</button>
        </div>
      </section>
    );
  }
}

