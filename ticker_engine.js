require('dotenv').config();
var express = require('express');
var request = require('request');

var router = express.Router();

var interval = 30*1000; //intervallo in millisecondi

var bus = process.env.BUS || '';
var enviroment = process.env.ENV || 'Stage';

var tickersTable = {
    ETHEUR:{},
    ETHBTC:{},
    BTCEUR:{}
};

//GDAX e BITFINEX
const GTT = require('gdax-trading-toolkit');
const logger = GTT.utils.ConsoleLoggerFactory();

//GDAX
const gdaxProducts = ['ETH-BTC','ETH-EUR','BTC-EUR'];
const gdaxMap={
    'ETH-BTC':'ETHBTC',
    'ETH-EUR':'ETHEUR',
    'BTC-EUR':'BTCEUR'
};

var latestGDaxRead=[];
GTT.Factories.GDAX.FeedFactory(logger, gdaxProducts).then((feed) => {
    feed.on('data', msg => {
        if(msg.type == "ticker"){
            var row = gdaxMap[msg.productId];
            if(latestGDaxRead[msg.productId] == null) latestGDaxRead[msg.productId]=0;
            tickersTable[row]['GDAX'] = msg;
            var n = (new Date()).getTime();
            if((n-latestGDaxRead[msg.productId])>=interval){
                latestGDaxRead[msg.productId] = n;
                indexDocument('GDAX',row,msg);
            }
        }
    });
}).catch((err) => {
    logger.log('error', err.message);
    process.exit(1);
});

//BITFINEX
const bitfinexProducts = ['ETH-BTC'];
const bitfinexMap={'ETH-BTC':'ETHBTC'};
var latestBitfinexRead=[];
GTT.Factories.Bitfinex.FeedFactory(logger, bitfinexProducts).then((feed) => {
    feed.on('data', msg => {
        if(msg.type == "ticker"){
            var row = gdaxMap[msg.productId]
            tickersTable[row]['Bitfinex'] = msg;
            if(latestBitfinexRead[msg.productId] == null) latestBitfinexRead[msg.productId]=0;
            var n = (new Date()).getTime();
            if((n-latestBitfinexRead[msg.productId])>=interval){
                latestBitfinexRead[msg.productId] = n;
                indexDocument('Bitfinex',row,msg);
            }
        }
    });
}).catch((err) => {
    logger.log('error', err.message);
    process.exit(1);
});

//Bittrex
const bitrexProducts = ['BTC-ETH'];
const bitrexMap = {'BTC-ETH':'ETHBTC'};

var bittrex = require('node-bittrex-api');
bittrex.options({
    'apikey' : "API_KEY",
    'apisecret' : "API_SECRET",
});
readBitrex();

setInterval(readBitrex,interval);

function readBitrex(){
    bittrex.getmarketsummaries( function( data, err ) {
        if (err) {
            return console.error(err);
        }
        for(var i in bitrexProducts){
            bittrex.getticker( { market : bitrexProducts[i] }, function( ticker ) {
                var row = bitrexMap[bitrexProducts[i]]
                tickersTable[row]['Bitrex'] = ticker.result;
                indexDocument('Bitrex',row,ticker.result);
            });
        }
    });
}

//Kraken
const key          = '...'; // API Key
const secret       = '...'; // API Private Key
const KrakenClient = require('./kraken');
const kraken       = new KrakenClient(key, secret);
const krakenProducts = 'ETHXBT,XBTEUR,ETHEUR';
const krakenMap = {
    'XETHXXBT':'ETHBTC',
    'XETHZEUR':'ETHEUR',
    'XXBTZEUR':'BTCEUR'
};

setInterval(readKraken,interval);
function readKraken(){
    kraken.api('Ticker',{pair:krakenProducts},function(error,result){
        if(error){
            console.log("Error " + error.statusCode);
        }else{
            for(i in result.result){
                //console.log(i);
                var row = krakenMap[i]
                tickersTable[row]['Kraken'] = result.result[i];
                indexDocument("Kraken",row,result.result[i]);
            }
        }
    })
}


//Index Data
function indexDocument(source, product, msg){
    if(enviroment != "Prod"){
        return;
    }
    console.log("Index Data " + source, product);
    var document = {};
    document.source = source;
    document.timestamp = (new Date().getTime());
    document.currency = product;
    if(source == "GDAX"){
        document.price = msg.price;
        document.bid = msg.bid;
        document.ask = msg.ask;
        document.volume = msg.origin.volume_24h;
    }
    if(source == "Bitfinex"){
        document.price = msg.price;
        document.bid = msg.bid;
        document.ask = msg.ask;
        document.volume = msg.volume;
    }
    if(source == "Kraken"){
        document.price = msg["c"][0];
        document.bid = msg["b"][0];
        document.ask = msg["a"][0];
        document.volume = msg["v"][0];
    }
    if(source == "Bitrex"){
        document.price = msg.Last;
        document.bid = msg.Bid;
        document.ask = msg.Ask;
        document.volume = null;
    }

    var options = {
        method: 'post',
        body: document, // Javascript object
        json: true, // Use,If you are sending JSON data
        url: bus
    }

    request.post(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
            }else{
            }
        }
    );
}

//nodes
router.get('/api/tickers', (req, res, next) => {
        try {
            res.json(tickersTable);
        } catch (e) {
            next(e)
        }
});

module.exports = router;