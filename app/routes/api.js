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
		
