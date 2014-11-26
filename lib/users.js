var Mongo = require('mongodb'),
    Db = Mongo.Db,
    Server = Mongo.Server;

var Iron = require('iron'),
    Hoek = require('hoek'),
    bcrypt = require('bcrypt');

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

    User.loginCr = function(user, callback) {

        if (!user.name || !user.pwd) {
            return callback(new Error('Login requires name and password'));
        }

        db.open(function(err, db) {
            if (err) {
                return callback(err);
            }

            db.authenticate(user.name, user.pwd, function(err, result) {
                if (err) {
                    db.close();
                    return callback(new Error('Invaild username or password'));
                }

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

                        Iron.seal(user.name, dbPwd, metallurgy, function(err, sealed) {
                            if (err) {
                                db.close();
                                return callback(err);
                            }
                                
                            collection.insert({_id: sealed, createdAt: new Date(), name: user.name},
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

    User.loginLocal = function(user, seal, callback) {

        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        } 

        user = args.shift();
        callback = args.pop();
        seal = (args.length > 0) ? args.pop() : {name: 'local.name'};

        if (!user.name || !user.pwd) {
            return callback(new Error('Login requires name and password'));
        }

        db.open(function(err, db) {
            if (err) {
                return callback(err);
            }

            db.authenticate(dbUser, dbPwd, function(err, result) {
                if (err) {
                    db.close();
                    return callback(new Error('Database handler incorrect'));
                }

                var collection = db.collection('users'),
                    store = db.collection('session');

                collection.findOne({'local.name': user.name}, function(err, data) {
                    if (err) {
                        db.close();
                        return callback(err);
                    }

                    if (data === null) {
                        db.close();
                        return callback(new Error('Invalid user name or password'));
                    }
                    else {
                        bcrypt.compare(user.pwd, data.local.pwd, function(err, valid) {
                            if (err) {
                                db.close();
                                return callback(err);
                            }

                            if (!valid) {
                                db.close();
                                return callback(new Error('Invalid user name or password'));
                            }
                            else {
                                for (var key in seal) {
                                    seal[key] = eval('data.' + seal[key]);
                                }

                                Iron.seal(seal, dbPwd, metallurgy, function(err, sealed) {
                                    if (err) {
                                        db.close();
                                        return callback(err);
                                    }
                                
                                    store.insert({_id: sealed, createdAt: new Date(), name: user.name},
                                    function(err, data) {
                                        if (err) {
                                            db.close();
                                            return callback(err);
                                        }

                                        db.close();
                                        return callback(null, sealed);
                                    });
                                });
                            }
                        });
                    }
                });
            });
        });
    };

    User.loginGithub = function(user, seal, callback) {

        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        } 

        user = args.shift();
        callback = args.pop();
        seal = (args.length > 0) ? args.pop() : {name: 'local.name'};

        if (!user.name || !user.pwd) {
            return callback(new Error('Login requires name and password'));
        }

        db.open(function(err, db) {
            if (err) {
                return callback(err);
            }

            db.authenticate(dbUser, dbPwd, function(err, result) {
                if (err) {
                    db.close();
                    return callback(new Error('Database handler incorrect'));
                }

                var collection = db.collection('users'),
                    store = db.collection('session');

                collection.findOne({github: {name: user.name, pwd: user.pwd}}, function(err, data) {
                    if (err) {
                        db.close();
                        return callback(err);
                    }

                    if (data === null) {
                        db.close();
                        return callback(new Error('Invalid user name or password'));
                    }
                    else {
                        for (var key in seal) {
                            seal[key] = eval('data.' + seal[key]);
                        }

                        Iron.seal(user, dbPwd, metallurgy, function(err, sealed) {
                            if (err) {
                                db.close();
                                return callback(err);
                            }
                                
                            store.insert({_id: sealed, createdAt: new Date(), name: user.name}, function(err, data) {
                                if (err) {
                                    db.close();
                                    return callback(err);
                                }

                                db.close();
                                return callback(null, sealed);
                            });
                        });
                    }
                });
            });
        });
    };

    User.get = function(cookie, callback) {

        if (!cookie || cookie.match(regex) === undefined) {
            return callback(new Error('Invalid cookie'));
        }

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

        cookie = cookie.match(regex)[0];

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
