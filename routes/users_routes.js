'use strict';

var User = require('../models/user');
var Game = require('../models/game');

module.exports = function(app, auth) {

  //user log-in
  app.get('/api/user', function(req, res) {
    var passback = {};
    var email = req.query.email;
    var password = req.query.password;
    console.log('pw', password);
    console.log('email', email);

    User.findOne({email: email}, function(err, user) {
      if (err) return res.status(500).json({error: 1});
      if (!user) return res.status(400).json({error: 6});

      //check to see if password is valid
      if (!user.validPassword(password)) return res.status(400).json({error: 4});

      passback.email = user.email;
      passback.screename = user.screenname || '';
      passback.zip = user.zip || '';
      passback.avatar_url = user.avatar_url || '';
      res.status(200).json({error: 0, jwt: user.generateToken(app.get('jwtSecret')), profile: passback });
    });
  });

  //creating a new user
  app.post('/api/user', function(req, res) {
    var passback = {};
    var email = req.query.email;
    var password = req.query.password;
    var screenname = req.query.screenname;
    var loc = req.query.zip;
    var avatar_url = req.query.avatar_url;

    User.findOne({email: email}, function(err, user) {
      if (err) return res.status(400).json({error: 1});

      if (user) return res.status(400).json({error: 2});

      if (req.body.password && (req.body.password === req.body.email)) {
        return res.status(400).json({error:3});
      }

      //password pattern: any 8-12 character length combo of ASCII
      //with at least one number and one letter
      var passwordPattern = /^(?=.*\d+)(?=.*[a-z A-Z])[ -~]{8,12}$/;
      if (!passwordPattern.test(password)) {
        return res.status(400).json({error: 4});
      }

      var newUser = new User();
      newUser.email = email;
      newUser.password = newUser.generateHash(password);
      newUser.screenname = screenname;
      newUser.zip = loc;

      passback.email = newUser.email;
      passback.screename = newUser.screenname || '';
      passback.zip = newUser.zip || '';
      passback.avatar_url = newUser.avatar_url || '';

      newUser.save(function(err, data) {
        if (err) return res.status(400).json({error: 1});
        res.status(200).json({error:0, jwt: newUser.generateToken(app.get('jwtSecret')), profile: passback });
      });
    });
  });

  //get user profile upon sending jwt token
  app.get('/api/user/myprofile', auth, function(req, res) {
    var passback = {};
    User.findById(req.user._id, function(err, myInfo) {
      if (err) return res.status(400).json({error:1});
      passback.email = myInfo.email;
      passback.screename = myInfo.screenname;
      passback.zip = myInfo.zip;
      passback.avatar_url = myInfo.avatar_url;
      res.status(200).json({error: 0, profile:passback});
    });

  });

  //allow user to update avatar_url upon sending jwt token
  app.put('/api/user', auth, function(req, res) {
    var passback = {};
    var avatar_url = req.body.avatar_url;
    User.findById(req.user._id, function(err, user) {
      if (err) return res.status(400).json({error:1});
      user.avatar_url = avatar_url;
      passback.email = user.email;
      passback.screename = user.screenname || '';
      passback.zip = user.zip || '';
      passback.avatar_url = user.avatar_url || '';

      user.save(function(err, data) {
        if (err) return res.status(400).json({error: 1});
      });
      res.status(200).json({error: 0, profile:passback});
    });
  });
};
