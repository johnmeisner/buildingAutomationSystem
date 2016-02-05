'use strict';

var path = require('path'),
    Datastore = require('nedb');

var db1 = {
    users: new Datastore({ filename: path.join(__dirname, 'users.db'), autoload: true })
};

var users = {
    get: function (username, callback) {
        db1.users.findOne({ username: username }, function (err, user) {
            if (err || !user) { return callback(new Error('User not found.')); }         callback(null, user.username);
        });
    },

    create: function (username, password, callback) {
        var d = new Date();
	    console.log("db1: " + d);
//        db.mappings.insert({ alias: alias, url: url, timestamp: d.getTime()}, callback);
        db1.users.insert({ username: username, password: password, timestamp: d}, callback);
  },

    list: function (callback) {
        console.log("users: list()");
        db1.users.find({}).sort({ timestamp: -1 }).exec(callback);
    },
	
	latest: function (callback) {                                       // this method returns the most recent temp
		db1.users.find({}).sort({ timestamp: -1 }).exec(callback);
	}
};

module.exports = users;