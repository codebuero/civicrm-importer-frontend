import React from 'react'
import PropTypes from 'prop-types'
import Dropzone from 'react-dropzone'
import _ from 'lodash'
import XLSX from 'xlsx'

const ACCEPTED_MIME_TYPES = "application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export default class FileUploadInput extends React.Component {
  static propTypes = {
    selectFile: PropTypes.func.isRequired,
    toggleNext: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.displayName = 'FileUploadInput';

    this.handleFile = this.handleFile.bind(this);
    this.state = { file: { name: '' }, isLoadingFile: false };
  }

  handleFile(files) {
    this.props.toggleNext(false);
    const file = files[0];

    const reader = new FileReader();
    const isBinaryString = !!reader.readAsBinaryString

    reader.onloadstart = (e) => {
      this.setState({
        isLoadingFile: true
      })
    }

    reader.onloadend = (e) => {
        const bstr = e.target.result;
        const options = {
          type: isBinaryString ? 'binary' : 'array'
        };
        const workbook = XLSX.read(bstr, options);
        const sheets = {};
        workbook.SheetNames.forEach(name => {
          sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        });
        this.setState({
          file, 
          isLoadingFile: false
        });
        this.props.selectFile(file, sheets);
        this.props.toggleNext(true);
    };

    reader.readAsBinaryString(file);
  }

  render() {
    return (
      <section className="upload content">
            <Dropzone 
              onDropAccepted={this.handleFile} 
              className="dropzone-container"
              accept={ACCEPTED_MIME_TYPES}
            >
              {!this.state.file.name && !this.state.isLoadingFile && (
                <p>
                  <span>Drag'n'Drop File into Field</span><br />
                  <span>or</span><br />
                  <span>Click Field for Upload Dialog</span>
                </p>)
              }
              {this.state.isLoadingFile && (
                <p>Loading File</p>
              )}
              {this.state.file.name && !this.state.isLoadingFile && (
                <p>
                  <span key={this.state.file.name}>
                  {this.state.file.name}
                  </span>
                </p>
              )}
            </Dropzone>
      </section>
    );
  }
}
