var path = require('path')

// Load local environment variables
if('production' !== process.env.LOCAL_ENV ) require('dotenv').load();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencoded = bodyParser.urlencoded({extended: false})

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(urlencoded);

var port = process.env.PORT || 5000

console.log("Use port", port)

var server = require('http').createServer(app);
server.listen(port);
require('./routes')(app)
