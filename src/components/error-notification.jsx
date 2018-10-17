import React from 'react';
import PropTypes from 'prop-types';

const ErrorNotification = ({ title, content = [], mode = 'is-success' }) => 
  (<div className={`notification ${mode} alertbox`}>
    {title}
    {content.length && (
      <div className="content">
        <ol style={{ fontSize: '16px', textAlign: 'left'}}>
          {content.map((e, idx) => (<li key={idx}>{e.message}</li>))}
        </ol>
      </div>)}
    </div>)

class ErrorNotificationHandler extends React.Component {
  static propTypes = {  
    apiAvailable: PropTypes.bool.isRequired, 
    importRuns: PropTypes.number.isRequired, 
    importErrors: PropTypes.array.isRequired,
  }

  constructor(props) {
    super(props)
    this.displayName = 'ErrorNotificationHandler'
  }

  render() {
    
      const { apiAvailable, importRuns, importErrors } = this.props
      return (
      <div>
      {!apiAvailable && (
        <ErrorNotification 
          title='No API available with this configuration' 
          mode='is-danger' 
        />
      )}
      {importRuns > 0 && importErrors.length === 0 && (
        <ErrorNotification 
          title='Finished without errors.' 
        />
      )}
      {importErrors.length > 0 && (
        <ErrorNotification
          mode='is-warning'
          title='Finished with errors, see console.'
          content={this.state.importErrors}
        />)
      }
      </div>)
  }
}



export default ErrorNotificationHandler