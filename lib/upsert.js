'use strict';

/**
 * Invoked when an async operation has finished.
 *
 * @callback AsyncCallback
 * @param {Error} [error] - Any possible error
 * @param {Object} [output] - The operation output
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
 * @param {String} sql - The SQL using the bind params
 * @param {Object} bindParams - The bind parameters used to specify the values for the columns, used by all execute operations
 * @param {Object} [options] - The execute options
 * @returns {Object} The specific SQL bind params
 */
function getBindParams(sql, bindParams, options) {
    const operationBindParams = {};

    let keys;
    const lobParams = {};
    if (options && options.lobMetaInfo) {
        keys = Object.keys(options.lobMetaInfo);

        for (let index = 0; index < keys.length; index++) {
            lobParams[options.lobMetaInfo[keys[index]]] = true;
        }
    }

    keys = Object.keys(bindParams);

    for (let index = 0; index < keys.length; index++) {
        const param = keys[index];

        if ((sql.indexOf(':' + param) !== -1) || lobParams[param]) {
            operationBindParams[param] = bindParams[param];
        }
    }

    return operationBindParams;
}

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * The UPSERT oracledb extension gets 3 SQL statements.<br>
 * It first queries the database for existing data, based on the output, it either runs INSERT or UPDATE SQL.<br>
 * If it runs the INSERT and it fails on unique constraint, it will also run the UPDATE.<br>
 * The output in the callback is the output of the INSERT/UPDATE operation.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {Object} sqls - Holds all required SQLs to support the UPSERT capability
 * @param {String} sqls.query - The SELECT SQL statement
 * @param {String} sqls.insert - The INSERT SQL statement
 * @param {String} sqls.update - The UPDATE SQL statement
 * @param {Object} bindParams - The bind parameters used to specify the values for the columns, used by all execute operations (arrays not supported, only named bind params)
 * @param {Object} [options] - Used by all execute operations
 * @param {AsyncCallback} [callback] - Invoked once the UPSERT is done with either an error or the output
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
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
const upsert = function (sqls, bindParams, options, callback) {
    /*eslint-disable no-invalid-this*/
    const self = this;
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
        let upsertResult;
        let runUpdate;

        self.run([
            function query(asyncCallback) {
                //set/add query options
                options.maxRows = 1;
                options.resultSet = false;

                const operationBindParams = getBindParams(sqls.query, bindParams);

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
                    const operationBindParams = getBindParams(sqls.insert, bindParams, options);

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
                    const operationBindParams = getBindParams(sqls.update, bindParams, options);

                    self.update(sqls.update, operationBindParams, options, function onUpdateDone(error, results) {
                        if (error) {
                            asyncCallback(error);
                        } else {
                            let upsertError;
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
        ], {
            sequence: true
        }, function onUpsertDone(error) {
            callback(error, upsertResult);
        });
    }
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

const SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.addExtension('connection', 'upsert', upsert);
