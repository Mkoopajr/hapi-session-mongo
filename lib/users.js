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
        dbUser = (options.name) ? options.name : null,
        dbPwd = (options.pwd) ? options.pwd : null,
        ssl = (options.ssl) ? options.ssl : false;

    var metallurgy = Hoek.clone(Iron.defaults);
    metallurgy.ttl = 300000;

    var server = new Server(ip, port, {ssl: ssl}),
        db = new Db(dbName, server);

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
                                
                                collection.insert({_id: sealed, name: name},
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
                    return callback('Name or Password incorrect');
                }
            });
        });
    };

    User.get = function(cookie, callback) {
        if (cookie != undefined && cookie.match(regex) != null) {
            cookie = cookie.match(regex);
            cookie = cookie[0];
            db.open(function(err, db) {
                db.authenticate(dbUser, dbPwd, function(err, result) {
                    db.collection('session', function(err, collection) {
                        Iron.unseal(cookie, dbPwd, metallurgy, function(err, unsealed) {
                            console.log(unsealed);

                            if (unsealed === undefined) {
                                collection.remove({_id: cookie}, function(err, removed) {
                                    db.close();
                                    return callback(false);
                                });
                            }
                            else {
                                collection.findOne({_id: cookie}, function(err, data) {
                                    db.close();
                                    return callback(true); 
                                });
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
