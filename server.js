// Dependencies
const RC = require('ringcentral');
const http = require('http');


var currencySymbols = {"a":"Afghanistan Afghani = AFN; Argentina Peso = ARS; Aruba Guilder = AWG; Australia Dollar = AUD; Azerbaijan New Manat = AZN","b":"Bahamas Dollar = BSD; Barbados Dollar	= BBD; Belarus Ruble = BYN; Belize Dollar = BZD; Bermuda Dollar	= BMD; Bolivia Boliviano = BOB; Bosnia and Herzegovina Convertible Marka = BAM; Botswana Pula = BWP; Bulgaria Lev = BGN; Brazil Real = BRL; Brunei Darussalam Dollar = BND","c":"Cambodia Riel = KHR; Canada Dollar = CAD; Cayman Islands Dollar = KYD; Chile Peso = CLP; China Yuan Renminbi = CNY; Colombia Peso	= COP; Costa Rica Colon = CRC; Croatia Kuna = HRK; Cuba Peso = CUP; Czech Republic Koruna = CZK","d":"Denmark Krone	= DKK; Dominican Republic Peso = DOP","e":"East Caribbean Dollar = XCD; Egypt Pound = EGP; El Salvador Colon = SVC; Euro Member Countries = EUR","f":"Falkland Islands (Malvinas) Pound = FKP; Fiji Dollar = FJD","g":"Ghana Cedi = GHS; Gibraltar Pound = GIP; Guatemala Quetzal = GTQ; Guernsey Pound = GGP; Guyana Dollar = GYD","h":"Honduras Lempira = HNL; Hong Kong Dollar = HKD; Hungary Forint = HUF","i":"Iceland Krona = ISK; India Rupee = INR; Indonesia Rupiah = IDR; Iran Rial = IRR; Isle of Man Pound = IMP; Israel Shekel = ILS","j":"Jamaica Dollar = JMD; Japan Yen = JPY; Jersey Pound = JEP","k":"Kazakhstan Tenge = KZT; Korea (North) Won = KPW; Korea (South) Won = KRW; Kyrgyzstan Som = KGS","l":"Laos Kip = LAK; Lebanon Pound = LBP; Liberia Dollar = LRD","m":"Macedonia Denar = MKD; Malaysia Ringgit = MYR; Mauritius Rupee = MUR; Mexico Peso = MXN; Mongolia Tughrik = MNT; Mozambique Metical = MZN","n":"Namibia Dollar = NAD; Nepal Rupee = NPR; Netherlands Antilles Guilder = ANG; New Zealand Dollar = NZD; Nicaragua Cordoba = NIO; Nigeria Naira	NGN; Norway Krone = NOK","o":"Oman Rial = OMR","p":"Pakistan Rupee = PKR; Panama Balboa = PAB; Paraguay Guarani = PYG; Peru Sol = PEN; Philippines Peso = PHP; Poland Zloty = PLN","q":"Qatar Riyal = QAR","r":"Romania New Leu = RON; Russia Ruble = RUB","s":"Saint Helena Pound = SHP; Saudi Arabia Riyal = SAR; Serbia Dinar = RSD; Seychelles Rupee = SCR = Singapore Dollar = SGD; Solomon Islands Dollar = SBD; Somalia Shilling = SOS; South Africa Rand	ZAR; Sri Lanka Rupee	LKR; Sweden Krona = SEK; Switzerland Franc = CHF; Suriname Dollar	SRD; Syria Pound = SYP","t":"Taiwan New Dollar = TWD; Thailand Baht	THB; Trinidad and Tobago Dollar = TTD; Turkey Lira = TRY; Tuvalu Dollar = TVD","u":"Ukraine Hryvnia = UAH; United Kingdom Pound = GBP; United States Dollar = USD; Uruguay Peso = UYU; Uzbekistan Som = UZS","v":"Venezuela Bolivar = VEF; Viet Nam Dong = VND","w":"","x":"","y":"Yemen Rial = YER","z":"Zimbabwe Dollar = ZWD"};

var subscriptionList = [];

// Instantiate RC-SDK
var rcsdk = new RC({
    server: process.env.RC_SERVER,
    appKey: process.env.RC_APP_KEY,
    appSecret: process.env.RC_APP_SECRET
});

var platform = rcsdk.platform();

var subscription = rcsdk.createSubscription();

// Login to the RingCentral Platform
function login() {
    return platform
        .login({
            username: process.env.RC_USERNAME,
            password: process.env.RC_PASSWORD,
            extension: process.env.RC_EXTENSION
        })
        .then(function(authResponse) {
            console.log('RC authResponse: ', authResponse.json());
        })
        .catch(function(e) {
            console.error(e);
            throw e;
        });
}

login();

module.exports = {

    startPubNubSubscription: function (res) {
      var _eventFilters = [];
      _eventFilters.push('/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS');
      subscription.setEventFilters(_eventFilters)
      .register()
      .then(function(subscriptionResponse) {
          var subscObj = subscriptionResponse.json();
          addItemToSubscriptionList(subscObj)
          res.render('index', {
              subscriptions: subscriptionList
          })
      })
      .catch(function(e) {
          console.error(e);
          throw e;
      });
    },
    startWebhookSubscription: function (res, method) {
      var _eventFilters = [];
      _eventFilters.push('/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS');
      return platform.post('/subscription',
      {
          eventFilters: _eventFilters,
          deliveryMode: {
              transportType: process.env.DELIVERY_MODE_TRANSPORT_TYPE,
              address: process.env.DELIVERY_MODE_ADDRESS
          }
      })
      .then(function(subscriptionResponse) {
          var subscObj = subscriptionResponse.json();
          addItemToSubscriptionList(subscObj)
          res.render('index', {
              subscriptions: subscriptionList
          })
      })
      .catch(function(e) {
          console.error(e);
          throw e;
      });
    },
    deleteSubscription: function (req, res) {
        for(var item of subscriptionList) {
            if (item['id'] == req.body.SubscriptionId) {
                var index = subscriptionList.indexOf(item);
                if (index > -1) {
                    subscriptionList.splice(index, 1);
                }
                break;
            }
        }
        return platform
          .delete('/subscription/' + req.body.SubscriptionId)
          .then(function (response) {
              res.render('index', {
                  subscriptions: subscriptionList
              })
        });
    },
    listSubscription: function (res) {
        subscriptionList = [];
        return platform
          .get('/subscription')
          .then(function (response) {
            var data = response.json();
            for(var record of data.records) {
                addItemToSubscriptionList(record)
            }
            res.render('index', {
                subscriptions: subscriptionList
            })
        });
    },
    handleWebhooksPost: function(req, res) {
        var headers = req.headers;
        var validationToken = headers['validation-token'];
        var body = [];
        if(validationToken) {
            res.setHeader('Validation-Token', validationToken);
            res.statusCode = 200;
            res.end();
        } else {
            req.on('data', function(chunk) {
                body.push(chunk);
            }).on('end', function() {
                body = Buffer.concat(body).toString();
                var jsonObj = JSON.parse(body)
                parseResponse(jsonObj.body);
                res.statusCode = 200;
                res.end();
            });
        }
    },
    sendSMSMessage: function (req, res) {
      var toNumbers = req.body.tonumber.split(';')
      var requestData = {}
      var numbers = []
      for(var item of toNumbers) {
          var toNumber = {}
          toNumber['phoneNumber'] = item;
          numbers.push(toNumber);
      }
      requestData['to'] = numbers;
      requestData['from'] = {'phoneNumber': process.env.RC_USERNAME};
      requestData['text'] = req.body.message
      return platform
        .post('/account/~/extension/~/sms', requestData)
        .then(function (response) {
            res.redirect('/sendsms')
        });
    },
    sendPagerMessage: function (req, res) {
      // not implemented
    },
    sendMMSMessage: function (req, res) {
      var toNumbers = req.body.tonumber.split(';')
      var numbers = []
      for(var item of toNumbers) {
          var toNumber = {}
          toNumber['phoneNumber'] = item;
          numbers.push(toNumber);
      }
      var FormData = require('form-data');
      formData = new FormData();
      var body = {
          from: {phoneNumber: process.env.RC_USERNAME},
          to: numbers,
          text: req.body.message
      }
      // This is the mandatory part, the name and type should always be as follows
      formData.append('json', new Buffer(JSON.stringify(body)), {filename: 'request.json', contentType: 'application/json'});

      var fs = require('fs');
      var currentFolder = process.cwd();
      var tempFile = currentFolder + "/" + req.file.path
      var sendFile = currentFolder + "/tempFile/" + req.file.originalname
      fs.rename(tempFile, sendFile, function(err) {
          if ( err )
              console.log('ERROR: ' + err);
      });
      formData.append('attachment', fs.createReadStream(sendFile));
      fs.unlinkSync(sendFile);
      // Send the mms
      return platform
        .post('/account/~/extension/~/sms', formData)
        .then(function (response) {
            console.log("MMS sent")
            res.redirect('/sendsms')
        })
        .catch(function(e) {
            console.error(e);
            throw e;
        });
   },
   sendFAXMessage: function (req, res) {
     var toNumbers = req.body.tonumber.split(';')
     var numbers = []
     for(var item of toNumbers) {
         var toNumber = {}
         toNumber['phoneNumber'] = item;
         numbers.push(toNumber);
     }
     var FormData = require('form-data');
     formData = new FormData();
     var body = {
         to: numbers,
         faxResolution: 'High',
         coverPageText: req.body.message
     }
     // This is the mandatory part, the name and type should always be as follows
     formData.append('json', new Buffer(JSON.stringify(body)), {filename: 'request.json', contentType: 'application/json'});

     var fs = require('fs');
     var currentFolder = process.cwd();
     var tempFile = currentFolder + "/" + req.file.path
     var sendFile = currentFolder + "/tempFile/" + req.file.originalname
     fs.rename(tempFile, sendFile, function(err) {
        if ( err )
            console.log('ERROR: ' + err);
     });
     formData.append('attachment', fs.createReadStream(sendFile));
     fs.unlinkSync(sendFile);
     // Send the fax
     return platform
       .post('/account/~/extension/~/fax', formData)
       .then(function (response) {
           console.log("FAX sent")
           res.redirect('/sendsms')
       })
       .catch(function(e) {
           console.error(e);
           throw e;
       });
   }
};

// event notification via PubNub
subscription.on(subscription.events.notification, function(msg) {
    parseResponse(msg.body);
});

function addItemToSubscriptionList(subscObj) {
  var subscription = {}
  var eventType = ""
  for (var item of subscObj.eventFilters) {
      var questionIndex = item.indexOf("?type=")
      eventType += item.substr(questionIndex+6, item.length) + "|"
  }
  eventType = eventType.substr(0, eventType.length - 1)

  subscription['eventtype'] = eventType;
  subscription['expire'] = subscObj.expirationTime;
  subscription['timeleft'] = secondsToString(subscObj.expiresIn)
  subscription['transporttype'] = subscObj.deliveryMode.transportType
  subscription['webhookaddress'] = subscObj.deliveryMode.address
  subscription['status'] = subscObj.status;
  subscription['id'] = subscObj.id;
  subscriptionList.push(subscription);
}

function secondsToString(seconds) {
    var numdays = Math.floor(seconds / 86400);
    var numhours = Math.floor((seconds % 86400) / 3600);
    var numminutes = td(Math.floor(((seconds % 86400) % 3600) / 60));
    var numseconds = td(((seconds % 86400) % 3600) % 60);
    return numdays + " days " + numhours + ":" + numminutes + ":" + numseconds;
}
function td(n){
    return n > 9 ? "" + n: "0" + n;
}

function parseResponse(jsonObj) {
    var toNumber = jsonObj['from']['phoneNumber'];
    var command = jsonObj['subject'];
    // for using with sandbox account
    var watermark = "Test SMS using a RingCentral Developer account - "
    var index = command.indexOf(watermark)
    var payload = command;
    if (index > -1) {
        payload = command.substr(watermark.length, command.length)
    }
    payload = payload.toLowerCase().trim()

    if (payload == "?" || payload == "help") {
        var response = 'For currency symbols, send "symbol/n", where "n" is the first alphabet letter of a country name.\nFor exchange rate, send e.g. "eur/usd", where "eur" is the base and "usd" is the target.';
        return platform
            .post('/account/~/extension/~/sms', {
                from: {'phoneNumber': process.env.RC_USERNAME},
                to: [{'phoneNumber': toNumber}],
                text: response
            })
            .then(function (response) {
                //var data = response.json();
                //console.log(response);
            });
    } else if (payload.includes('/')) {
        var currencies = payload.split("/");
        var currencyBase = currencies[0].trim().toUpperCase();
        var currencyTarget = currencies[1].trim().toUpperCase();
        if (currencyBase == "SYMBOL") {
            currencyTarget = currencyTarget.toLowerCase();
            var symbols = currencySymbols[currencyTarget];
            return sendSMSMessage(toNumber, symbols)
        } else if (currencyBase.length == 3 && currencyTarget.length == 3) {
            var host = 'api.fixer.io'
            var path = '/latest?base=' + currencyBase + '&symbols=' + currencyTarget;
            http.get({
                host: host,
                path: path
            }, function(response) {
                // Continuously update stream with data
                var body = '';
                response.on('data', function(d) {
                    body += d;
                });
                response.on('end', function() {
                    // Data reception is done
                    var parsed = JSON.parse(body);
                    var exchageRate = '1' + parsed.base + '=>' + parsed.rates[currencyTarget] + currencyTarget;
                    console.log(exchageRate);
                    return sendSMSMessage(toNumber, exchageRate)
                });
            });
        } else {
           var textMessage = 'Invalid currency symbol!'
           return sendSMSMessage(toNumber, textMessage)
        }
    } else {
        var textMessage = 'Invalid command format!'
        return sendSMSMessage(toNumber, textMessage)
    }
}

function sendSMSMessage(toNumber, textMessage) {
    return platform.post('/account/~/extension/~/sms', {
         from: {'phoneNumber': process.env.RC_USERNAME},
         to: [{'phoneNumber': toNumber}],
         text: textMessage
       })
       .then(function (response) {

       });
}
