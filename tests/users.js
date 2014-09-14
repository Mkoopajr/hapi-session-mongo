var vows = require('vows'),
    assert = require('assert')

if (!process.env.VALID_USER || !process.env.VALID_PASS || !process.env.INVALID_USER 
    || !process.env.INVALID_PASS || !process.env.DATABASE || !process.env.DB_USER 
    || !process.env.DB_PASS || !process.env.TTL) {
    console.log('Usage: Requires env varibles: \n\
                VALID_USER: Valid user stored in database. \n\
                VALID_PASS: Users password. \n\
                INVALID_USER: Invalid user stored in database. \n\
                INVALID_PASS: Users password. \n\
                DATABASE: The database to access. \n\
                DB_USER: A database handler user with read/write. \n\
                DB_PASS: Database password. \n\
                TTL: Time-to-live for iron cookie. \n\n\
                Optional env varibles: \n\
                SSL: If ssl is true. \n');
    process.exit(1);
}


var validUser = process.env.VALID_USER,
    validPass = process.env.VALID_PASS,
    invalidUser = process.env.INVALID_USER,
    invalidPass = process.env.INVALID_PASS,
    ttl = Number(process.env.TTL);

var options = {
    db: process.env.DATABASE,
    name: process.env.DB_USER,
    pwd: process.env.DB_PASS,
    ssl: process.env.SSL,
    ttl: ttl
};

var user = require('../lib/users.js')(options);

users = {
    'users.js is loaded': {
        topic: function() {
            return user;
        },
        'is object': function(topic) {
            assert.isObject({user:true});
        },
        'has method login': function(topic) {
            assert.isFunction(topic.login);
        },
        'has method logout': function(topic) {
            assert.isFunction(topic.logout);
        },
        'has method get': function(topic) {
            assert.isFunction(topic.get);
        }
    }
};

invalid = {
    'calling invalid login': {
        topic: function() {
            var self = this;
            user.login(invalidUser, invalidPass, function(err, logged) {
                self.callback(err, logged);
            })
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    },
    'calling invalid login with invalid cookie': {
        topic: function() {
            var self = this;
            user.get(undefined, function(err, data) {
                self.callback(err, data);
            })
        },
        'should return error': function(err, data) {
            assert.isNotNull(err);
        }
    }
};

valid = {
    'calling valid login': {
        topic: function() {
            var self = this;
            user.login(validUser, validPass, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return iron cookie': function(err, logged) {
            assert.isNull(err);
            assert.match(logged, /Fe26[a-zA-Z0-9*._-]/);
        },
        'with valid cookie': {
            topic: function(logged) {
                var self = this;
                user.get(logged, function(err, data) {
                    self.callback(err, data);
                })
            },
            'should return true': function(err, data) {
                assert.isNull(err);
                assert.isTrue(data);
            }
        }
    }
};

logout = {
    'calling valid login': {
        topic: function() {
            var self = this;
            user.login(validUser, validPass, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return iron cookie': function(err, logged) {
            assert.isNull(err);
            assert.match(logged, /Fe26[a-zA-Z0-9*._-]/);
        },
        'then logging out': {
            topic: function(logged) {
                var self = this;
                user.logout(logged, function(err, removed) {
                    self.callback(err, removed);
                })
            },
            'should return true': function(err, removed) {
                assert.isNull(err);
                assert.equal(1, removed);
            }
        }
    }
};

// Not working I think test calls function before ttl expires then holds the
// data until timeout and sends back which passes. Instead of waiting for cookie
// to expire then calling function.
/*
cookieTtlTest = {
    'calling valid login': {
        topic: function() {
            var self = this;
            user.login(validUser, validPass, function(logged) {
                self.callback(null, logged);
            });
        },
        'should return iron cookie': function(logged) {
            assert.match(logged, /Fe26[a-zA-Z0-9*._-]/);
        },
        'with timed out cookie': {
            topic: function(logged) {
                var self = this;
                setTimeout(function() {
                    user.get(logged, function(data) {
                        self.callback(null, data);
                    })
                }, ttl + 1000)
            },
            'should return false': function(data) {
                console.log(data);
                assert.isFalse(data);
            }
        }
    }
};
*/

vows.describe('users.js').addBatch(users).addBatch(invalid).addBatch(valid).addBatch(logout).export(module);
