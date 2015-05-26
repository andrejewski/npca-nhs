#!/bin/sh

if [ $(ps -e -o uid,cmd | grep $UID | grep node | grep -v grep | wc -l | tr -s "\n") -eq 0 ]
then
        export PATH=/usr/local/bin:$PATH
        forever start --sourceDir /var/app/npcanhs.org/lib/ production.js >> /var/app/npcanhs.org/logging/production.log 2>&1
fi
