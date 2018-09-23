import React from 'react'
import Proptypes from 'prop-types'

const NavigationBar = ({ topics, enabledHeaderTopics, onHeaderClick, selectedTopic, version }) => 
(<header>
  <h1>CiviCrm Importer@{version}</h1>
  <div className="breadcrumb">
    {topics.map(ht => 
      (<a 
        key={ht.key}
        disabled={!enabledHeaderTopics.includes(ht.key)} 
        onClick={() => onHeaderClick(ht.key)}
        className={`breadcrumb__step button ${ht.key === selectedTopic ? 'breadcrumb__step--active' : ''}`}
        href="#">{ht.value}</a>))
    }
  </div>
</header>)

NavigationBar.propTypes = {
  topics: Proptypes.arrayOf(Proptypes.shape({ key: Proptypes.string.isRequired, value: Proptypes.string.isRequired })),
  enabledHeaderTopics: Proptypes.arrayOf(Proptypes.string.isRequired).isRequired,
  onHeaderClick: Proptypes.func.isRequired,
  selectedTopic: Proptypes.string.isRequired,
}

NavigationBar.displayName = 'NavigationBar'

export default NavigationBar