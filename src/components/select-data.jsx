import React from 'react';
import PropTypes from 'prop-types';

/*
*  1. In case of xlsx and multiple sheets, sheet selection 
*  2. In any cases: Preview of data, wether of selected sheet or the whole file (csv case)
*  3. Selector, which kind of file should be imported (altruja, betterplace exports)
*/
export default class SelectData extends React.Component {
  static propTypes = {
    parsedData: PropTypes.object.isRequired,
    selectData: PropTypes.func.isRequired,
    toggleNext: PropTypes.func.isRequired,
    rulesSet: PropTypes.object.isRequired,
    selectRule: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.displayName = "SelectData";

    let selectedSheet = ""

    if (Object.keys(this.props.parsedData).length === 1) {
      selectedSheet = Object.keys(this.props.parsedData)[0]
    }

    this.state = {
      selectedSheet,
      selectedFiletype: "",
    }

    this.onFiletypeSelection = this.onFiletypeSelection.bind(this);
    this.onSheetSelection = this.onSheetSelection.bind(this);
    this.enableNext = this.enableNext.bind(this);
  }

  enableNext(sheet, filetype) {
      this.props.selectRule(filetype)
      this.props.selectData(sheet)
      this.props.toggleNext(true)      
  }

  onSheetSelection(e) {
    const selectedSheet = e.target.value 
    if (selectedSheet !== "0") {
      this.setState(state => ({ ...state, selectedSheet }))
      if (selectedSheet && this.state.selectedFiletype) {
        this.enableNext(selectedSheet, this.state.selectedFiletype)
      }
      return
    }  
    this.setState(state => ({ ...state, selectedSheet: "" })) 
    this.props.toggleNext(false) 
  }

  onFiletypeSelection(e) {
    const selectedFiletype = e.target.value
    if (e.target.value !== "0") {
      this.setState(state => ({ ...state, selectedFiletype}))
      if (selectedFiletype && this.state.selectedSheet) {
        this.enableNext(this.state.selectedSheet, selectedFiletype)
      }
      return
    } 
    this.setState(state => ({ ...state, selectedFiletype: "" }))
    this.props.toggleNext(false)
  }

  render() {
    return (
      <section className="section">
        <div className="container">
          <div className="columns">
            {Object.keys(this.props.parsedData).length > 1 && (<div className="column is-half">
              <div className="field">
                <label className="label">
                  Select Sheet
                </label>
                <div className="field">
                  <div className="select">
                    <select onChange={this.onSheetSelection}>
                      <option value="0">Please choose the sheet to import</option>
                      {Object.keys(this.props.parsedData).map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div>)}
            <div className="column is-half">
              <div className="field">
                <label className="label" style={{ textAlign: 'left' }}>
                  Select Datatype 
                </label>
                <div className="field">
                  <div className="select">
                    <select onChange={this.onFiletypeSelection}>
                      <option value="0">Please choose the datatype of the imported file</option>
                      {Object.keys(this.props.rulesSet).map(r => (<option disabled={this.props.rulesSet[r].disabled} key={r} value={r}>{r + ' - ' + this.props.rulesSet[r].description}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

