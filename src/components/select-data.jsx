import React from 'react';
import PropTypes from 'prop-types';

import { altrujaPayload, onlycontactsPayload } from '../services/payload-rules'

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

    this.onFiletypeSelection = this.onFiletypeSelection.bind(this);
    this.onSheetSelection = this.onSheetSelection.bind(this);
  }

  componentDidMount() {
    if (Object.keys(this.props.parsedData).length === 1) {
      return this.props.selectData();
    }
  }
  onSheetSelection(e) {
    if (e.target.value !== "0") {
      this.props.selectData(e.target.value)
    }     
  }
  onFiletypeSelection(e) {
    if (e.target.value !== "0") {
      this.props.selectRule(e.target.value)
      return this.props.toggleNext(true);
    } 
    this.props.toggleNext(false)
  }
  render() {
    return (
      <section className="section"><div>
        <div className="field is-horizontal">
          {Object.keys(this.props.parsedData).length > 1 && (<div>
            <div className="field-label is-normal">
              <label className="label" style={{ textAlign: 'left' }}>
                Select Sheet
              </label>
            </div>
            <div className="field-body">
              <div className="field">
                <div className="control">
                  <div className="select">
                    <select onChange={this.onSheetSelection}>
                      <option value="0">Please choose the sheet to import</option>
                      {Object.keys(this.props.parsedData).map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div></div>
          )}
        </div>
        <div className="field is-horizontal">
          <div>
            <div className="field-label is-normal">
              <label className="label" style={{ textAlign: 'left' }}>
                Select Datatype 
              </label>
            </div>
            <div className="field-body">
              <div className="control">
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
    </div></section>);
  }
}

