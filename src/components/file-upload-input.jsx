import React from 'react'
import PropTypes from 'prop-types'
import {observer} from 'mobx-react'
import Dropzone from 'react-dropzone'
import { Set } from 'immutable'

export default class FileUploadInput extends React.Component {
  constructor() {
    super()
    this.state = { files: Set() }
  }

  filterMimeTypes(fileList) {
    const filteredFiles = filesList.filter( f => {
      return true
    })
    return Set(filteredFiles)
  }

  onDrop(files) {
    //const newFiles = this.filterMimeTypes(files)
    const newFiles = Set(files)
    this.setState((prevState, props) => {
      return {
        files: prevState.files.merge(newFiles)
      }
    })
  }

  render() {
    return (
      <section>
        <div className="fileUpload--container">
          <div className="fileUpload--dropzone">
            <Dropzone onDrop={this.onDrop.bind(this)} className="dropzone-container">
              <p>Drag'n'Drop der zu importierenden Dateien hierauf oder einfach klicken und Dateien auswählen.</p>
            </Dropzone>
          </div>
          <div className="fileUpload--filelist">
            <h2>Dateien</h2>
            <ul>
              {
                this.state.files.map(f => <li key={f.name}>{f.name} </li>)
              }
            </ul>
          </div>
        </div>
      </section>
    );
  }
}
