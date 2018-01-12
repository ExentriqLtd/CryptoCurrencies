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
    BTCEUR:{},
    IOTBTC:{},
    NAVBTC:{},
    XVGBTC:{},
    BNTBTC:{},
    DCRBTC:{},
    CVCBTC:{},
    XLMBTC:{},
    ADABTC:{}
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
/*GTT.Factories.GDAX.FeedFactory(logger, gdaxProducts).then((feed) => {
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
});*/

//BITFINEX
const bitfinexProducts = ['ETH-BTC','IOTBTC'];
const bitfinexMap={
    'ETH-BTC':'ETHBTC',
    'IOTBTC':'IOTBTC'
};
var latestBitfinexRead=[];
/*GTT.Factories.Bitfinex.FeedFactory(logger, bitfinexProducts).then((feed) => {
    feed.on('data', msg => {
        if(msg.type == "ticker"){
            var row = bitfinexMap[msg.productId]
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
});*/

//Bittrex
const bitrexProducts = ['BTC-ETH','BTC-NAV','BTC-XVG','BTC-BNT','BTC-DCR','BTC-CVC','BTC-XLM','BTC-ADA'];
const bitrexMap = {
    'BTC-ETH':'ETHBTC',
    'BTC-NAV':'NAVBTC',
    'BTC-XVG':'XVGBTC',
    'BTC-BNT':'BNTBTC',
    'BTC-DCR':'DCRBTC',
    'BTC-CVC':'CVCBTC',
    'BTC-XLM':'XLMBTC',
    'BTC-ADA':'ADABTC'
};

var bittrex = require('node-bittrex-api');
bittrex.options({
    'apikey' : "API_KEY",
    'apisecret' : "API_SECRET",
});

//readBitrex();
//setInterval(readBitrex,interval);

function readBitrex(){
    bittrex.getmarketsummaries( function( data, err ) {
        if (err) {
            return console.error(err);
        }
        for(var i in bitrexProducts){
            getTicker(bitrexProducts[i]);
        }
    });
}

function getTicker(market) {
    bittrex.getticker({market : market},
        function(ticker) {
            console.log(ticker,market);
            if(ticker != null){
                var row = bitrexMap[market]
                tickersTable[row]['Bitrex'] = ticker.result;
                indexDocument('Bitrex',row,ticker.result);
            }
        }
    );
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

//setInterval(readKraken,interval);
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
var GoogleSheetClient = require('./gsclient');
var googleSheetClient = new GoogleSheetClient('./key.json');
var googleFileId = "1KVmI4xWIFMNh90zyW3b-femvIsRJYY561-ggyGihdmU";

function indexDocument(source, product, msg){
    /*Update Excel File*/
    //console.log("Update Excel File " + source, product);
    var cell = getCell(source, product, msg);
    if(cell[0]){
        googleSheetClient.update(googleFileId, cell[0], cell[1], function(err, resp){
            //console.log(err);
            //console.log(resp);
        });
    }

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

//every 12 hours
readCurrencyConversion();
setInterval(readCurrencyConversion,12*60*60*1000);
function readCurrencyConversion(){{

    //yyyy-MM-dd
    var now = new Date();
    var month = now.getMonth()+1;
    if(month<=9)
        month = "0" + month;
    var day = now.getDate();
    if(day<=9)
        day = "0" + day;

    var formatDate = now.getFullYear() + "-" + month + "-" + day;
    var propertiesObject = { access_key:'fd9e4abeb03b2c7a81dd3cf2b54607ce', format:'0', currencies:'EUR,USD', date: formatDate};

    var options = {
        method: 'get',
        json: true,
        url: "http://apilayer.net/api/historical",
        qs:propertiesObject
    }

    request.get(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                ;
                googleSheetClient.update(googleFileId, "Objectives!G22", body.quotes.USDEUR, function(err, resp){
                });
            }else{
                //console.log(error);
            }
        }
    );
}}

const gdaxCellConf = {
    'BTCEUR':'Objectives!g21',
    'ETHBTC':'Objectives!k37'
};
const bitfinexCellConf = {'IOTBTC':'Objectives!k43'};
const bitrexCellConf = {
    'NAVBTC':'Objectives!k48',
    'XVGBTC':'Objectives!k49',
    'BNTBTC':'Objectives!k50',
    'DCRBTC':'Objectives!k51',
    'CVCBTC':'Objectives!k52',
    'XLMBTC':'Objectives!k53',
    'ADABTC':'Objectives!k54'
};

function getCell(source, product, msg){
    var cell = [];
    if(source == "GDAX"){
        cell[0] = gdaxCellConf[product];
        cell[1] = msg.price;
    }
    if(source == "Bitfinex"){
        cell[0] = bitfinexCellConf[product];
        cell[1] = msg.price;
    }
    if(source == "Bitrex"){
        cell[0] = bitrexCellConf[product];
        cell[1] = msg.Last;
    }
    return cell;
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