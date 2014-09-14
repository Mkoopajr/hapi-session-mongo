var Hoek = require('hoek');

var internals = {};

exports.register = function (plugin, options, next) {

    var user = require('./users.js')(options);
    plugin.auth.scheme('mongo', internals.implementation);
    plugin.expose('user', user);
    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

internals.implementation = function(server, options) {

    var settings = Hoek.clone(options);
    settings.cookie = settings.cookie || 'authSession';

    server.ext('onPreAuth', function (req, res) {

        req.auth.session = {
            set: function (session) {
                res.state(settings.cookie, session);
            },
            clear: function () {
                res.unstate(settings.cookie);
            }
        };

        res();
    });

    var scheme = {
        authenticate: function (req, res) {
            var session = req.state[settings.cookie];

            settings.validateFunc(session, function (err, isValid, credentials) {
                if (err) {
                    return res(err);
                }

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
