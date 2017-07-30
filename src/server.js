const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')

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

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

// const app = feathers()


var multer  = require('multer')
var upload = multer({ dest: __dirname + '../uploads/' })

const app = express()
// app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')))
app.use('/css', express.static(path.join(__dirname, './css')))
app.use('/js', express.static(path.join(__dirname, '../dist')))

app.use(bodyParser.json())

app.set('view engine', 'pug')
app.set('views', './src/views')

app.get('/', function(req, res){
  res.render('index')
})

app.post('/import', upload.single('contact_file'), function(req, res, next) {
  console.log(req.files)
  res.send(200)
})

app.get('*', function(req, res) {
  res.status(404).send('404 - Page Not Found')
})

app.use((err, req, res, next) => {
  console.error("Error on request %s %s", req.method, req.url)
  console.error(err.stack)
  res.status(500).send("Server error")
})

process.on('uncaughtException', evt => {
  console.error('uncaughtException: ', evt)
})

app.listen(4000, function(){
  console.log('Listening on port 4000')
})
