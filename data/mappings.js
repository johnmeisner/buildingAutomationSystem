'use strict';

var path = require('path'),
    Datastore = require('nedb');

var db = {
    mappings: new Datastore({ filename: path.join(__dirname, 'mappings.db'), autoload: true })
};

var mappings = {
    get: function (alias, callback) {
        db.mappings.findOne({ alias: alias }, function (err, mapping) {
            if (err || !mapping) { return callback(new Error('Alias not found.')); }
            callback(null, mapping.url);
        });
    },

    create: function (alias, url, callback) {
        var d = new Date();
	    console.log("db: " + d);
        db.mappings.insert({ alias: alias, url: url, timestamp: d}, callback);
  },

    list: function (callback) {
        console.log("mappings: list()");
        db.mappings.find({}).sort({ timestamp: -1 }).exec(callback);
    }
};

module.exports = mappings;
