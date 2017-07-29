import React from 'react'
import PropTypes from 'prop-types'
import {observer} from 'mobx-react'

import FileUploadInput from './file-upload-input'

@observer
export default class CiviCrmImporter extends React.Component {
  constructor(props){
    super(props)
  }
  componentWillMount(){
  }
  render() {
    const { store } = this.props
    return (
      <div className="container">
        <header className="">
          <h1>CiviCrm Importer</h1>
        </header>
        <FileUploadInput />
      </div>
    )
  }
}