'use strict';

const express = require('express');
const bodyParser = require('body-parser');
var request = require('request-promise');
var bluebank = require('./bluebank.js');

const restService = express();

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

restService.post('/echo', function (req, res) {
    console.log('=============' + req.body.result.action)
    switch (req.body.result.action) {
        case "FetchProducts":

            var productType = req.body.result.parameters.color + req.body.result.parameters.dress + req.body.result.parameters.number;

            return request('https://blitzapimonitor.herokuapp.com/blitz/getProduct/' + productType).then(function (response) {
                return res.json({
                    speech: "You may like",
                    source: 'webhook-echo-one',
                    "messages": fnProductList(JSON.parse(response).products)
                });
            });
            break;

        case "BuyProduct":
            var productInfo = req.body.result.parameters.brand + '||' + req.body.result.parameters.number;

            return bluebank.pay(req.body.result.parameters.brand, req.body.result.parameters.number)
                .then(function (data) {
                    return res.json({
                        speech: "Payment successful",
                        source: 'webhook-echo-one'
                    });
                });
            break;

        case "ShowHistory":

            var productType = req.body.result.parameters.color + req.body.result.parameters.dress + req.body.result.parameters.number;

            return request('https://blitzapimonitor.herokuapp.com/blitz/orderHistory').then(function (response) {
                return res.json({
                    speech: "Here is your order history",
                    source: 'webhook-echo-one',
                    "messages": fnProductList(JSON.parse(response).products)
                });
            });
            break;

    }



});

restService.post('/slack-test', function (req, res) {

    var slack_message = {
        "text": "Details of JIRA board for Browse and Commerce",
        "attachments": [{
            "title": "JIRA Board",
            "title_link": "http://www.google.com",
            "color": "#36a64f",

            "fields": [{
                "title": "Epic Count",
                "value": "50",
                "short": "false"
            }, {
                "title": "Story Count",
                "value": "40",
                "short": "false"
            }],

            "thumb_url": "https://stiltsoft.com/blog/wp-content/uploads/2016/01/5.jira_.png"
        }, {
            "title": "Story status count",
            "title_link": "http://www.google.com",
            "color": "#f49e42",

            "fields": [{
                "title": "Not started",
                "value": "50",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }]
        }]
    }
    return res.json({
        speech: "speech",
        displayText: "speech",
        source: 'webhook-echo-sample',
        data: {
            "slack": slack_message
        }
    });
});

restService.post('/fb-test', function (req, res) {

    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Seems like some problem. Speak again."
    var messages = {
        "attachment": {
            "type": "audio",
            "payload": {
                "url": "https://petersapparel.com/bin/clip.mp3"
            }
        }
    }

    return res.json({
        speech: speech,
        displayText: speech,
        source: 'webhook-echo-fb',
        data: {
            facebook: messages
        }
    });
});


function fnProductList(productData) {
    /*
        var productData = [{
            title: "Classic T-Shirt Collection",
            subtitle: "subtitle",
            imageUrl: "http://asset1.marksandspencer.com/is/image/mands/SD_01_T38_7237_KC_X_EC_0?$PRODVIEWER_SUB$",
            price: "20",
            rating: "4"
        }, {
            title: "Classic T-Shirt Collection",
            subtitle: "subtitle",
            imageUrl: "http://asset1.marksandspencer.com/is/image/mands/SD_01_T38_7237_KC_X_EC_0?$PRODVIEWER_SUB$",
            price: "30",
            rating: "5"
        }, {
            title: "Classic T-Shirt Collection",
            subtitle: "subtitle",
            imageUrl: "http://asset1.marksandspencer.com/is/image/mands/SD_01_T38_7237_KC_X_EC_0?$PRODVIEWER_SUB$",
            price: "40",
            rating: "2"
        }, {
            title: "Classic T-Shirt Collection",
            subtitle: "subtitle",
            imageUrl: "http://asset1.marksandspencer.com/is/image/mands/SD_01_T38_7237_KC_X_EC_0?$PRODVIEWER_SUB$",
            price: "50",
            rating: "1"
        }]*/

    var list = [];
    for (var i = 0; i < productData.length; i++) {
        var product = productData[i];
        var obj = {
            "title": product.title,
            "subtitle": product.subtitle + " (Rating: " + product.rating + ")",
            "imageUrl": product.imageUrl,
            "buttons": [{
                "text": "Buy @ £" + product.price,
                "postback": "Buy now: Brand - " + product.subtitle + ", Price - " + Number(product.price)
            }],
            "type": 1
        }

        list.push(obj);
    }

    return list;
}

restService.listen((process.env.PORT || 8000), function () {
    console.log("Server up and listening");
});
