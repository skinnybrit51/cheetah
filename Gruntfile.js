module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('./package.json'),
        connect: {
            server: {
                options: {
                    port: 8002,
                    base: 'public'
                }
            }
        },
        simplemocha: {
            options: {
                timeout: 2000,
                ui: 'bdd',
                reporter: 'spec'
            },
            all: {
                src: ['test/**/*.js']
            }
        },
        jshint2: {
            options: {
                jshintrc: '.jshintrc',
                force: false,
                cache: true,
                reporter: 'default',
                globals: {
                    jQuery: true,
                    module: true,
                    require: true,
                    it: true,
                    describe: true,
                    beforeEach: true,
                    afterEach: true,
                    global: true,
                    window: true
                }
            },
            all: ['index.js', 'Gruntfile.js', 'test/**/*.js', 'lib/**/*.js']
        },
        jscs: {
            src: ['Gruntfile.js', 'test/**/*.js', 'lib/**/*.js'],
            options: {
                config: '.jscsrc'
            }
        },
        watch: {
            less: {
                files: './less/**/*.less',
                tasks: ['less']
            },
            app: {
                files: ['./lib/**/*'],
                tasks: ['browserify:development']
            }
        },
        less: {
            development: {
                files: {
                    'public/cheetah.css': 'less/cheetah.less'
                }
            },
            production: {
                options: {
                    compact: true
                },
                files: {
                    './dist/cheetah.min.css': 'less/cheetah.less'
                }
            }
        },
        browserify: {
            development: {
                dest: './public/demo-bootstrap.js',
                src: ['./lib/demo-bootstrap.js'],
                options: {

                    debug: true,            //sourcemaps
                    standalone: 'App',       // global variable name

                    transform: [ require('hamlify-js')]
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */'
            },
            production: {
                files: {
                    './dist/cheetah.min.js': ['./dist/cheetah.js']
                }
            }
        },
        clean: {
            js: ['./dist/*.js', '!./dist/*.min.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-jshint2');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-jscs');

    // run development server for debugging
    grunt.registerTask('default', [
        'less:development',
        'browserify:development',
        'connect',
        'watch'
    ]);

    // run unit tests
    grunt.registerTask('test', ['simplemocha']);

    // run file linter
    grunt.registerTask('lint', ['jshint2', 'jscs']);

    // production build
    grunt.registerTask('production', ['browserify', 'uglify:production',
        'less:production', 'clean']);
};
