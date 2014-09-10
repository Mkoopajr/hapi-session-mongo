var options = {
    db: 'users',
    name: 'sessionHandler',
    pwd: 'supersecretpassword',
    ssl: true
};

var vows = require('vows'),
    assert = require('assert')
    user = require('../lib/users.js')(options);


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
            user.login('test', 'test', function(logged) {
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
            user.login('test', 'test123', function(logged) {
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
