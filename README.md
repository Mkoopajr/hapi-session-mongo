### hapi-session-mongo

[**hapi**](https://github.com/hapijs/hapi) MongoDB Session Storage

## Install

## Usage
A session store plugin for hapi and MongoDB. Must have database already set up
with one user that has readWrite role. All other users in database are just for
the challenge-response mechanism and require no roles. Requires options:
- `ip` - The IP address of the database. Defaults to `127.0.0.1`.
- `port` - The port number of the database. Defaults to `27017`.
- `db` - The name of the database. Defaults to `test`.
- `name` - The name of the user with readWrite. Defaults to `undefined`.
- `pwd` - The password of the user with readWrite, also signs Iron cookie. Defaults to `undefined`.
- `ssl` - MongoDB ssl. Defaults to `false`.
- `ttl` - Time-to-live for Iron cookie. Defaults to `0`.

Also exports functions:
- `user.login(username, password, callback)` - Challenge-response user. Callback is (err, cookie).
- `req.auth.session.set(session)` - Called with login to set server state.
- `user.get(session, callback)` - Session is cookie. Callback is (err, valid).
    to be called with the `validateFunc`.
- `user.logout = function(cookie, callback)` - Callback is (err, removed).
- `req.auth.session.clear()` - Called with logout to clear server state.

During the `server.auth.strategy` phase `validateFunc(session, callback)` is required.

Example set up:
```javascript
var Hapi = require('hapi');

var server = Hapi.createServer('127.0.0.1', 3000);

server.pack.register({
    plugin: require('hapi-session-mongo'),
    options: {
        db: 'users',
        name: 'sessionHandler',
        pwd: 'supersecretpassword',
        ssl: true
    }
}, function (err) {
    if (err) { console.log(err); };

    server.auth.strategy('session', 'mongo', {
        validateFunc: function(session, callback) {
            server.plugins['hapi-session-mongo'].user.get(session, function(err, valid) {
                return callback(err, valid);
            });
        }
    });
});

server.route([
    {
        method: 'POST',
        path: '/login',
        handler: function (req, res) {
            server.plugins['hapi-session-mongo'].user.login(req.payload.username,
                req.payload.password, function(err, logged) {
                  if (err) {
                      res('Invalid name or password');
                  }

                  req.auth.session.set(logged);
                  res(logged);
            });
        }
    },
    {
        method: 'GET',
        path: '/home',
        config: {
            handler: function(req, res) {
                res('You are now logged in');
            },
            auth: 'session'
        }
    },
    {
        method: 'GET',
        path: '/logout',
        config: {
            handler: function(req, res) {
                server.plugins['hapi-session-mongo'].user.logout(req.headers['cookie'], function(err, removed) {
                    if (err) {
                        res(err);
                    }

                    req.auth.session.clear();
                    res('logged out');
                });
            },
            auth: 'session'
        }
    }
]);

server.start();
```

## Removing stale sessions

MongoDB 2.2 and above supports doing this via an index, see http://docs.mongodb.org/manual/tutorial/expire-data/
To enable this, run

    db.sessions.ensureIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600 } )

Mongo will now remove all sessions older than an hour (every 60 seconds).

## Testing

Tests are ran using npm test and require the env variables:
    `VALID_USER`
    `VALID_PASS`
    `INVALID_USER`
    `INVALID_PASS`
    `DATABASE`
    `DB_USER`
    `DB_PASS`
    `TTL`
with optional env variables:
    `SSL`

If testing on travis you can edit the env variables in .travis.yml and edit your mongodb setup under
./tests/setup.sh.
