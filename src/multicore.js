var workerFarm = require('worker-farm')
  , workers    = workerFarm(require.resolve('./restcall'))
  , ret        = 0

for (var i = 0; i < 4; i++) {
  workers('#' + i + ' FOO', function (err, outp) {
    console.log(outp)
    if (++ret == )
      workerFarm.end(workers)
  })
}