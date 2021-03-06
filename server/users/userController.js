// Controller for route handling user
var User = require('./userModel.js');
var Trip = require('../trips/tripModel.js');
var jwt = require('jwt-simple');

module.exports = {

  // Check if username exists; if not, create new user
  signup: function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    User.findOne({ username: username }, function(error, user) {
      if (user) {
        console.log('User already exists');
        res.sendStatus(422);
      } else {
        var newUser = {
          username: username,
          password: password
        };

        User.create(newUser, function(error, user) {
          if (error) {
            console.log('Error creating new user: ', error);
          }

          var token = jwt.encode({ id: user._id }, 'superdupersecret');
          res.status(201).json({
            user: user._id,
            token: token
          });
        });
      }
    });
  },

  // Check if user exists, then compare password to hash
  signin: function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    User.findOne({ username: username }, function(error, user) {
      if (!user) {
        console.log('User does not exist');
        res.sendStatus(404);
      } else {
        user.comparePasswords(password)
          .then(function(match) {
            if (match && user.currentTrip) {
              Trip.findOne({ _id: user.currentTrip }, function(error, trip) {
                var token = jwt.encode({ id: user._id }, 'superdupersecret');
                res.status(200).json({
                  user: user._id,
                  token: token,
                  trip: trip
                });
              });
            } else if (match) {
              var token = jwt.encode({ id: user._id }, 'superdupersecret');
              res.status(200).json({
                user: user._id,
                token: token,
                trip: null
              });                
            } else {
              console.log('Incorrect password');
              res.sendStatus(403);
            }
          })
          .fail(function(error) {
            next(error);
          });
      }
    });
  }
};
