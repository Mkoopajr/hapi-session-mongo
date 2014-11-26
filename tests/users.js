var vows = require('vows'),
    assert = require('assert'),
    Iron = require('iron');

if (!process.env.VALID_CRUSER || !process.env.VALID_CRPASS || !process.env.LOCAL_USER
    || !process.env.LOCAL_PASS || !process.env.INVALID_USER || !process.env.INVALID_PASS
    || !process.env.DATABASE || !process.env.DB_USER || !process.env.DB_PASS || !process.env.TTL) {
    console.log('Usage: Requires env variables: \n\
                VALID_CRUSER: Valid challenge-response user. \n\
                VALID_CRPASS: Callenge-response users password. \n\
                LOCAL_USER: Valid user stored in a database. \n\
                LOCAL_PASS: Password for user stored in a database. \n\
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

var validUser = {'name': process.env.VALID_CRUSER, 'pwd': process.env.VALID_CRPASS},
    localUser = {'name': process.env.LOCAL_USER, 'pwd': process.env.LOCAL_PASS},
    invalidUser = {'name': process.env.INVALID_USER, 'pwd': process.env.INVALID_PASS},
    badPwdUser = {'name': process.env.LOCAL_USER, 'pwd': 'notapassword'},
    ttl = Number(process.env.TTL);

var options = {
    db: process.env.DATABASE,
    name: process.env.DB_USER,
    pwd: process.env.DB_PASS,
    ssl: process.env.SSL,
    ttl: ttl
};

var optionsBadHandler = {
    db: process.env.DATABASE,
    name: 'invalid',
    pwd: 'invalid',
    ssl: process.env.SSL,
    ttl: ttl
};

var optionsBadDb = {
    db: process.env.DATABASE,
    port: 3000,
    name: process.env.DB_USER,
    pwd: process.env.DB_PASS,
    ssl: process.env.SSL,
    ttl: ttl
};

// Set up a test cookie that is valid but not stored in database
// used to check if data null statement of user.get
var cookie;
Iron.seal(options, 'test', Iron.defaults, function(err, sealed) {
    cookie = sealed;
});

var user = require('../lib/users.js')(options);
var badUser = require('../lib/users.js')(optionsBadHandler);
var badDb = require('../lib/users.js')(optionsBadDb);

users = {
    'users.js is loaded': {
        topic: function() {
            return user;
        },
        'is object': function(topic) {
            assert.isObject({user:true});
        },
        'has method loginCr': function(topic) {
            assert.isFunction(topic.loginCr);
        },
        'has method loginLocal': function(topic) {
            assert.isFunction(topic.loginLocal);
        },
        'has method loginGithub': function(topic) {
            assert.isFunction(topic.loginGithub);
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
    'calling invalid loginCr': {
        topic: function() {
            var self = this;
            user.loginCr(invalidUser, function(err, logged) {
                self.callback(err, logged);
            })
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    },
    'calling invalid loginCr with invalid cookie': {
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
    'calling valid loginCr': {
        topic: function() {
            var self = this;
            user.loginCr(validUser, function(err, logged) {
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
    'calling valid loginCr': {
        topic: function() {
            var self = this;
            user.loginCr(validUser, function(err, logged) {
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

invalidCookieLogout = {
    'getting user after logout': {
        topic: function() {
            var self = this;
            user.logout(undefined, function(err, data) {
                self.callback(err, data);
            })
        },
        'should return error': function(err, data) {
            assert.isNotNull(err);
        }
    }
};

// Not working I think test calls function before ttl expires then holds the
// data until timeout and sends back which passes. Instead of waiting for cookie
// to expire then calling function.
/*
cookieTtlTest = {
    'calling valid loginCr': {
        topic: function() {
            var self = this;
            user.loginCr(validUser, function(logged) {
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

loginBadHandler = {
    'calling valid loginCr with bad handler': {
        topic: function() {
            var self = this;
            badUser.loginCr(validUser, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

getBadHandler = {
    'calling valid loginCr': {
        topic: function() {
            var self = this;
            user.loginCr(validUser, function(err, logged) {
                self.callback(err, logged);
            })
        },
        'should return iron cookie': function(err, logged) {
            assert.isNull(err);
            assert.match(logged, /Fe26[a-zA-Z0-9*._-]/);
        },
        'getting user with bad handler': {
            topic: function(logged) {
                var self = this;
                badUser.get(logged, function(err, data) {
                    self.callback(err, data);
                })
            },
            'should return error': function(err, data) {
                assert.isNotNull(err);
            }
        }
    }
};

logoutBadHandler = {
    'calling valid loginCr': {
        topic: function() {
            var self = this;
            user.loginCr(validUser, function(err, logged) {
                self.callback(err, logged);
            })
        },
        'should return iron cookie': function(err, logged) {
            assert.isNull(err);
            assert.match(logged, /Fe26[a-zA-Z0-9*._-]/);
        },
        'then calling logout with bad handler': {
            topic: function(logged) {
                var self = this;
                badUser.logout(logged, function(err, removed) {
                    self.callback(err, removed);
                })
            },
            'logging out with bad handler': function(err, removed) {
                assert.isNotNull(err);
            }
        }
    }
};

nonexistent = {
    'getting user with valid cookie not in database': {
        topic: function() {
            var self = this;
            user.get(cookie, function(err, data) {
                self.callback(err, data);
            })
        },
        'should return error': function(err, data) {
            assert.isNotNull(err);
        }
    }
};

loginBadDb = {
    'Logging in to misconfigured DB': {
        topic: function() {
            var self = this;
            badDb.loginCr(validUser, function(err, logged) {
                self.callback(err, logged);
            })
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

getBadDb = {
    'Getting misconfigured DB': {
        topic: function() {
            var self = this;
            badDb.get(cookie, function(err, data) {
                self.callback(err, data);
            })
        },
        'should return error': function(err, data) {
            assert.isNotNull(err);
        }
    }
};

logoutBadDb = {
    'Logging out of misconfigured DB': {
        topic: function() {
            var self = this;
            badDb.logout(cookie, function(err, removed) {
                self.callback(err, removed);
            })
        },
        'should return error': function(err, removed) {
            assert.isNotNull(err);
        }
    }
};

loginLocal = {
    'calling valid loginLocal': {
        topic: function() {
            var self = this;
            user.loginLocal(localUser, function(err, logged) {
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

loginBadHandlerLocal = {
    'calling valid loginLocale with bad handler': {
        topic: function() {
            var self = this;
            badUser.loginLocal(localUser, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginBadDbLocal = {
    'Logging in to misconfigured DB local': {
        topic: function() {
            var self = this;
            badDb.loginLocal(localUser, function(err, logged) {
                self.callback(err, logged);
            })
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginLocalInvalidName = {
    'calling invalid name loginLocal': {
        topic: function() {
            var self = this;
            user.loginLocal(invalidUser, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginLocalInvalidPass = {
    'calling invalid pass loginLocal': {
        topic: function() {
            var self = this;
	    user.loginLocal(badPwdUser, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginGithub = {
    'calling valid loginGithub': {
        topic: function() {
            var self = this;
            user.loginGithub(localUser, function(err, logged) {
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

loginBadHandlerGithub = {
    'calling valid loginGithub with bad handler': {
        topic: function() {
            var self = this;
            badUser.loginGithub(localUser, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginBadDbGithub = {
    'Logging in to misconfigured DB localGithub': {
        topic: function() {
            var self = this;
            badDb.loginGithub(localUser, function(err, logged) {
                self.callback(err, logged);
            })
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginGithubInvalid = {
    'calling invalid loginGithub': {
        topic: function() {
            var self = this;
            user.loginGithub(invalidUser, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginLocalNoPass = {
    'calling invalid loginLocal with no password': {
        topic: function() {
            var self = this;
	    user.loginLocal({'name': 'test'}, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginCrNoPass = {
    'calling invalid loginCr with no password': {
        topic: function() {
            var self = this;
	    user.loginCr({'name': 'test'}, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginGithubNoPass = {
    'calling invalid loginGithub with no password': {
        topic: function() {
            var self = this;
	    user.loginGithub({'name': 'test'}, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return error': function(err, logged) {
            assert.isNotNull(err);
        }
    }
};

loginLocalWithData = {
    'calling valid loginLocal with data': {
        topic: function() {
            var self = this;
            user.loginLocal(localUser, {}, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return iron cookie': function(err, logged) {
            assert.isNull(err);
            assert.match(logged, /Fe26[a-zA-Z0-9*._-]/);
        }
    }
};

loginGithubWithData = {
    'calling valid loginGithub with data': {
        topic: function() {
            var self = this;
            user.loginGithub(localUser, {}, function(err, logged) {
                self.callback(err, logged);
            });
        },
        'should return iron cookie': function(err, logged) {
            assert.isNull(err);
            assert.match(logged, /Fe26[a-zA-Z0-9*._-]/);
        }
    }
};

vows.describe('users.js').addBatch(users).addBatch(invalid).addBatch(valid).addBatch(logout).addBatch(loginBadHandler).addBatch(getBadHandler).addBatch(logoutBadHandler).addBatch(invalidCookieLogout).addBatch(nonexistent).addBatch(loginBadDb).addBatch(getBadDb).addBatch(logoutBadDb).addBatch(loginLocal).addBatch(loginBadHandlerLocal).addBatch(loginBadDbLocal).addBatch(loginLocalInvalidName).addBatch(loginLocalInvalidPass).addBatch(loginGithub).addBatch(loginBadHandlerGithub).addBatch(loginBadDbGithub).addBatch(loginGithubInvalid).addBatch(loginLocalNoPass).addBatch(loginCrNoPass).addBatch(loginGithubNoPass).addBatch(loginLocalWithData).addBatch(loginGithubWithData).export(module);
