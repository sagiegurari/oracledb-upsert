'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var SimpleOracleDB = require('simple-oracledb');
var upsert = require('../../lib/upsert');

describe('upsert Tests', function () {
    var createOracleDB = function () {
        var failFunc = function () {
            assert.fail();
        };

        var oracledb = {
            createPool: function () {
                return undefined;
            },
            getConnection: function () {
                var callback = arguments[arguments.length - 1];
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
            var oracledb = createOracleDB();

            oracledb.getConnection({}, function (error, connection) {
                assert.isNull(error);
                assert.isFunction(connection.upsert);

                done();
            })
        });
    });

    describe('upsert', function () {
        it('no options', function (done) {
            var oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](new Error('test error'));
                };

                connection.upsert({}, {}, function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'test error');
                    assert.isUndefined(result);

                    done();
                });
            })
        });

        it('null bind params', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('array bind params', function (done) {
            var oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.upsert({}, [], function (error, result) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'Array type bind params are not supported.');
                    assert.isUndefined(result);

                    done();
                });
            })
        });

        it('query error', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('insert general error', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('insert unique constraint error and update error', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('no insert and update error', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('insert valid', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('row exists, update valid', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('row exists, update did not modify any row', function (done) {
            var oracledb = createOracleDB();

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
            })
        });

        it('insert unique constraint error and update valid', function (done) {
            var oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    arguments[arguments.length - 1](null, []);
                };

                var insertCalled = false;
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
            })
        });

        it('insert no impact and update valid', function (done) {
            var oracledb = createOracleDB();

            oracledb.getConnection({}, function (connectionError, connection) {
                assert.isNull(connectionError);

                connection.query = function () {
                    assert.equal(arguments[0], 'select 1');

                    arguments[arguments.length - 1](null, []);
                };

                var insertCalled = false;
                connection.insert = function () {
                    assert.equal(arguments[0], 'insert 2');

                    insertCalled = true;

                    arguments[arguments.length - 1](null, {
                        rowsAffected: 0
                    });
                };

                connection.update = function () {
                    assert.equal(arguments[0], 'update 3');

                    arguments[arguments.length - 1](null, {
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
            })
        });
    });
});
