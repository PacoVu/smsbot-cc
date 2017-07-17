
var rc_server = require('./server');

var multer  = require('multer')
var upload = multer({ dest: 'tempFile/' })
//var upload = multer()

module.exports = function (app) {

  app.get('/', function (req, res) {
     rc_server.listSubscription(res);
  })
  app.get('/about', function (req, res) {
     res.render('about')
  })

  app.post('/startsubscription', function (req, res) {
     console.log("Start a subscription");
     rc_server.startSubscription(res);
  })

  app.post('/listsubscription', function (req, res) {
     console.log("Get list of active subscriptions");
     rc_server.listSubscription(res);
  })

  app.post('/deletesubscription', function (req, res) {
     console.log("Delete an active subscription");
     rc_server.deleteSubscription(req, res);
  })
  app.post('/webhooks', function (req, res) {
     console.log("webhooks called")
     rc_server.handleWebhooksPost(req, res);
  })

  app.get('/sendsms', function (req, res) {
     console.log("Switch to send message demo");
     res.render('sendsms')
  })
/*
  app.post('/sendmessage', function (req, res) {
     console.log("Send a message");
     console.log(req)
     rc_server.sendSMSMessage(req, res);
  })
*/

  app.post('/sendmessage', upload.single('attachment'), function (req, res) {
     console.log("Send a message");
     if (req.body.msgtype == "mms")
        rc_server.sendMMSMessage(req, res)
     else if (req.body.msgtype == "fax")
        rc_server.sendFAXMessage(req, res);
     else
        rc_server.sendSMSMessage(req, res);
  })

}
