'use strict';

const chai = require('chai');
const assert = chai.assert;
const PromiseLib = global.Promise || require('promiscuous');
const SimpleOracleDB = require('simple-oracledb');
require('../../lib/upsert');

describe('upsert Tests', function () {
    const asArray = function (args) {
        return Array.prototype.slice.call(args, 0);
    };

    const createOracleDB = function () {
        const failFunc = function () {
            assert.fail();
        };

        const oracledb = {
            createPool() {
                return undefined;
            },
            getConnection() {
                const args = asArray(arguments);
                const callback = args[args.length - 1];
                callback(null, {
                    query: failFunc,
                    insert: failFunc,
                    update: failFunc
                });
            }
        };

        SimpleOracleDB.extend(oracledb);

        return oracledb;
    };

    describe('extension', function () {
        it('valid', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (error, connection) {
                assert.isNull(error);
                assert.isFunction(connection.upsert);

                done();
            });
        });
    });

    describe('upsert', function () {
        it('no options', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    const args = asArray(arguments);
                    args[args.length - 1](new Error('test error'));
                };

                connection.upsert({}, {}, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test error');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('null bind params', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](new Error('test error'));
                };

                connection.upsert({}, null, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test error');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('array bind params', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.upsert({}, [], function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'Array type bind params are not supported.');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('query error', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](new Error('test query error'));
                };

                connection.upsert({}, {}, {}, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test query error');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('insert general error', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, []);
                };

                connection.insert = function () {
                    arguments[arguments.length - 1](new Error('test insert error'));
                };

                connection.upsert({}, {}, {}, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test insert error');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('insert unique constraint error and update error', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, []);
                };

                connection.insert = function () {
                    arguments[arguments.length - 1](new Error('test ORA-00001 error'));
                };

                connection.update = function () {
                    arguments[arguments.length - 1](new Error('test update error'));
                };

                connection.upsert({}, {}, {}, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test update error');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('no insert and update error', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, [{}]);
                };

                connection.update = function () {
                    arguments[arguments.length - 1](new Error('test update2 error'));
                };

                connection.upsert({}, {}, {}, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test update2 error');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('no insert and update error, using promise', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, [{}]);
                };

                connection.update = function () {
                    arguments[arguments.length - 1](new Error('test update2 error'));
                };

                global.Promise = PromiseLib;

                const promise = connection.upsert({}, {}, {});

                promise.then(function () {
                    assert.fail();
                }).catch(function (error) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test update2 error');

                    done();
                });
            });
        });

        it('insert valid', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, []);
                };

                connection.insert = function () {
                    arguments[arguments.length - 1](null, {
                        rowsAffected: 1
                    });
                };

                connection.upsert({}, {}, {}, function (error, result) {
                    assert.isNull(error);
                    assert.deepEqual(result, {
                        rowsAffected: 1
                    });

                    done();
                });
            });
        });

        it('insert valid, using promise', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, []);
                };

                connection.insert = function () {
                    arguments[arguments.length - 1](null, {
                        rowsAffected: 1
                    });
                };

                global.Promise = PromiseLib;

                const promise = connection.upsert({}, {}, {});

                promise.then(function (result) {
                    assert.deepEqual(result, {
                        rowsAffected: 1
                    });

                    done();
                }).catch(function () {
                    assert.fail();
                });
            });
        });

        it('row exists, update valid', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, [{}]);
                };

                connection.update = function () {
                    arguments[arguments.length - 1](null, {
                        rowsAffected: 1
                    });
                };

                connection.upsert({
                    query: 'SELECT * FROM MY_TABLE WHERE A = :a',
                    update: 'UPDATE MY_TABLE SET B = :b, MY_CLOB = EMPTY_CLOB() WHERE A = :a'
                }, {
                    a: 1,
                    b: 2,
                    myClob: 3
                }, {
                    lobMetaInfo: {
                        MY_CLOB: 'myClob'
                    }
                }, function (error, result) {
                    assert.isNull(error);
                    assert.deepEqual(result, {
                        rowsAffected: 1
                    });

                    done();
                });
            });
        });

        it('row exists, update valid, using promise', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, [{}]);
                };

                connection.update = function () {
                    arguments[arguments.length - 1](null, {
                        rowsAffected: 1
                    });
                };

                global.Promise = PromiseLib;

                const promise = connection.upsert({
                    query: 'SELECT * FROM MY_TABLE WHERE A = :a',
                    update: 'UPDATE MY_TABLE SET B = :b, MY_CLOB = EMPTY_CLOB() WHERE A = :a'
                }, {
                    a: 1,
                    b: 2,
                    myClob: 3
                }, {
                    lobMetaInfo: {
                        MY_CLOB: 'myClob'
                    }
                });

                promise.then(function (result) {
                    assert.deepEqual(result, {
                        rowsAffected: 1
                    });

                    done();
                }).catch(function () {
                    assert.fail();
                });
            });
        });

        it('row exists, update did not modify any row', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, [{}]);
                };

                connection.update = function () {
                    arguments[arguments.length - 1](null, {
                        rowsAffected: 0
                    });
                };

                connection.upsert({}, {}, {}, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'No rows updated.');
                    assert.isUndefined(result);

                    done();
                });
            });
        });

        it('insert unique constraint error and update valid', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, []);
                };

                let insertCalled = false;
                connection.insert = function () {
                    insertCalled = true;

                    arguments[arguments.length - 1](new Error('test ORA-00001 error'));
                };

                connection.update = function () {
                    arguments[arguments.length - 1](null, {
                        rowsAffected: 1
                    });
                };

                connection.upsert({}, {}, {}, function (error, result) {
                    assert.isNull(error);
                    assert.isTrue(insertCalled);
                    assert.deepEqual(result, {
                        rowsAffected: 1
                    });

                    done();
                });
            });
        });

        it('insert no impact and update valid', function (done) {
            const oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    const args = asArray(arguments);
                    assert.equal(args[0], 'select 1');

                    args[args.length - 1](null, []);
                };

                let insertCalled = false;
                connection.insert = function () {
                    const args = asArray(arguments);
                    assert.equal(args[0], 'insert 2');

                    insertCalled = true;

                    args[args.length - 1](null, {
                        rowsAffected: 0
                    });
                };

                connection.update = function () {
                    const args = asArray(arguments);
                    assert.equal(args[0], 'update 3');

                    args[args.length - 1](null, {
                        rowsAffected: 1
                    });
                };

                connection.upsert({
                    query: 'select 1',
                    insert: 'insert 2',
                    update: 'update 3'
                }, {}, {}, function (error, result) {
                    assert.isNull(error);
                    assert.isTrue(insertCalled);
                    assert.deepEqual(result, {
                        rowsAffected: 1
                    });

                    done();
                });
            });
        });
    });
});
