var Mongo = require('mongodb'),
    Db = Mongo.Db,
    Server = Mongo.Server;

var Iron = require('iron'),
    Hoek = require('hoek');

// For a Iron cookie
var regex = /Fe26[a-zA-Z0-9*._-]*/;

module.exports = function(options) {
    options = options || {};
    var ip = options.ip || '127.0.0.1',
        port = options.port || 27017,
        dbName = options.db || 'test',
        dbUser = options.name,
        dbPwd = options.pwd,
        ssl = options.ssl,
        ttl = options.ttl || 0;

    var metallurgy = Hoek.clone(Iron.defaults);
    metallurgy.ttl = ttl;

    var server = new Server(ip, port, {ssl: ssl}),
        db = new Db(dbName, server, {w: 1});

    var User = {};

    User.login = function(name, password, callback) {

        db.open(function(err, db) {
            if (err) {
                return callback(err);
            }

            db.authenticate(name, password, function(err, result) {
                if (err) {
                    db.close();
                    return callback(new Error('Invaild username or password'));
                }

                var user = {
                    user: name,
                    pwd: password
                };

                db.authenticate(dbUser, dbPwd, function(err, result) {
                    if (err) {
                        db.close();
                        return callback(new Error('Database handler incorrect'));
                    }

                    db.createCollection('session', function(err, collection) {
                        if (err) {
                            db.close();
                            return callback(err);
                        }

                        Iron.seal(user, dbPwd, metallurgy, function(err, sealed) {
                            if (err) {
                                db.close();
                                return callback(err);
                            }
                                
                            collection.insert({_id: sealed, createdAt: new Date(), name: name},
                            function(err, data) {
                                if (err) {
                                    db.close();
                                    return callback(err);
                                }

                                db.close();
                                return callback(null, sealed);
                            });
                        });
                    });
                });
            });
        });
    };

    User.get = function(cookie, callback) {
        if (!cookie || cookie.match(regex) == undefined) {
            return callback(new Error('Invalid cookie'));
        }

        cookie = cookie.match(regex);
        cookie = cookie[0];

        db.open(function(err, db) {
            if (err) {
                return callback(err);
            }

            db.authenticate(dbUser, dbPwd, function(err, result) {
                if (err) {
                    db.close();
                    return callback(new Error('Database handler incorrect'));
                }

                db.collection('session', function(err, collection) {
                    if (err) {
                        db.close();
                        return callback(err);
                    }

                    collection.findOne({_id: cookie}, function(err, data) {
                        if (err) {
                            db.close();
                            return callback(err);
                        }

                        if (data === null) {
                            db.close();
                            return callback(new Error('Not found'));
                        }
                        else {
                            Iron.unseal(cookie, dbPwd, metallurgy, function(err, unsealed) {
                                if (err) {
                                    collection.remove({_id: cookie}, function(err, removed) {
                                        db.close();
                                        return callback(err);
                                    });
                                }
                                else {
                                    db.close();
                                    return callback(null, true); 
                                }
                            });
                        }
                    });
                });
            });
        });
    };

    User.logout = function(cookie, callback) {
        if (!cookie || cookie.match(regex) == undefined) {
            return callback(new Error('Invalid cookie'));
        }

        cookie = cookie.match(regex);
        cookie = cookie[0];

        db.open(function(err, db) {
            if (err) {
                return callback(err);
            }

            db.authenticate(dbUser, dbPwd, function(err, result) {
                if (err) {
                    db.close();
                    return callback(new Error('Database handler incorrect'));
                }

                db.collection('session', function(err, collection) {
                    if (err) {
                        db.close();
                        return callback(err);
                    }

                    collection.remove({_id: cookie}, function(err, remove) {
                        if (err) {
                            return callback(err);
                        }

                        db.close();
                        return callback(null, remove);
                    });
                });
            });
        });
    };

    return User;
};
