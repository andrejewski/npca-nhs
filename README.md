# Collegiate Academy National Honor Society

This repository contains the source code to the Collegiate Academy NHS website and member application. The actual website is located at [npcanhs.org](http://npcanhs.org/).

## Nerd Stuff

This application requires an active MongoDB database server to persist data and the application itself is hosted behind an Nginx server.

The languages used in this project include JavaScript, Jade (HTML), and CSS.

This project also makes use of many open-sources projects. The major ones are:

- [Express](http://expressjs.com/), for routing logic and HTTP server
- [Mongoose](http://mongoosejs.com/), for communication with the database
- [Reem](https://github.com/andrejewski/reem), for the generation of the static webpages

(Reem's the best because I made it.)

## Contributing

Crucial, password-sensitive files are excluded from this public repository and thus the application as cloned directly will not work. To complete the application you will need to provide a `config.json` file in the root directory, like the following:

```json
{
  "school": {
    "name": "Northwest Pennsylvania Collegiate Academy",
    "yearBegin": "2014-07-30T22:19:41.471Z",
    "yearEnd": "2014-07-30T22:19:41.471Z",
    "timezoneOffset": 240
  },
  "website": {
    "domain": "npcanhs.org",
    "author": "NPCA NHS",
    "description": "This is the official website of the NHS branch of Northwest Pennsylvania Collegiate Academy. News, events, and members can be found here.",
    "keywords": [
      "national",
      "honor",
      "society",
      "homepage"
    ],
    "header": "National Honor Society of Northwest Pennsylvania Collegiate Academy",
    "footer": ""
  },
  "mandrill": {
    "apiKey": "<apiKey>",
    "address": "<senderEmailAddress>",
    "sender": "<senderName>",
    "sendHour": 12
  },
  "server": {
    "database": {
      "url": "mongodb://localhost/<databaseName>"
    },
    "cdn": {
      "url": "/"
    },
    "ctoEmail": "<yourEmail>"
  }
}
```

To be as transparent as possible, the website has been open-sourced to allow anyone to help in making the website better. Simply find the change you would like to make or the problem you find and open an issue or submit a pull request of the desired change.

