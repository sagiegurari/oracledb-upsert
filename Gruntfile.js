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
        }
    }, function projectConfig() {
        grunt.registerTask('project-docs', 'Create project docs', [
            'apidoc2readme:readme'
        ]);

        return {
            tasks: {
                apidoc2readme: {
                    readme: {
                        options: {
                            tags: {
                                'connection-upsert': 'Connection.upsert'
                            }
                        }
                    }
                }
            }
        };
    });
};
