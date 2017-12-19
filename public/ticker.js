

$(document).ready(function(){
    readTicker();
    //setInterval(readTicker,5000);
});

function readTicker(){
    $.get("/api/tickers", function(result){
        $("#tickers table tbody").html("");
        for(var i in result) {
            console.log(i,result[i]);
            $("#tickers table tbody").append("<tr><td class='markets'>" + i + "</td>" +
                "<td>" + readValue("Kraken",result[i]["Kraken"]) + "</td>" +
                "<td>" + readValue("GDAX",result[i]["GDAX"]) + "</td>" +
                "<td>" + readValue("Bitrex",result[i]["Bitrex"]) + "</td>" +
                "<td>" + readValue("Bitfinex", result[i]["Bitfinex"]) + "</td>" +
                "</tr>");
        }



    });
}

function readValue(market,ticker){
    if(ticker == null)
        return "--";

    if(market == "GDAX"){
        return ticker.price;
    }
    if(market == "Bitfinex"){
        return ticker.price;
    }
    if(market == "Bitrex"){
        return ticker.Last;
    }
    if(market == "Kraken"){
        return ticker["c"][0];
    }
}