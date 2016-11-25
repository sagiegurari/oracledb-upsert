# oracledb-upsert

[![NPM Version](http://img.shields.io/npm/v/oracledb-upsert.svg?style=flat)](https://www.npmjs.org/package/oracledb-upsert) [![Build Status](https://travis-ci.org/sagiegurari/oracledb-upsert.svg)](http://travis-ci.org/sagiegurari/oracledb-upsert) [![Coverage Status](https://coveralls.io/repos/sagiegurari/oracledb-upsert/badge.svg)](https://coveralls.io/r/sagiegurari/oracledb-upsert) [![bitHound Code](https://www.bithound.io/github/sagiegurari/oracledb-upsert/badges/code.svg)](https://www.bithound.io/github/sagiegurari/oracledb-upsert) [![Inline docs](http://inch-ci.org/github/sagiegurari/oracledb-upsert.svg?branch=master)](http://inch-ci.org/github/sagiegurari/oracledb-upsert)<br>
[![License](https://img.shields.io/npm/l/oracledb-upsert.svg?style=flat)](https://github.com/sagiegurari/oracledb-upsert/blob/master/LICENSE) [![Total Downloads](https://img.shields.io/npm/dt/oracledb-upsert.svg?style=flat)](https://www.npmjs.org/package/oracledb-upsert) [![Dependency Status](https://david-dm.org/sagiegurari/oracledb-upsert.svg)](https://david-dm.org/sagiegurari/oracledb-upsert) [![devDependency Status](https://david-dm.org/sagiegurari/oracledb-upsert/dev-status.svg)](https://david-dm.org/sagiegurari/oracledb-upsert?type=dev)<br>
[![peerDependency Status](https://david-dm.org/sagiegurari/oracledb-upsert/peer-status.svg)](https://david-dm.org/sagiegurari/oracledb-upsert?type=peer) [![Retire Status](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/oracledb-upsert/master/package.json)](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/oracledb-upsert/master/package.json)

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
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.upsert(sqls, bindParams, [options], [callback]) ⇒ [Promise]'
The UPSERT oracledb extension gets 3 SQL statements.<br>
It first queries the database for existing data, based on the output, it either runs INSERT or UPDATE SQL.<br>
If it runs the INSERT and it fails on unique constraint, it will also run the UPDATE.<br>
The output in the callback is the output of the INSERT/UPDATE operation.

**Example**  
```js
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
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="installation"></a>
## Installation
In order to use this library, just run the following npm install command:

```sh
npm install --save oracledb-upsert
```

This library doesn't define oracledb as a dependency and therefore it is not installed when installing oracledb-upsert.<br>
You should define oracledb in your package.json and install it based on the oracledb installation instructions found at: [installation guide](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md)

## API Documentation
See full docs at: [API Docs](docs/api.md)

## Contributing
See [contributing guide](.github/CONTRIBUTING.md)

<a name="history"></a>
## Release History

| Date        | Version | Description |
| ----------- | ------- | ----------- |
| 2016-11-25  | v1.0.40 | Maintenance |
| 2016-08-05  | v0.0.43 | Added promise support |
| 2016-08-03  | v0.0.42 | Maintenance |
| 2016-03-04  | v0.0.1  | Initial release. |

<a name="license"></a>
## License
Developed by Sagie Gur-Ari and licensed under the Apache 2 open source license.
