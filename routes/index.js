var express = require('express');
var router = express.Router();
var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");
var nlp = require('compromise');
var moment = require('moment');
var schedule = require('node-schedule');
var hash = require('object-hash');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var scheduledJobs = {}

function cancelJob(name) {
  var taskHash = hash(name);
  var scheduler = schedule.scheduledJobs[taskHash];
  scheduler.cancel();
}

// get task name
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
    console.log(dateDue.day.format());
    // if (dateDue.notify) this.scheduleTask(dateDue.day, task);
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
    var notifyYesOrNo = false;

    if (dateCalendar.year !== null) momentDay.year(dateCalendar.year);
    if (dateCalendar.month !== null) momentDay.month(dateCalendar.month);
    if (dateCalendar.date !== null) momentDay.date(dateCalendar.date);

    if (time !== null) {
      if (time.hour !== null) {
        notifyYesOrNo = true;
        momentDay.hour(time.hour);
      }

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

    return {
      day: momentDay,
      notify: notifyYesOrNo
    };
  },
  getNLPDate: function (taskName) {
    var NLPDate = nlp(taskName).dates().data();
    return NLPDate;
  },
  scheduleTask: function (dateDue, taskName) {
    var taskHash = hash(taskName);
    var getThatScheduled = dateDue.toDate();

    schedule.scheduleJob(taskHash, getThatScheduled, () => {
      var message = {
        data: {
          title: taskName,
          body: 'This task is due'
        },
        token: token
      }

      admin.messaging().send(message)
    });
  }
}

// 42.3601,-71.0589

var processWeather = {
  apiKey: '23ad00a63f02fa425fea6b4346f80809',
  getWeather: function (coordinates) {
    var forecastURL = 'https://api.darksky.net/forecast/';
    forecastURL += this.apiKey + '/';
    forecastURL += coordinates + '?';
    forecastURL += 'exclude=[alerts,flags]';

    // this.fetchApi(forecastURL, this.printResponse);

  },
  fetchApi: function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
  },
  printResponse: function (callback) {
    console.log(callback);
  }
}

processWeather.getWeather('42.3601,-71.0589');

// init
smartProcessing.mount()



/* POST sent task */
router.post('/', function (req, res, next) {
  var task = req.body.task;
  var timezone = req.body.timezone;
  var today = parseInt(req.body.today);
  smartProcessing.processTask(task, timezone, today);
});

router.post('/weather', function (req, res, next) {

});

router.post('/cancel', function (req, res, next) {
  var taskName = req.body.tasName;
  cancelJob(taskName);
});


module.exports = router;
