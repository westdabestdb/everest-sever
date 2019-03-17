var express = require('express');
var router = express.Router();
var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nomail-f7abe.firebaseio.com"
});


function sendMessage(token, task) {
  var content = {
    title: task.name,
    body: 'This task is due'
  }

  var message = {
    notification: content,
    data: content,
    token: token
  }

  admin.messaging().send(message)
    .then(function () {
      console.log('success message id: ');
    })
    .catch(function (err) {
      console.log('error sending msg', err);
    })
}

/* POST sent task */
router.post('/', function (req, res, next) {
  console.log(req.body);
  sendMessage(req.body.fcmToken, req.body.task);
});

module.exports = router;
