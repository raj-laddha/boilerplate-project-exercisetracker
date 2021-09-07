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
app.use(express.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
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
  let duration = parseInt(req.body.duration);
  let date = req.body.date === '' || !req.body.date ? new Date() : new Date(req.body.date);

  if (date.toDateString() === 'Invalid Date') {
    console.log('Invalid Date');
    return res.send('Invalid Date');
  }

  if (req.body.description == '') {
    console.log('Invalid description');
    return res.send('Invalid description');
  }

  if (!duration && duration !== 0) {
    console.log('Invalid Duration');
    return res.send('Invalid duration');
  }

  User.findByIdAndUpdate(id, {
    $push: {
      log: {
        description: req.body.description,
        duration: duration,
        date: date
      }
    }
  }, {new: true}, (err, user) => {
    if (err) {
      console.log(err);
      return res.send(err.message);
    }

    res.json({
      username: user.username,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: date.toDateString(),
      _id: user._id
    });

  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  let id = req.params._id;
  let _from = req.query.from;
  let to = req.query.to;
  let limit = parseInt(req.query.limit);
  let fromDate = new Date(_from);
  let toDate = new Date(to);

  const REGEX = /[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/i;

  if (!REGEX.test(_from) || fromDate.toDateString() === 'Invalid Date') {
    fromDate = undefined;
  }

  if (!REGEX.test(to) || toDate.toDateString() === 'Invalid Date') {
    toDate = undefined;
  }

  User.findById(id, (err, user) => {
      if (err) {
        console.log(err);
        return res.send(err.message);
      }

      if (!user) {
        return res.send('Invalid user id');
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
      if (limit) {
        user.log = user.log.slice(0, limit);
      }


      let filteredLog = user.log.map((curr) => {
        return {
          description: curr.description,
          duration: curr.duration,
          date: curr.date.toDateString()
        }
      });


      res.json({
        username: user.username,
        _id: user._id,
        count: filteredLog.length,
        log: filteredLog
      });
;
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
