'use strict';

const asyncLib = require('async');
const chai = require('chai');
const assert = chai.assert;

describe('Integration Tests', function () {
    const self = this;

    let integrated = true;
    const connAttrs = {
        user: process.env.TEST_ORACLE_USER,
        password: process.env.TEST_ORACLE_PASSWORD,
        connectString: process.env.TEST_ORACLE_CONNECTION_STRING
    };

    if ((!connAttrs.user) || (!connAttrs.password) || (!connAttrs.connectString)) {
        integrated = false;
    }

    if (!integrated) {
        it('empty', function () {
            return undefined;
        });
    } else {
        const oracledb = require('oracledb');

        oracledb.autoCommit = true;

        const simpleOracleDB = require('simple-oracledb');
        require('../../'); //load upsert

        simpleOracleDB.extend(oracledb);

        const end = function (done, connection) {
            if (connection) {
                connection.release();
            }

            setTimeout(done, 10);
        };

        let testPool;
        const initDB = function (tableName, data, cb) {
            oracledb.getConnection(connAttrs, function (connErr, connection) {
                data = data || [];

                if (connErr) {
                    console.error(connErr);
                    setTimeout(function () {
                        assert.fail('UNABLE TO OPEN DB CONNECTION.');
                    }, 100);
                } else {
                    connection.execute('DROP TABLE ' + tableName, [], function () {
                        connection.execute('CREATE TABLE ' + tableName + ' (ID NUMBER PRIMARY KEY, NAME constCHAR2(250), LOB_DATA CLOB)', [], function (createError) {
                            if (createError) {
                                console.error(createError);
                                assert.fail('UNABLE TO CREATE DB TABLE: ' + tableName);
                            } else {
                                const func = [];
                                data.forEach(function (rowData) {
                                    func.push(function (asyncCB) {
                                        if (!rowData.LOB_DATA) {
                                            rowData.LOB_DATA = undefined;
                                        }

                                        connection.execute('INSERT INTO ' + tableName + ' (ID, NAME, LOB_DATA) VALUES (:ID, :NAME, :LOB_DATA)', rowData, function (insertErr) {
                                            if (insertErr) {
                                                asyncCB(insertErr);
                                            } else {
                                                asyncCB(null, rowData);
                                            }
                                        });
                                    });
                                });

                                asyncLib.series(func, function (asynErr) {
                                    connection.release(function (rerr) {
                                        if (asynErr) {
                                            console.error(asynErr);
                                            assert.fail('UNABLE TO CREATE DB POOL.');
                                        } else if (rerr) {
                                            console.error('release error: ', rerr);
                                        } else if (testPool) {
                                            cb(testPool);
                                        } else {
                                            oracledb.createPool(connAttrs, function (perr, newPool) {
                                                if (perr) {
                                                    console.error(perr);
                                                    assert.fail('UNABLE TO CREATE DB POOL.');
                                                } else {
                                                    testPool = newPool;
                                                    cb(testPool);
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            });
        };

        self.timeout(30000);

        describe('upsert', function () {
            const createSQLs = function (table) {
                return {
                    query: 'SELECT ID FROM ' + table + ' WHERE ID = :id',
                    insert: 'INSERT INTO ' + table + ' (ID, NAME, LOB_DATA) VALUES (:id, :name, EMPTY_CLOB())',
                    update: 'UPDATE ' + table + ' SET NAME = :name, LOB_DATA = EMPTY_CLOB() WHERE ID = :id'
                };
            };

            it('empty table', function (done) {
                const table = 'TEST_ORA1';
                initDB(table, null, function (pool) {
                    pool.getConnection(function (err, connection) {
                        assert.isNull(err);

                        connection.query('SELECT * FROM ' + table, function (error1, jsRows) {
                            assert.isNull(error1);
                            assert.deepEqual([], jsRows);

                            connection.upsert(createSQLs(table), {
                                id: 110,
                                name: 'new name',
                                lobData: 'some long CLOB text here'
                            }, {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB_DATA: 'lobData'
                                }
                            }, function onUpsert(error2, results2) {
                                assert.isNull(error2);
                                assert.equal(results2.rowsAffected, 1);

                                connection.query('SELECT * FROM ' + table, function (error3, jsRows3) {
                                    assert.isNull(error3);
                                    assert.deepEqual([
                                        {
                                            ID: 110,
                                            NAME: 'new name',
                                            LOB_DATA: 'some long CLOB text here'
                                        }
                                    ], jsRows3);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });
            });

            it('existing row table', function (done) {
                const table = 'TEST_ORA2';
                initDB(table, [
                    {
                        id: 110,
                        name: 'old name'
                    }
                ], function (pool) {
                    pool.getConnection(function (err, connection) {
                        assert.isNull(err);

                        connection.query('SELECT * FROM ' + table, function (error1, jsRows) {
                            assert.isNull(error1);
                            assert.deepEqual([
                                {
                                    ID: 110,
                                    NAME: 'old name',
                                    LOB_DATA: null
                                }
                            ], jsRows);

                            connection.upsert(createSQLs(table), {
                                id: 110,
                                name: 'new name',
                                lobData: 'some long CLOB text here'
                            }, {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB_DATA: 'lobData'
                                }
                            }, function onUpsert(error2, results2) {
                                assert.isNull(error2);
                                assert.equal(results2.rowsAffected, 1);

                                connection.query('SELECT * FROM ' + table, function (error3, jsRows3) {
                                    assert.isNull(error3);
                                    assert.deepEqual([
                                        {
                                            ID: 110,
                                            NAME: 'new name',
                                            LOB_DATA: 'some long CLOB text here'
                                        }
                                    ], jsRows3);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });
            });
        });
    }
});
