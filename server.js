// BASE SETUP
// ======================================

// CALL THE PACKAGES --------------------
var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser'); // get body-parser
var morgan = require('morgan'); // used to see requests
var mongoose = require('mongoose'); // for working w/ our database
var port = process.env.PORT || 8080; // set the port for our app
var jwt = require('jsonwebtoken');
var path = require('path');

app.use(express.static(__dirname + '/public'));

app.get('*', function(req, res){
	res.sendFile(path.join(__dirname + '/public/views/index.html'))
});


var superSecret = "fsdgSDFGS#^#634fgsl346sdg&$%&FHGDFHFHDFHFHFGH";

var User = require('./models/user');
mongoose.connect('mongodb://localhost/May7');

 // APP CONFIGURATION ---------------------
 // use body parser so we can grab information from POST requests
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());

 // configure our app to handle CORS requests
 app.use(function(req, res, next) {
	 res.setHeader('Access-Control-Allow-Origin', '*');
	 res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	 res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	 next();
 });

 // log all requests to the console
 app.use(morgan('dev'));

 // ROUTES FOR OUR API
 // =============================

 // basic route for the home page
 app.get('/', function(req, res) {
 res.send('Welcome to the home page!');
 });

 // get an instance of the express router
 var apiRouter = express.Router();

 // test route to make sure everything is working
 // accessed at GET http://localhost:8080/api

apiRouter.use(function(res, req, next){
	console.log('loggin in place for api router');
	next();
});

apiRouter.use(function(req, res, next){

	var token = req.body.token || req.query.token || req.headers["x-access-token"];

	if(token){
		jwt.verify(token, superSecret, function(err, decoded){
			if(err){
				return res.json({success:false, message:'Failed to authenticate token '});
			}
			else{
				req.decoded = decoded;
				next();
			}

		}); 
	}
		else{
			return res.json({success:false, message:'Token not provided '});	
		}
});

 apiRouter.get('/', function(req, res) {
	 res.json({ message: 'hooray! welcome to our api!' });	 
 });

 // more routes for our API will happen here


// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRouter.post('/authenticate', function(req, res) {

// find the user
// select the name username and password explicitly
	User.findOne({
		username: req.body.username
	}).select('name username password').exec(function(err, user) {

	 	if (err) throw err;
		
	 // no user with that username was found
		 if (!user) {
			 res.json({
			 success: false,
			 message: 'Authentication failed. User not found.' 
			 });
		 } else if (user) {

		console.log('user.name '+ user.name);
		console.log('user.username '+ user.username);
		console.log('user.password '+ user.password);
		console.log('req.body.password '+ req.body.password);

	 // check if password matches
		 var validPassword = user.comparePassword(req.body.password);
			 if (!validPassword) {
					 res.json({
					 success: false,
					 message: 'Authentication failed. Wrong password.'
					 });
				 } else { 
					 // if user is found and password is right
					 // create a token

					var token = jwt.sign(user, superSecret, {
					          expiresIn: '1d' // expires in 24 hours
					        });


					//  var token = jwt.sign({
					//  name: user.name,
					//  username: user.username
					//  }, superSecret, {
					//  expiresInMinutes: 1440 // expires in 24 hours
				 // });

		 // return the information including token as JSON
				 res.json({
					 success: true,
					 message: 'Enjoy your token!',
					 token: token
				 });
			 } 
	 	} 
	 });
 });
 

apiRouter.get('/me', function(req, res){
	res.send(req.decoded);
});

apiRouter.route('/users')
	.post(function(req, res){
			var user = new User();

			user.name = req.body.name;
			user.username = req.body.username;
			user.password = req.body.password;

			console.log('name '+ req.body.name);
			console.log('username '+ req.body.username);
			console.log('password '+ req.body.password);

			user.save(function(err){
				if(err){
					if(err.code == 11000){
						return res.json({success:false, message: 'A user with same name exists !!'});
					}
					else{
						console.log('err while saving user' + err.code +' '+ err);
						return res.send(err);
					}
				}
				return res.json({message : ' User Created !!!'});
			});
	})
	.get(function(req, res){
			//return res.json({message:'This is correct route get request received'}); 
			User.find(function(err, users){
				if(err)	res.send(err);
				res.json(users);
			}) ;
	});

	apiRouter.route('/users/:user_id')
		.get(function(req,res){
			//console.log('real route called');
			User.findById(req.params.user_id, function(err, user){
					if(err) res.send(err);
					res.json(user);	
			}); 
		})

		.put(function(req,res){
			User.findById(req.params.user_id, function(err, user){
					if(err) res.send(err); 

					if(user.name) user.name = req.body.name;										
					if(user.username) user.username = req.body.username;
					if(user.password) user.password = req.body.password; 
						user.save(function(err, user){
							if(err) res.send(err);
							res.json({message:'User updated successfully !'});
						});
			}); 
		})

		.delete(function(req, res){
			User.remove({_id:req.params.user_id},
				function(err, user){
					if(err) res.send(err);
					res.json({message:'user deleted successfully'}); 
			});
		});
		


 // REGISTER OUR ROUTES -------------------------------
 // all of our routes will be prefixed with /api
 app.use('/api', apiRouter);

 // START THE SERVER
 // ===============================
 app.listen(port);
 console.log('Magic happens on port ' + port); 