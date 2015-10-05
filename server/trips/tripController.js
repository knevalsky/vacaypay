var User = require('../../server/users/userModel.js');
var Trip = require('./tripModel.js');
var PastTrip = require('./pastTripModel.js');

module.exports = {
	// TODO:
	// Look up the database to find requested users current trip.
	getCurrentTrip: function(req, res){
		var id = req.query.id;
		User.findById(id, function(err, user){
			Trip.findById(user.currentTrip, function(err, currenttrip){
				if(currenttrip === null){
					user.currentTrip = null;
					user.save(err, function(){
						res.status(200).send(currenttrip).end();
						return;
					})
				}
				res.status(200).send(currenttrip).end();
				return;
			})
		})
	},

	// Create a new trip under the user
	createTrip: function(req, res){
		var data = req.body;
		var id = data.id;
		var tripName = data.name;
		var code = data.code;
		User.findById(id, function(err, user){
			if(err) {
				console.log('User not found');
				res.status(404).end();
				return;
			}
			Trip.create({
				creator: {id: user._id, username: user.username},
				participants: [{id: user._id, username: user.username}],
				name: tripName,
				code: code,
				expenses: []
			}, function(err, newTrip){
				if(err) {
					console.log('code is already taken');
					res.status(422).end();
					return;
				}
				user.currentTrip = newTrip._id;
				user.save( function (err, result) {
					res.status(201).send(newTrip).end();
					return;
				});
			});
		})
	},

	// Add user to the participant list of designated trip
	joinTrip: function(req, res){
		var data = req.body;
		var id = data.id;
		var code = data.code;

		Trip.findOne({code:code}, function(err, trip){
			if(err){
				console.log('Such code does not exist');
				res.status(404).end('Such code does not exist');
				return;
			}

			User.findById(id, function(err, user){
				if(err){
					console.log('couldn\'t find user for some reason');
					res.status(404).end('User not found');
					return;
				}
				user.currentTrip = trip._id;
				trip.participants.push({id: user._id, username: user.username});
				trip.save(function(err, tripresult){
					if (err) {
						console.log('Problem updating trip');
						res.status(500).send(trip).end();
						return;
					}
					user.save(function(err, userresult){
						res.status(200).send(tripresult).end();
						return;
					})
				});
			});
		});
	},

	// Add expense to the trip
	addExpense: function(req, res){
		var data = req.body;
		var id = data.id;
		var name = data.name;
		var amount = data.amount;
		var stakeholders = data.stakeholders;

		User.findById(id, function(err, user){
			Trip.findById(user.currentTrip, function(err, trip){
				if(err) {
					console.log('Trip with given user as participant not found');
					res.status(404).end();
					return
				}

				var newExpense = {
					name: name,
					amount: amount,
					payer: {id: user._id, username: user.username},
					stakeholders: stakeholders
				}

				trip.expenses.push(newExpense);

				trip.save(function(err, trip){
					if(err) console.log('Error saving trip');
					res.status(201).send(trip).end();
					return;
				});
			});
		});
	},

	// Replicate current trip to old trip and then delete current trip 
	endTrip: function(req, res){
		var id = req.body._id;
		var data = req.body;
		delete data._id;
		PastTrip.create(data, function(err, past){
			if(err){
				console.log('error creating past trip');
				res.status(500).end();
				return;
			} 

			Trip.findByIdAndRemove(id, function(err, result){
				if (err) console.log(err);
				res.status(201).end();
				return;
			});
		})
	},

	// Get the most recent finished trip of requested user
	getRecent: function(req, res){
		var id = req.query.id;
		//this is the hardcoded part... issues with mongo query
		// {},{$sort: {'_id':-1}},
		PastTrip.find({}, function(err, trip){
			if(err){
				console.log('Trip with user as participant not found');
				res.status(500).end();
				return;
			}
			res.status(200).send(trip).end();
			return;
		})
	}
}