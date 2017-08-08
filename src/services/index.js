const civicrmRestApi = require('./civicrmrestapi/civicrmrestapi.service.js');
const importApi = require('./import/import.service.js')
const restApiWorker = require('./rest-api-worker/rest-api-worker.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(civicrmRestApi);
  app.configure(importApi);
  app.configure(restApiWorker);
};
