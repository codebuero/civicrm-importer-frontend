import React from 'react';
import PropTypes from 'prop-types';

const ErrorNotification = ({ apiAvailable, importRuns, importErrors }) => (
  <div>
  {!apiAvailable && 
    (<div className="notification is-danger alertbox">
      No API available with this configuration
    </div>)
  }
  {importRuns > 0 && importErrors.length === 0 && 
    (<div className="notification is-success alertbox">
      Finished without errors.
    </div>)
  }
  {importRuns > 0 && importErrors.length > 0 && 
    (<div>
      <div className="notification is-warning alertbox">
        Finished with errors, see console.
      </div>
      <div className="content">
        <ol style={{ fontSize: '16px', textAlign: 'left'}}>
          {importErrors.map((e, idx) => (<li key={idx}>{e.message}</li>))}
        </ol>
      </div>
    </div>)
  }
  </div>
)

ErrorNotification.propTypes = {
  apiAvailable: PropTypes.bool.isRequired,
  importRuns: PropTypes.number.isRequired,
  importErrors: PropTypes.arrayOf(PropTypes.instanceOf(Error))
}

ErrorNotification.displayName = 'ErrorNotification';

export default ErrorNotification