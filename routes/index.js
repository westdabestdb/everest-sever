var express = require('express');
var router = express.Router();
var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nomail-f7abe.firebaseio.com"
});


function parseDate(date) {
  return moment.utc(date).format();
}


function sendMessage(data) {
  data = JSON.parse(data);

  var UTCdate = parseDate(data.date);
  var message = {
    data: {

    },
    token: token
  }

  admin.messaging().send(message)
}


/* POST sent task */
router.post('/', function (req, res, next) {
  console.log(req.body);
  sendMessage(token);
});

module.exports = router;
