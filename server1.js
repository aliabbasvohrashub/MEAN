// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRouter.post('/authenticate', function(req, res) {

	console.log('username ' + req.body.username );
	console.log('password ' + req.body.password);


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
					 var token = jwt.sign({
					 name: user.name,
					 username: user.username
					 }, superSecret, {
					 expiresInMinutes: 1440 // expires in 24 hours
				 });

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