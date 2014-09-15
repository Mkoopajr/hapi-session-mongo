#!/bin/sh

mongo --ssl admin --eval 'db.addUser({user: "admin", pwd: "admin", roles: [{role: "readWriteAnyDatabase", db: "admin"}, {role: "userAdminAnyDatabase", db: "admin"}]});'
mongo --ssl -u admin -p admin test --eval 'db.addUser("test", "test123");'
mongo --ssl -u admin -p admin test --eval 'db.addUser({user: "sessionHandler", pwd: "supersecretpassword", roles: [{role: "readWrite", db: "test"}]});'
