// Not really sure how to go about testing this file.

var vows = require('vows'),
    assert = require('assert');

var hsm = require('../lib/hapi-session-mongo.js');

tests = {
    'hapi-session-mongo.js is loaded': {
        topic: function() {
            return hsm;
        },
        'is object': function(topic) {
            assert.isObject(topic);
        },
        'should export register': function(topic) {
            assert.isFunction(topic.register);
        }
    }
};

vows.describe('hapi-session-mongo.js').addBatch(tests).export(module);
