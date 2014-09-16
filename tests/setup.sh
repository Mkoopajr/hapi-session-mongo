#!/bin/sh

mongo test --eval 'db.addUser({user: "test", pwd: "test123", roles: []});'
mongo test --eval 'db.addUser({user: "sessionHandler", pwd: "supersecretpassword", roles: ["readWrite"]});'
mongo admin --eval 'db.addUser({user: "admin", pwd: "admin", roles: ["readWriteAnyDatabase", "userAdminAnyDatabase"]});'
