import React from 'react'
import PropTypes from 'prop-types'
import {observer} from 'mobx-react'
import Dropzone from 'react-dropzone'

export default class FileUploadInput extends React.Component {
  constructor() {
    super()
    this.state = { files: [] }
  }

  onDrop(files) {
    this.setState((prevState, props) => {
      return { files: prevState.files.concat(files)}
    })
  }

  render() {
    return (
      <section>
        <div>
          <Dropzone onDrop={this.onDrop.bind(this)}>
            <p>Drag'n'Drop der zu importierenden Dateien hierauf oder einfach klicken und Dateien auswählen.</p>
          </Dropzone>
        </div>
        <div>
          <h2>Dateien</h2>
          <ul style={{listStyleType: 'none'}}>
            {
              this.state.files.map(f => <li key={f.name}>{f.name} </li>)
            }
          </ul>
        </div>
      </section>
    );
  }
}
