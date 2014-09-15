#!/bin/sh

mongo admin --eval 'db.createUser("admin", "admin");'
mongo test --eval 'db.createUser("test", "test123");'
mongo test --eval 'db.createUser("sessionHandler", "supersecretpassword", roles: ["readWrite"]);'
