// https://www.freecodecamp.org/news/express-explained-with-examples-installation-routing-middleware-and-more/
// https://medium.com/@viral_shah/express-middlewares-demystified-f0c2c37ea6a1
// https://www.sohamkamani.com/blog/2018/05/30/understanding-how-expressjs-works/

var port = 8000; 
var express = require('express');
var app = express();
const DAO = require('./DAO');

var path = require('path');

const { Pool } = require('pg')
const pool = new Pool({
    user: 'webdbuser',
    host: 'postgres',
    database: 'webdb',
    password: 'password',
    port: 5432
});

const bodyParser = require('body-parser'); // we used this middleware to parse POST bodies

function isObject(o){ return typeof o === 'object' && o !== null; }
function isNaturalNumber(value) { return /^\d+$/.test(value); }

app.use(bodyParser.json());

// Non authenticated route. Can visit this without credentials
app.post('/api/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got here"}); 
});

app.post('/api/user', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var birthday = req.body.birthday;
	//console.log('birthday' + birthday);
	var skill = req.body.skill;


	DAO.createUser(username, password, birthday, skill);
	res.status(200);
	res.json({});
});

app.get('/api/user/:username', function(req, res) {
	//var username = req.body.username;
	var username = req.params.username;
	//console.log("u" + username);
	DAO.getUser(username, function(error, result) {
		if (result == 'na') {
			res.status(201); //user does not exist
			res.send();
		} else if (!error) {
			res.status(200);
			res.json(result);
		} else {
			console.log(error);
		}
	});
});



/** 
 * This is middleware to restrict access to subroutes of /api/auth/ 
 * To get past this middleware, all requests should be sent with appropriate
 * credentials. Now this is not secure, but this is a first step.
 *
 * Authorization: Basic YXJub2xkOnNwaWRlcm1hbg==
 * Authorization: Basic " + btoa("arnold:spiderman"); in javascript
**/
app.use('/api/auth', function (req, res,next) {
	if (!req.headers.authorization) {
		return res.status(403).json({ error: 'No credentials sent!' });
  	}
	try {
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);

		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this

		var username = m[1];
		var password = m[2];

		console.log(username+" "+password);

		let sql = 'SELECT * FROM ftduser WHERE username=$1 and password=sha512($2)';
        	pool.query(sql, [username, password], (err, pgRes) => {
  			if (err){
                		res.status(403).json({ error: 'Not authorized'});
			} else if(pgRes.rowCount == 1){
				next(); 
			} else {
                		res.status(403).json({ error: 'Not authorized'});
        		}
		});
	} catch(err) {
               	res.status(403).json({ error: 'Not authorized'});
	}
});

// All routes below /api/auth require credentials 
app.post('/api/auth/login', function (req, res) {
	res.status(200); 
	res.json({"message":"authentication success"}); 
});

app.post('/api/auth/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got to /api/auth/test"}); 
});

app.put('/api/auth/user', function(req, res) {
	var newUsername = req.body.newUsername;
	var oldUsername = req.body.oldUsername;
	var password = req.body.password;
	var birthday = req.body.birthday;
	var skill = req.body.skill;

	DAO.updateUser(newUsername, oldUsername, password, birthday, skill);
	res.status(200);
	res.json({});
});

app.put('/api/auth/score', function(req, res) {
	var username = req.body.username;
	var score = req.body.score;
	DAO.updateScore(username, score);
	res.status(200);
	res.json({});
})

app.delete('/api/auth/user', function(req, res) {
	var username = req.body.username;
	console.log("delete" + username);
	DAO.deleteUser(username);
	res.status(200);
	res.send();
});

app.get('/api/auth/user', function(req, res) {
	DAO.getUsers(function(result) {
		res.status(200);
		res.json(result);
	})
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/',express.static('static_content')); 

app.listen(port, function () {
  	console.log('Example app listening on port '+port);
});

