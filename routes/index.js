var express = require('express');
var router = express.Router();
var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");
var nlp = require('compromise');
var moment = require('moment');
var moment_tz = require('moment-timezone');


var smartProcessing = {
  mount: function () {
    this.initFirebase();
  },
  initFirebase: function () {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://nomail-f7abe.firebaseio.com"
    });
  },
  processTask: function (task, timezone, today) {
    var date = this.processDate(task, timezone, today);
    console.log(date.format());
  },
  processDate: function (task, timezone, today) {
    var nlpDate = nlp(task).dates().data();
    var dayINeed = nlpDate[0].date.weekday;

    switch (true) {
      case (dayINeed !== null):
        return this.processWeekday(dayINeed, timezone, today);
        break;
      default:
        console.error('An error ocurred');
        break;
    }
    // console.log(nlpDate)

  },
  processWeekday: function (dayINeed, timezone, today) {
    if (today <= dayINeed) {
      // then just give me this week's instance of that day
      return moment().isoWeekday(dayINeed);
    } else {
      // otherwise, give me *next week's* instance of that same day
      return moment().add(1, 'weeks').isoWeekday(dayINeed);
    }
  }
}

// init
smartProcessing.mount()


// function parseDate(date) {
//   return moment.utc(date).format();
// }


// function getNextWeekday(today, dayIneed) {

// }

// function sendMessage(data) {
//   data = JSON.parse(data);

//   var UTCdate = parseDate(data.date);
//   var message = {
//     data: {

//     },
//     token: token
//   }

//   admin.messaging().send(message)
// }


// function processTask(task) {
//   var date = processDate(task);
// }

// TODO: put a checker for named dates like 'today', 'tomorrow', 'this weekend', 'christmas', etc.


/* POST sent task */
router.post('/', function (req, res, next) {
  var task = req.body.task;
  var timezone = req.body.timezone;
  var today = req.body.today;
  smartProcessing.processTask(task, timezone, today);
});


module.exports = router;
