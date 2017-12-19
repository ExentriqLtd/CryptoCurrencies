var express = require('express');
var router = express.Router();
var kraken_engine = require('./ticker_engine');

var app = express();

module.exports = app;

app.use('/', kraken_engine);
app.use(express.static('public'));