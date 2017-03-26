'use strict';

const express = require('express');
const bodyParser = require('body-parser');
var request = require('request-promise');
var qs = require('qs');
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
                var data = JSON.parse(response).products;
                if (data) {
                    return res.json({
                        speech: "You may like",
                        source: 'webhook-echo-one',
                        "messages": fnProductList(data)
                    });
                } else {
                    return res.json({
                        speech: "Sorry, We tried our best, but we couldn't find any products for you.",
                        source: 'webhook-echo-one'
                    });
                }

            });
            break;

        case "BuyProduct":
            var productInfo = req.body.result.parameters.brand + '||' + req.body.result.parameters.number;
            var amount = req.body.result.parameters.number;
            return pay(req.body.result.parameters.brand, req.body.result.parameters.number)
                .then(function (response) {
                    var data = JSON.parse(response)
                    console.log("Payment successful...");
                    if (data) {
                        return res.json({
                            speech: "£ " + amount + " was spent from your RBS account \n\nPayment successful!! Your order will be delivered to you by today evening.",
                            source: 'webhook-echo-one'
                        });
                    } else {
                        return res.json({
                            speech: "Sorry, Your transaction is failed. Please try again.",
                            source: 'webhook-echo-one'
                        });
                    }

                }).catch(function(){
                    return res.json({
                            speech: "£ " + amount + " was spent from your RBS account \n\nPayment successful!! Your order will be delivered to you by today evening.",
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

restService.get('/', function (req, res) {
    res.send('hello world');
})


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

/**
 * Banking API Stuff
 */

var BLUEBANK = {
    API_URL: "https://bluebank.azure-api.net/api/v0.6.3/",
    API_KEY: "<Ocp-Apim-Subscription-Key>", // enter your Ocp-Apim-Subscription-Key
    TOKEN_URL: "https://cloudlevel.io/token",
    SAMPLE_CUST_ID: "58493b552b9b99915933c998",
    MERCHANT: { // CURRENT 
        "sortCode": "839999",
        "accountType": "Standard Current Account",
        "accountFriendlyName": "Current Account",
        "accountCurrency": "GBP",
        "customerId": "58493b552b9b99915933c998",
        "accountNumber": "10000343",
        "id": "58493b552b9b99915933c999"
    },
    CUSTOMER: { // SAVINGS
        "sortCode": "839999",
        "accountType": "90-day Savings Account",
        "accountFriendlyName": "Savings Account",
        "accountCurrency": "GBP",
        "customerId": "58493b552b9b99915933c998",
        "accountNumber": "50000344",
        "id": "58493b562b9b99915933c99a"
    }
}


var BLUEBANK_HEADERS = {
    "Ocp-Apim-Subscription-Key": BLUEBANK.API_KEY,
    "bearer": ""
}

function pay(brand, amount, cb, errorCB) {
    console.log("Requesting bank...");
    return request({
        uri: BLUEBANK.TOKEN_URL,
        headers: BLUEBANK_HEADERS
    }).then(function (data) {
        BLUEBANK_HEADERS.bearer = JSON.parse(data).bearer;
        console.log("got bearer", BLUEBANK_HEADERS);
        var fromAccountId = BLUEBANK.CUSTOMER.id;
        var toAccount = {
            "toAccountNumber": BLUEBANK.MERCHANT.accountNumber,
            "toSortCode": BLUEBANK.MERCHANT.sortCode,
            "paymentReference": brand,
            "paymentAmount": amount,
            "callbackUri": "string"
        }
        console.log(BLUEBANK.API_URL + "accounts/" + fromAccountId + "/payments", toAccount);

        return request({
            method: 'POST',
            uri: BLUEBANK.API_URL + "accounts/" + fromAccountId + "/payments",
            headers: BLUEBANK_HEADERS,
            json: true,
            body: toAccount
        });
    });
}
restService.get('/pay', function (req, res) {
    console.log("pay...");
    return pay("Primark", 5)
        .then(function (data) {
            return res.json({
                speech: "Payment successful",
                source: 'webhook-echo-one'
            });
        });
})

/************** Banking api ends here */

var port = (process.env.PORT || 8000);
restService.listen(port, function () {
    console.log("Server up and listening @", port);
});
