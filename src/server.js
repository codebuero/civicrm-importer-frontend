const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const logger = require('winston')

const compress = require('compression')
const cors = require('cors')
const helmet = require('helmet')

const feathers = require('feathers')
const configuration = require('feathers-configuration')
const hooks = require('feathers-hooks')
const rest = require('feathers-rest')
const socketio = require('feathers-socketio')

const handler = require('feathers-errors/handler')
const notFound = require('feathers-errors/not-found')

const middleware = require('./middleware')
const services = require('./services')
const appHooks = require('./app.hooks')

const app = feathers()

// Load app configuration
app.configure(configuration())
// Enable CORS, security, compression, favicon and body parsing
app.use(cors())
app.use(helmet())
app.use(compress())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// host the css folder in public
app.use('/css', feathers.static(`${app.get('public')}/css`) )

// Set up Plugins and providers
app.configure(hooks())
app.configure(rest())
app.configure(socketio())

app.configure(middleware);
// Set up our services (see `services/index.js`)
app.configure(services);
// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(handler());

app.hooks(appHooks);

// app.post('/import', upload.single('contact_file'), function(req, res, next) {
//   console.log(req.files)
//   res.send(200)
// })

// app.get('*', function(req, res) {
//   res.status(404).send('404 - Page Not Found')
// })

app.use((err, req, res, next) => {
  console.error("Error on request %s %s", req.method, req.url)
  console.error(err.stack)
  res.status(500).send("Server error")
})

process.on('uncaughtException', evt => {
  console.error('uncaughtException: ', evt)
})

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
)

app.listen(4000, function(){
  console.log('Listening on port 4000')
})
