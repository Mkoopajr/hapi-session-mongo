var Hoek = require('hoek');

var test = {};

exports.register = function (plugin, options, next) {

    var user = require('./users.js')(options);
    plugin.auth.scheme('mongo', test.imp);
    plugin.expose('user', user);
    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

test.imp = function(server, options) {

    var settings = Hoek.clone(options),
        cookie = settings.cookie;

    server.ext('onPreAuth', function (req, res) {

        req.auth.session = {
            set: function (session) {
                res.state(cookie, session);
            }
        };

        res();
    });

    var scheme = {
        authenticate: function (req, res) {
            var session = req.state[cookie];

            if (!session) {
                return res('Please login');
            }

            settings.validateFunc(session, function (err, isValid, credentials) {
                if (!isValid) {
                    return res('not logged in');
                }
                else {
                    return res(null, {credentials: session});
                }
            });
        }
    };

    return scheme;
};
