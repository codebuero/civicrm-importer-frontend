const path = require('path');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const socketio = require('feathers-socketio');

const multer = require('multer')
const multipartMiddleware = multer({ limits: { fieldNameSize: 1000, fieldSize: 1000000000 } })
const dauria = require('dauria')

const blobService = require('feathers-blob')
const fs = require('fs-blob-store')
const blobStorage = fs(__dirname + '/../uploads')

const handler = require('feathers-errors/handler');
const notFound = require('feathers-errors/not-found');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const app = feathers();

// Load app configuration
app.configure(configuration());

app.configure(hooks());
app.configure(rest());
app.configure(socketio());

app.configure(middleware);
app.configure(services);

// Configure other middleware (see `middleware/index.js`)
// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Host the public folder
app.use('/', feathers.static(app.get('public')));

app.use('/import',
  multipartMiddleware.single('uri'),
  function(req, res, next) {
    req.feathers.file = req.file
    console.log(req.file)
    next()
  },
  blobService({ Model: blobStorage })
  )

app.service('/import').before({
  create: [
    function(hook) {
      if (!hook.data.uri && hook.params.file) {
        const file = hook.params.file

        const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
        hook.data = { uri }
      }
    }
  ]
})

// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(handler());

app.hooks(appHooks);

module.exports = app;
