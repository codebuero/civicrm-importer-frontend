import React from 'react';
import PropTypes from 'prop-types'

export default class SelectData extends React.Component {
  static propTypes = {
    parsedData: PropTypes.object,
    next: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      rulesSet: [
        { 
          key: 'altruja', 
          description: 'For exports of altruja donation summaries',
          validator: () => {}
        },
        { 
          key: 'betterplace', 
          description: 'For exports of betterplace donation summaries',
          validator: () => {}
        },
      ]
    }
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

