# {"gitdown": "gitinfo", "name": "name"}

[![NPM Version](http://img.shields.io/npm/v/{"gitdown": "gitinfo", "name": "name"}.svg?style=flat)](https://www.npmjs.org/package/{"gitdown": "gitinfo", "name": "name"}) [![CI](https://github.com/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/workflows/CI/badge.svg?branch=master)](https://github.com/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/actions) [![Coverage Status](https://coveralls.io/repos/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/badge.svg)](https://coveralls.io/r/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}) [![Known Vulnerabilities](https://snyk.io/test/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/badge.svg)](https://snyk.io/test/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}) [![Inline docs](http://inch-ci.org/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}.svg?branch=master)](http://inch-ci.org/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}) [![License](https://img.shields.io/npm/l/{"gitdown": "gitinfo", "name": "name"}.svg?style=flat)](https://github.com/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/blob/master/LICENSE) [![Total Downloads](https://img.shields.io/npm/dt/{"gitdown": "gitinfo", "name": "name"}.svg?style=flat)](https://www.npmjs.org/package/{"gitdown": "gitinfo", "name": "name"})

> UPSERT (insert/update) extension to oracledb.

* [Overview](#overview)
* [Usage](#usage)
* [Installation](#installation)
* [API Documentation](docs/api.md)
* [Contributing](.github/CONTRIBUTING.md)
* [Release History](#history)
* [License](#license)

<a name="overview"></a>
## Overview
This library extends the oracledb connection object with a new upsert function to enable to run UPDATE or INSERT based on the
data currently in the DB.

<a name="usage"></a>
## Usage
In order to use this library, you need to extend the main oracledb object as follows:

```js
//load the oracledb library
var oracledb = require('oracledb');

//load the simple oracledb
var SimpleOracleDB = require('simple-oracledb');

//modify the original oracledb library
SimpleOracleDB.extend(oracledb);

//load the extension
require('oracledb-upsert');

//from this point connections fetched via oracledb.getConnection(...) or pool.getConnection(...)
//have access to the UPSERT function.
oracledb.getConnection(function onConnection(error, connection) {
    if (error) {
        //handle error
    } else {
        //work with new capabilities or original oracledb capabilities
        connection.upsert({
            query: 'SELECT ID FROM MY_DATA WHERE ID = :id',
            insert: 'INSERT INTO MY_DATA (ID, NAME) VALUES (:id, :name)',
            update: 'UPDATE MY_DATA SET NAME = :name WHERE ID = :id'
        }, {
            id: 110,
            name: 'new name'
        }, {
            autoCommit: false
        }, function onUpsert(error, results) {
            if (error) {
                //handle error...
            } else {
                console.log('rows affected: ', results.rowsAffected);

                //continue flow...
            }
        });
    }
});
```

<a name="connection-upsert"></a>

<a name="installation"></a>
## Installation
In order to use this library, just run the following npm install command:

```sh
npm install --save {"gitdown": "gitinfo", "name": "name"}
```

This library doesn't define oracledb as a dependency and therefore it is not installed when installing {"gitdown": "gitinfo", "name": "name"}.<br>
You should define oracledb in your package.json and install it based on the oracledb installation instructions found at: [installation guide](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md)

{"gitdown": "include", "file": "./README-footer-template.md"}
