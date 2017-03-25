
var request = require('request-promise');
var qs = require('qs');

var BLUEBANK = {
	API_URL: "https://bluebank.azure-api.net/api/v0.6.3/",
	API_KEY: "7c6877be3d254857a7da63e2302a1e12",
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

function getBearerToken() {
	return request({
		url: BLUEBANK.TOKEN_URL,
		headers: BLUEBANK_HEADERS
	});
}

function makePayment(fromAccountId, toAccount) {
	return request.post({
		url: BLUEBANK.API_URL + "accounts/" + fromAccountId + "/payments",
		headers: BLUEBANK_HEADERS,
		postData: {
			mimeType: 'application/json',
			params: toAccount
		}
	});
}

export function pay(brand, amount, cb, errorCB) {
	return getBearerToken()
	.then(function(data){
		BLUEBANK_HEADERS.bearer = data.bearer;

		var fromAccountId = BLUEBANK.CUSTOMER.id;
		var toAccount = {
			"toAccountNumber": BLUEBANK.MERCHANT.accountNumber,
			"toSortCode": BLUEBANK.MERCHANT.sortCode,
			"paymentReference": brand,
			"paymentAmount": amount,
			"callbackUri": "string"
		}
		return makePayment(fromAccountId, toAccount )
	})
}
