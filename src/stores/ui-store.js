import {observable, computed, reaction} from 'mobx'

//@observable
export default class UIStore {
  constructor() {
    this.isPending = false
  }

}