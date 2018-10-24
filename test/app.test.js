import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
Enzyme.configure({ adapter: new Adapter() })

import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'

import App from '../src/components/root';


describe('two plus two is four', () => {
  it('should be two', () => {
    expect(2 + 2).to.equal(4);
  })

  it('should render the app', () => {
    const wrapper = mount(<App />)
    expect(wrapper).to.be.not.empty
  })
});