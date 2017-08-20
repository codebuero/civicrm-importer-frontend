const assert = require('assert');
const app = require('../../src/app');

describe('\'RestApiWorker\' service', () => {
  it('registered the service', () => {
    const service = app.service('rest-api-worker');

    assert.ok(service, 'Registered the service');
  });
});
