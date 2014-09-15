#!/bin/sh

mongo test --eval 'db.addUser({user: "test", pwd: "test123", roles: []});'
mongo test --eval 'db.addUser({user: "sessionHandler", pwd: "supersecretpassword", roles: [{role: "readWrite", db: "test"}]});'
mongo admin --eval 'db.addUser({user: "admin", pwd: "admin", roles: [{role: "readWriteAnyDatabase", db: "admin"}, {role: "userAdminAnyDatabase", db: "admin"}]});'
