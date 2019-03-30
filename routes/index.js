var express = require('express');
var router = express.Router();
var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");
var nlp = require('compromise');
var moment = require('moment');
var schedule = require('node-schedule');


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
    var dateDue = this.processDate(task, timezone, today);
    console.log(dateDue.format());
  },
  processDate: function (task, timezone, today) {
    var NLPDate = this.getNLPDate(task)
    var time = NLPDate[0]['date']['time'];
    var dayINeed = NLPDate[0].date.weekday;
    var named = NLPDate[0].date.named;
    var month = NLPDate[0].date.month;
    var date = NLPDate[0].date.date;

    switch (true) {
      case (dayINeed !== null):
        console.log(dayINeed);
        return this.processWeekday(dayINeed, timezone, today, time, NLPDate);
      case (named !== null):
        return this.processNamedDate(named, timezone, today, time, NLPDate);
      case (month !== null || date !== null):
        console.log('month or date')
        return this.processWithMonthOrDate(timezone, NLPDate);
      default:
        console.error('An error ocurred figuring out which type of date task this is');
        break;
    }
    // console.log(NLPDate)

  },
  processWeekday: function (dayINeed, timezone, today, time, NLPDate) {
    var dayINeed = parseInt(dayINeed)
    if (today <= dayINeed) {
      var day = moment().tz(timezone).isoWeekday(dayINeed);
      var adjustedDay = this.processHoursAndMinutes(day, NLPDate);
      return adjustedDay;
    } else {
      // otherwise, give me *next week's* instance of that same day
      var day = moment().tz(timezone).add(1, 'weeks').isoWeekday(dayINeed);
      var adjustedDay = this.processHoursAndMinutes(day, NLPDate);
      return adjustedDay;
    }
  },
  processNamedDate: function (named, timezone, today, time, NLPDate) {
    switch (true) {
      case (named == 'today'):
        // today appears twice because we got it from user and that's the date they wanted
        return this.processWeekday(today, timezone, today, time, NLPDate);
      case (named === 'tomorrow'):
        var dayINeed = today + 1; // tomorrow
        return this.processWeekday(dayINeed, timezone, today, time, NLPDate);
      default:
        console.error('An error ocurred processing the named date');
        break;
    }
  },
  processWithMonthOrDate: function (timezone, NLPDate) {
    var day = moment().tz(timezone);
    day = this.processHoursAndMinutes(day, NLPDate);
    return day;
  },
  processHoursAndMinutes: function (momentDay, NLPDate) {
    var dateCalendar = NLPDate[0].date;
    var time = NLPDate[0].date.time;

    if (dateCalendar.year !== null) momentDay.year(dateCalendar.year);
    if (dateCalendar.month !== null) momentDay.month(dateCalendar.month);
    if (dateCalendar.date !== null) momentDay.date(dateCalendar.date);

    if (time !== null) {
      if (time.hour !== null) momentDay.hour(time.hour);

      if (time.minute !== null) {
        momentDay.minute(time.minute);
      } else {
        momentDay.minute(0)
      }

      if (time.second !== null) {
        momentDay.second(time.second);
      } else {
        momentDay.second(0)
      }

    }

    return momentDay;
  },
  getNLPDate: function (taskName) {
    var NLPDate = nlp(taskName).dates().data();
    return NLPDate;
  },
  scheduleTask: function (dateDue) {
    var getThatScheduled = dateDue.toDate();
    var doItBrother = schedule.scheduleJob(getThatScheduled, () => {
      console.log('You did it Abdul! You did it')
    });
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
  var today = parseInt(req.body.today);
  smartProcessing.processTask(task, timezone, today);
});


module.exports = router;
