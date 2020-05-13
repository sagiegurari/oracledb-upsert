'use strict';

/*jslint nomen: true*/
//jscs:disable disallowDanglingUnderscores
/*eslint-disable no-underscore-dangle*/

module.exports = function (grunt) {
    const commons = require('js-project-commons');

    grunt.loadNpmTasks('grunt-shell');

    commons.grunt.config.initConfig(grunt, {
        buildConfig: {
            projectRoot: __dirname,
            nodeProject: true,
            skipSecurityCheck: true
        },
        apidoc2readme: {
            readme: {
                options: {
                    tags: {
                        'connection-upsert': 'Connection.upsert'
                    },
                    modifySignature(line) {
                        return line.split('Connection.').join('connection.').split('Promise').join('[Promise]');
                    }
                }
            }
        }
    });
};
