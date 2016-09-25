'use strict';

/*jslint nomen: true*/
//jscs:disable disallowDanglingUnderscores
/*eslint-disable no-underscore-dangle*/

module.exports = function (grunt) {
    var commons = require('js-project-commons');

    commons.grunt.config.initConfig(grunt, {
        buildConfig: {
            projectRoot: __dirname,
            nodeProject: true
        },
        apidoc2readme: {
            readme: {
                options: {
                    tags: {
                        'connection-upsert': 'Connection.upsert'
                    },
                    modifySignature: function (line) {
                        return line.split('Connection.').join('connection.');
                    }
                }
            }
        }
    });
};
