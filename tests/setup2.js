#!/usr/bin/env node

var bcrypt = require('bcrypt');

var Mongo = require('mongodb'),
    Db = Mongo.Db,
    Server = Mongo.Server;

var localUser = process.env.LOCAL_USER,
    localPass = process.env.LOCAL_PASS,
    dbUser = process.env.DB_USER,
    dbPass = process.env.DB_PASS,
    database = process.env.DATABASE;


var server = new Server('127.0.0.1', 27017),
    db = new Db(database, server, {w: 1});

db.open(function(err, db) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('opened DB');

    db.authenticate(dbUser, dbPass, function(err, result) {
        if (err) {
            db.close();
            console.log(err);
            process.exit(1);
        }

        console.log('authenticated DB');

        db.createCollection('users', function(err, collection) {
            if (err) {
                db.close();
                console.log(err);
                process.exit(1);
            }

            console.log('created DB collection');

            bcrypt.hash(localPass, 10, function(err, hash) {
                if (err) {
                    db.close();
                    console.log(err);
                    process.exit(1);
                }

                console.log('hashed data');

                collection.insert([{_id: localUser, local: {name: localUser, pwd: hash}, github: {name: localUser, pwd: localPass}}],
                function(err, data) {
                    if (err) {
                        db.close();
                        console.log(err);
                        process.exit(1);
                    }

                    db.close();
                    console.log('created user');
                    console.log(data);
                    process.exit(0);
                });
            });
        });
    });
});
