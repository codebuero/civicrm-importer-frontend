require('@babel/register');
require("@babel/core");
require("@babel/polyfill");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { window } = (new JSDOM(''));
const { document } = window;

const exposedProperties = ['window', 'navigator', 'document'];

global.document = document;
global.window = window;
Object.keys(window).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    exposedProperties.push(property);
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'node.js'
};

documentRef = document;