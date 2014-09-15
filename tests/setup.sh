#!/bin/sh

mongo admin --eval 'db.addUser("admin", "admin");'
mongo test --eval 'db.addUser("test", "test123");'
mongo test --eval 'db.addUser("sessionHandler", "supersecretpassword", roles: ["readWrite"]);'
