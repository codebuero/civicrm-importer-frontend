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

const util = require('util')

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const app = feathers();

app.configure(configuration());

// Configure other middleware (see `middleware/index.js`)
// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(bodyParser.json({ type: 'application/json', limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true , limit: '20mb' }));
// Host the public folder
app.use('/', feathers.static(app.get('public')));

// Load app configuration

app.configure(hooks());
app.configure(rest());
app.configure(socketio());

app.configure(middleware);
app.configure(services);

app.use('/import',
  multipartMiddleware.single('uri'),
  function(req, res, next) {
    req.feathers.file = req.file
    next()
  },
  blobService({ Model: blobStorage }),
  function(req, res, next) {
    return res.status(200).json({})
  },
  )

// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(handler());

app.hooks(appHooks);

process.on('uncaughtException', evt => {
  console.error('uncaughtException: ', evt)
})

process.on('unhandledRejection', (reason, p) =>
  console.error('Unhandled Rejection at: Promise ', p, reason)
)

app.listen(4000, function(){
  console.log('Listening on port 4000')
})