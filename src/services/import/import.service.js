// Initializes the `civicrmrestapi` service on path `/civicrmrestapi`
const createService = require('feathers-memory');

module.exports = function () {
  const app = this;

  class UploadService {
    create(data, params) {
      return new Promise(function(resolve, reject){
        console.log(data)
        console.log(params)
        return resolve('ok')
      })

    }
  }

  app.use('/import', new UploadService());

  const service = app.service('import');
};
