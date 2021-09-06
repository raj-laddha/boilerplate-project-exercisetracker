const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/userDB.js')
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(express.urlencoded({extended: false}));

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
  if (err) return console.log(err);

  console.log('DB Connected')
});

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let user = new User({
    username: username
  });

  user.save((err) => {
    if (err) {
      console.log(err);
      return res.send('Error: Could not save to the database');
    }

    res.json({
      username: user.username,
      _id: user._id
    });
  });

});

app.get('/api/users', (req, res) => {
  User.find({})
      .select(({
        _id: 1,
        username: 1,
      }))
      .exec((err, users) => {
        if (err) {
          console.log(err);
          return res.send('Error: Could not process the request');
        }

        res.json(users);
      });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let id = req.params._id;
  const REGEX = /[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/i;

  let date = req.body.date === '' ? new Date() : new Date(req.body.date);

  if ((req.body.date !== '' && !REGEX.test(req.body.date)) || date.toDateString() === 'Invalid Date') {
    return res.send('Invalid Date');
  } 

  let logRecord = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: date
  };

  User.findByIdAndUpdate(id, { $push: { log: logRecord } }, (err, user) => {
    if (err) {
      console.log(err);
      return res.send(err.message);
    }

    res.json({
      username: user.username,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: date.toString(),
      _id: user._id
    });

  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  let id = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = parseInt(req.query.limit);
  let fromDate = new Date(from);
  let toDate = new Date(to);

  const REGEX = /[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/i;

  if (!REGEX.test(from) || fromDate.toDateString() === 'Invalid Date') {
    fromDate = undefined;
  }

  if (!REGEX.test(to) || toDate.toDateString() === 'Invalid Date') {
    toDate = undefined;
  }

  User.findById(id)
    .select({
      username: 1,
      _id: 1,
      log: 1
    }).exec((err, user) => {
      if (err) {
        console.log(err);
        return res.send(err.message);
      }

      user.log.sort((log1, log2) => log1.date.getTime() - log2.date.getTime());

      let start = 0;
      let end = user.log.length;

      if (fromDate) {
        for (let i = 0; i < user.log.length; i += 1) {
          if (user.log[i].date.getTime() >= fromDate.getTime()) {
            start = i;
            break;
          }
        }
      }

      if (toDate) {
        for (let i = start; i < user.log.length; i += 1) {
          if (user.log[i].date.getTime() >= toDate.getTime()) {
            end = i;
            break;
          }
        }
      }


      user.log = user.log.slice(start, end);
      if (limit || limit === 0) {
        user.log = user.log.slice(0, limit);
      }

      let filteredLog = user.log.map((curr) => {
        return {
          description: curr.description,
          duration: curr.duration,
          date: curr.date.toDateString()
        }
      });

      let resJSON = {
        username: user.username,
        _id: user._id,
        count: user.log.length,
        log: filteredLog
      };
      res.json(resJSON);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
