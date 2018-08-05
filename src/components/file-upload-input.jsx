import React from 'react'
import PropTypes from 'prop-types'
import {observer} from 'mobx-react'
import Dropzone from 'react-dropzone'
import _ from 'lodash'
import { Set } from 'immutable'

export default class FileUploadInput extends React.Component {
  static propTypes = {
    next: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.onDrop = this.onDrop.bind(this);
    this.state = { file: { name: '' } };
  }

  onDrop(files) {
    const file = files[0];

    var fileAsBinaryString = '';
    const reader = new FileReader();
    reader.onabort = () => console.log('file reading was aborted');
    reader.onerror = () => console.log('file reading has failed');
    reader.onload = () => {
        fileAsBinaryString = reader.result;
        this.setState((prevState, props) => {
          return {
            file,
            fileBinary: fileAsBinaryString
          }
        })
    };
    reader.readAsArrayBuffer(file);
  }

  render() {
    return (
      <section>
        <div className="fileUpload--container">
          <div className="fileUpload--dropzone">
            <Dropzone onDrop={this.onDrop.bind(this)} className="dropzone-container">
              {!this.state.file.name && (<p>
                <span>Drag'n'Drop File into Field</span><br />
                <span>or</span><br />
                <span>Click Field for Upload Dialog</span>
                </p>)}
              {this.state.file.name && 
                (<p><span key={this.state.file.name}>{this.state.file.name} </span></p>)}
            </Dropzone>
          </div>
          <button className="btn" disabled={_.isEmpty(this.state.file) ? 'disabled' : ''} onClick={this.props.next}>Next Step</button>
        </div>
      </section>
    );
  }
}
