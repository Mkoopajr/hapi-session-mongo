var Mongo = require('mongodb'),
    Db = Mongo.Db,
    Server = Mongo.Server;

var Iron = require('iron'),
    Hoek = require('hoek');

// For a Iron cookie
var regex = /Fe26[a-zA-Z0-9*._-]*/;

module.exports = function(options) {
    var ip = (options.ip) ? options.ip : '127.0.0.1',
        port = (options.port) ? options.port : 27017,
        dbName = (options.db) ? options.db : 'test',
        dbUser = (options.name) ? options.name : undefined,
        dbPwd = (options.pwd) ? options.pwd : undefined,
        ssl = (options.ssl) ? options.ssl : false,
        ttl = (options.ttl) ? options.ttl : 0;

    var metallurgy = Hoek.clone(Iron.defaults);
    metallurgy.ttl = ttl;

    var server = new Server(ip, port, {ssl: ssl}),
        db = new Db(dbName, server, {w: 1});

    var User = {};

    User.login = function(name, password, callback) {
        db.open(function(err, db) {
            db.authenticate(name, password, function(err, result) {
                if (result === true) {

                    var user = {
                        user: name,
                        pwd: password,
                    };

                    db.authenticate(dbUser, dbPwd, function(err, result) {
                        db.createCollection('session', function(err, collection) {
                            if (err) {db.close(); return callback(err)};

                            Iron.seal(user, dbPwd, metallurgy, function(err, sealed) {
                                
                                collection.insert({_id: sealed, createdAt: new Date(), name: name},
                                function(err, data) {
                                    db.close();
                                    return callback(sealed);
                                });
                            });
                        });
                    });
                }
                else {
                    db.close();
                    return callback(false);
                }
            });
        });
    };

    User.get = function(cookie, callback) {
        if (cookie != false && cookie != undefined && cookie.match(regex) != null) {
            cookie = cookie.match(regex);
            cookie = cookie[0];
            db.open(function(err, db) {
                db.authenticate(dbUser, dbPwd, function(err, result) {
                    db.collection('session', function(err, collection) {
                        collection.findOne({_id: cookie}, function(err, data) {
                            if (data != null) {
                                Iron.unseal(cookie, dbPwd, metallurgy, function(err, unsealed) {

                                    if (unsealed === undefined) {
                                        collection.remove({_id: cookie}, function(err, removed) {
                                            db.close();
                                            return callback(false);
                                        });
                                    }
                                    else {
                                        db.close();
                                        return callback(true); 
                                    }
                                });
                            }
                            else {
                                db.close();
                                return callback(false);
                            }
                        });
                    });
                });
            });
        }
        else {
            return callback(false);
        }
    };

    return User;
};
