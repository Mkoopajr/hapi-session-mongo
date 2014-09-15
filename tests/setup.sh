#!/bin/sh

mongo admin --eval 'db.addUser("admin", "admin", "roles": [{role: "readWriteAnyDatabase", db: "admin"}, {role: "userAdminAnyDatabase", db: "admin"}]);'
mongo -u admin -p admin test --eval 'db.addUser("test", "test123");'
mongo -u admin -p admin test --eval 'db.addUser("sessionHandler", "supersecretpassword", "roles": [{role: "readWrite", db: "test"}]);'
