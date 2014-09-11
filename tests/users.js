var vows = require('vows'),
    assert = require('assert')

if (!process.env.VALID_USER || !process.env.VALID_PASS || !process.env.INVALID_USER 
    || !process.env.INVALID_PASS || !process.env.DATABASE || !process.env.DB_USER 
    || !process.env.DB_PASS) {
    console.log('Usage: Requires env varibles: \n\
                VALID_USER: Valid user stored in database. \n\
                VALID_PASS: Users password. \n\
                INVALID_USER: Invalid user stored in database. \n\
                INVALID_PASS: Users password. \n\
                DATABASE: The database to access. \n\
                DB_USER: A database handler user with read/write. \n\
                DB_PASS: Database password. \n\n\
                Optional env varibles: \n\
                SSL: If ssl is true. \n');
    process.exit(1);
}

var validUser = process.env.VALID_USER,
    validPass = process.env.VALID_PASS,
    invalidUser = process.env.INVALID_USER,
    invalidPass = process.env.INVALID_PASS

var options = {
    db: process.env.DATABASE,
    name: process.env.DB_USER,
    pwd: process.env.DB_PASS,
    ssl: process.env.SSL
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
        'has method get': function(topic) {
            assert.isFunction(topic.get);
        }
    }
};

invalid = {
    'calling invalid login': {
        topic: function() {
            var self = this;
            user.login(invalidUser, invalidPass, function(logged) {
                self.callback(null, logged);
            })
        },
        'should return false': function(err, logged) {
            assert.isFalse(logged);
        },
        'getting with invalid cookie': {
            topic: function(logged) {
                var self = this;
                user.get(logged, function(data) {
                    self.callback(null, data);
                })
            },
            'should return false': function(err, data) {
                assert.isFalse(data);
            }
        }
    }
};

valid = {
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
        'getting with valid cookie': {
            topic: function(logged) {
                var self = this;
                user.get(logged, function(data) {
                    self.callback(null, data);
                })
            },
            'should return true': function(data) {
                assert.isTrue(data);
            }
        }
    }
};

vows.describe('users.js').addBatch(users).addBatch(invalid).addBatch(valid).export(module);
