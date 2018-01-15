$(document).ready(function(){
    readTicker();
    setInterval(readTicker,10000);
    $('ul.eq-ui-tabs').tabs();

    $('ul.eq-ui-tabs a').click(function(e){
        $("#eq-ui-tab-tickers").hide();
        $("#eq-ui-tab-dashboard").hide();
        var id = $(e.target).attr("data-href");
        $(id).show();
        if(id=="#eq-ui-tab-dashboard" && $("#eq-ui-tab-dashboard iframe").attr("src") == null){
            $("#eq-ui-tab-dashboard iframe").attr("src","http://149.202.77.27:3000/logout?channel=ex-embed&t=eyJ1c2VyIjoic2Vuc18zX2NyaXB0b2N1cnJlbmN5IiwicGFzcyI6Imx6T1EwdnY3IiwicmVkaXJlY3RfdG8iOiIvZGFzaGJvYXJkL2RiL3NlbnNvci1kYXNoYm9hcmQtc2Vuc18zX2NyaXB0b2N1cnJlbmN5In0=");
        }
    });
});

function readTicker(){
    $.get("/api/tickers", function(result){
        $("#tickers table tbody").html("");

        var now = new Date();
        $(".timestamp").html("(Latest Update: " + now + ")");

        var opportunities = [];

        for(var i in result) {
            console.log(i,result[i]);
            $("#tickers table tbody").append("<tr><td class='markets'>" + i + "</td>" +
                "<td>" + readValue("Kraken",result[i]["Kraken"]) + "</td>" +
                "<td>" + readValue("GDAX",result[i]["GDAX"]) + "</td>" +
                "<td>" + readValue("Bitrex",result[i]["Bitrex"]) + "</td>" +
                "<td>" + readValue("Bitfinex", result[i]["Bitfinex"]) + "</td>" +
                "</tr>");

            var opp = getTopOpportunities(i,result[i]);
            if(opp.percentage>0)
                opportunities.push(opp);
        }

        opportunities = opportunities.sort(function(a, b){return b.percentage-a.percentage});

        $("#top_arbitrage").html("");
        for(var i in opportunities) {
            $("#top_arbitrage").append('<div class="opportunity">' +
                    '<span class="market">' + opportunities[i].market + '</span>' +
                    '<span class="buy"> buy ' + ' from ' + opportunities[i].buyFrom + ' at ' + opportunities[i].buy + '</span>' +
                    '<span class="sell"> sell to ' + opportunities[i].sellTo + ' at ' + opportunities[i].sell + '</span>' +
                    '<span class="percentage"> +'+ opportunities[i].percentage + '</span>' +
                '</div>');
        }
    });
}

function getTopOpportunities(market,values){
    var result = {
        buy:1000000,
        buyFrom:"",
        sell:0,
        sellTo:"",
        market:market,
        percentage:0
    };
    for(var m in values) {
        var v= readValue(m,values[m]);
        if(v<result.buy){
            result.buy = v;
            result.buyFrom = m;
        }
        if(v>result.sell){
            result.sell = v;
            result.sellTo = m;
        }
    }
    result.percentage = ((result.sell-result.buy)/result.buy)*100;
    return result;
}

function readValue(market,ticker){
    if(ticker == null)
        return "--";

    if(market == "GDAX"){
        if(ticker.price == null) return "N/A"
        return ticker.price;
    }
    if(market == "Bitfinex"){
        if(ticker.price == null) return "N/A"
        return ticker.price;
    }
    if(market == "Bitrex"){
        if(ticker.Last == null) return "N/A"
        return ticker.Last;
    }
    if(market == "Kraken"){
        if(ticker["c"][0] == null) return "N/A"
        return ticker["c"][0];
    }
}