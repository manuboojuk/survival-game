const { Pool } = require('pg')
const pool = new Pool({
    user: 'webdbuser',
    host: 'localhost',
    database: 'webdb',
    password: 'password',
    port: 5432
});

module.exports = {
    // add new user to db
    createUser: function(username, password, birthday, skill) {
        let sql = 'INSERT INTO ftduser(username, password, birthday, skill) VALUES ($1, sha512($2), $3, $4)';
	    pool.query(sql, [username, password, birthday, skill], (err, pgRes) => {
            if (err) {
                console.log(err.stack);
            }
	    });
    },
    // return birthday, skill from db using username
    getUser: function(username, callback) {
        let sql = 'SELECT birthday, skill FROM ftduser where username=$1';
        pool.query(sql, [username], (err, pgRes) => {
            if (err) {
                callback(error);
                console.log(err.stack);
            } else if (pgRes.rowCount == 0) {
                callback(0, 'na');
            } else {
                var user = {
                    "birthday" : "",
                    "skill": ""
                };
                user["birthday"] = pgRes.rows[0]['birthday'];
                user["skill"] = pgRes.rows[0]['skill'];
                callback(0, user);  
            }
        });
    },
    // return 10 users with the highest scores
    getUsers: function(callback) {
        let sql = 'SELECT username, highscore from ftduser ORDER BY highscore DESC LIMIT 10';
        pool.query(sql, [], (err, pgRes) => {
            if (err) {
                console.log(err.stack);
            } else {
                var users = {};
                var i;
                for (i = 0; i < pgRes.rowCount; i++) {
                    users[pgRes.rows[i]['username']] = pgRes.rows[i]['highscore'];
                }
                callback(users);
            }
        })
    },
    // update user attributes
    // update password only if a new password is submitted
    updateUser: function(newUsername, oldUsername, password, birthday, skill) {
        let sql = 'UPDATE ftduser SET birthday=$1, skill=$2, username=$3 where username = $4';
        pool.query(sql, [birthday, skill, newUsername, oldUsername], (err, pgRes) => {
            if (err) {
                console.log(err.stack);
            }
        });
        if (password != "") {
            sql = 'UPDATE ftduser SET password=sha512($1) where username=$2';
            pool.query(sql, [password, newUsername], (err, pgRes) => {
                if (err) {
                    console.log(err.stack);
                }
            })
        }
    },
    // remove user from db
    deleteUser: function(username) {
        let sql = 'DELETE from ftduser where username=$1';
        pool.query(sql, [username], (err, pgRes) => {
            if (err) {
                console.log(err.stack);
            }
        })
    },
    // update a users highscore if score > highscore
    updateScore: function(username, score) {
        let sql = 'SELECT highscore FROM ftduser where username=$1';
        pool.query(sql, [username], (err, pgRes) => {
            if (err) {
                console.log(err.stack);
            } else {
                if (pgRes.rows[0]['highscore'] < score) {
                    sql = 'UPDATE ftduser SET highscore=$1 where username=$2';
                    pool.query(sql, [score, username], (err, pgRes) => {
                        if (err) {
                            console.log(err.stack);
                        }
                    })
                }
            }
        })
    }
}