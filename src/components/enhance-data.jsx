import React from 'react';
import PropTypes from 'prop-types'

export default class EnhanceData extends React.Component {
  static propTypes = {
    next: PropTypes.func.isRequired,
  }

  render() {
    return (
      <section>
        <div className="fileUpload--container">
          <button className="btn" onClick={this.props.next}>Next Step</button>
        </div>
      </section>
    );
  }
}

