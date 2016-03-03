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
 * The UPSERT extension.
 *
 * @author Sagie Gur-Ari
 * @namespace UpsertExtension
 * @public
 */

/**
 * The UPSERT oracledb extension gets 3 SQL statements.<br>
 * It first queries the database of existing data, based on the output, it either runs INSERT or UPDATE SQL.<br>
 * If it runs the INSERT and it fails on unique constraint, it will also run the UPDATE.<br>
 * The output in the callback is the output of the INSERT/UPDATE operation.
 *
 * @function
 * @memberof! UpsertExtension
 * @public
 * @param {object} sqls - Holds all required SQLs to support the UPSERT capability
 * @param {string} sqls.query - The SELECT SQL statement
 * @param {string} sqls.insert - The INSERT SQL statement
 * @param {string} sqls.update - The UPDATE SQL statement
 * @param {object} bindParams - The bind parameters used to specify the values for the columns, used by all execute operations
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
 *   //continue flow...
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

    var upsertResult;
    var runUpdate;
    asyncLib.series([
        function query(asyncCallback) {
            //set/add query options
            options.maxRows = 1;
            options.resultSet = false;

            self.query(sqls.query, bindParams, options, function onQueryDone(error, results) {
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
                self.insert(sqls.insert, bindParams, options, function onInsertDone(error, results) {
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
                self.update(sqls.update, bindParams, options, function onUpdateDone(error, results) {
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
};

var SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.addExtension('connection', 'upsert', upsert);
