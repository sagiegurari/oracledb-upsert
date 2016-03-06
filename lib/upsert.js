'use strict';

var asyncLib = require('async');

/**
 * Invoked when an async operation has finished.
 *
 * @callback AsyncCallback
 * @param {error} [error] - Any possible error
 * @param {object} [output] - The operation output
 */

/**
 * This class holds all the extended capabilities added the oracledb connection.
 *
 * @author Sagie Gur-Ari
 * @class Connection
 * @public
 */

/**
 * Returns only the required bind params based on the provided SQL.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {string} sql - The SQL using the bind params
 * @param {object} bindParams - The bind parameters used to specify the values for the columns, used by all execute operations
 * @param {object} [options] - The execute options
 * @returns {object} The specific SQL bind params
 */
function getBindParams(sql, bindParams, options) {
    var operationBindParams = {};

    var keys;
    var index;
    var lobParams = {};
    if (options && options.lobMetaInfo) {
        keys = Object.keys(options.lobMetaInfo);

        for (index = 0; index < keys.length; index++) {
            lobParams[options.lobMetaInfo[keys[index]]] = true;
        }
    }

    keys = Object.keys(bindParams);

    var param;
    for (index = 0; index < keys.length; index++) {
        param = keys[index];

        if ((sql.indexOf(':' + param) !== -1) || lobParams[param]) {
            operationBindParams[param] = bindParams[param];
        }
    }

    return operationBindParams;
}

/**
 * The UPSERT oracledb extension gets 3 SQL statements.<br>
 * It first queries the database of existing data, based on the output, it either runs INSERT or UPDATE SQL.<br>
 * If it runs the INSERT and it fails on unique constraint, it will also run the UPDATE.<br>
 * The output in the callback is the output of the INSERT/UPDATE operation.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {object} sqls - Holds all required SQLs to support the UPSERT capability
 * @param {string} sqls.query - The SELECT SQL statement
 * @param {string} sqls.insert - The INSERT SQL statement
 * @param {string} sqls.update - The UPDATE SQL statement
 * @param {object} bindParams - The bind parameters used to specify the values for the columns, used by all execute operations (arrays not supported, only named bind params)
 * @param {object} [options] - Used by all execute operations
 * @param {AsyncCallback} callback - Invoked once the UPSERT is done with either an error or the output
 * @example
 * ```js
 * connection.upsert({
 *   query: 'SELECT ID FROM MY_DATA WHERE ID = :id',
 *   insert: 'INSERT INTO MY_DATA (ID, NAME) VALUES (:id, :name)',
 *   update: 'UPDATE MY_DATA SET NAME = :name WHERE ID = :id'
 * }, {
 *   id: 110,
 *   name: 'new name'
 * }, {
 *   autoCommit: false
 * }, function onUpsert(error, results) {
 *   if (error) {
 *     //handle error...
 *   } else {
 *     console.log('rows affected: ', results.rowsAffected);
 *
 *     //continue flow...
 *   }
 * });
 * ```
 */
var upsert = function (sqls, bindParams, options, callback) {
    /*eslint-disable no-invalid-this*/
    var self = this;
    /*eslint-enable no-invalid-this*/

    if (!callback) {
        callback = options;
        options = null;
    }

    bindParams = bindParams || {};
    options = options || {};

    if (Array.isArray(bindParams)) {
        callback(new Error('Array type bind params are not supported.'));
    } else {
        var upsertResult;
        var runUpdate;
        asyncLib.series([
            function query(asyncCallback) {
                //set/add query options
                options.maxRows = 1;
                options.resultSet = false;

                var operationBindParams = getBindParams(sqls.query, bindParams);

                self.query(sqls.query, operationBindParams, options, function onQueryDone(error, results) {
                    if (error) {
                        asyncCallback(error);
                    } else {
                        if (results && results.length) {
                            runUpdate = true;
                        }

                        asyncCallback();
                    }
                });
            },
            function insert(asyncCallback) {
                if (runUpdate) {
                    asyncCallback();
                } else {
                    var operationBindParams = getBindParams(sqls.insert, bindParams, options);

                    self.insert(sqls.insert, operationBindParams, options, function onInsertDone(error, results) {
                        if (error) {
                            if (error.message && (error.message.indexOf('ORA-00001') !== -1)) { //INSERT failed on unique constraint so try to UPDATE instead
                                runUpdate = true;
                                asyncCallback();
                            } else {
                                asyncCallback(error);
                            }
                        } else {
                            if (results && results.rowsAffected) {
                                upsertResult = results;
                            } else {
                                runUpdate = true;
                            }

                            asyncCallback();
                        }
                    });
                }
            },
            function update(asyncCallback) {
                if (runUpdate) {
                    var operationBindParams = getBindParams(sqls.update, bindParams, options);

                    self.update(sqls.update, operationBindParams, options, function onUpdateDone(error, results) {
                        if (error) {
                            asyncCallback(error);
                        } else {
                            var upsertError;
                            if (results && results.rowsAffected) {
                                upsertResult = results;
                            } else {
                                upsertError = new Error('No rows updated.');
                            }

                            asyncCallback(upsertError);
                        }
                    });
                } else {
                    asyncCallback();
                }
            }
        ], function onUpsertDone(error) {
            callback(error, upsertResult);
        });
    }
};

var SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.addExtension('connection', 'upsert', upsert);
