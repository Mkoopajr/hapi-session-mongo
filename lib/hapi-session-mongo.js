var Hoek = require('hoek')
const Boom = require('boom')

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

        return res.continue();
    });

    var scheme = {
        authenticate: function (req, res) {
            var session = req.state[settings.cookie];

            settings.validateFunc(session, function (err, isValid) {

                if (!isValid || err) {
                    return res(Boom.unauthorized(''))
                }
                else {
                    return res.continue({credentials: session});
                }
            });
        }
    };

    return scheme;
};
