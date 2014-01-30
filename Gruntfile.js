module.exports = function( grunt ) {
    grunt.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.loadNpmTasks( "grunt-contrib-connect" );
    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-contrib-watch" );
    grunt.loadNpmTasks( "grunt-contrib-qunit" );
    grunt.loadNpmTasks( "grunt-saucelabs" );
	
	grunt.loadTasks( "tasks" );

    grunt.initConfig({
        watch: {
            dev: {
              files: "<%= jshint.all %>",
              tasks: [ "jshint", "fetch_jquery_versions", "qunit" ]
            }
        },
        uglify: {
            dist: {
                options: {
                    preserveComments: "some"
                },
                files: {
                    "jQuery.ajaxRetry.min.js": [ "src/jQuery.ajaxRetry.js" ]
                }
            }
        },
        "fetch_jquery_versions": {
            options: {
                output: "test/jquery-versions.js",
                minVer: "1.5.0"
            }
        },
        "saucelabs-qunit": {
            all: {
                options: {
                    username: process.env.SAUCE_USERNAME,
                    key: process.env.SAUCE_ACCESS_KEY,
                    urls: [
                        "http://127.0.0.1:8001/test/master.html"
                    ],
                    build: process.env.TRAVIS_JOB_ID,
                    browsers: [
                        { browserName: "chrome" },
                        { browserName: "firefox" },
                        { browserName: "internet explorer" }
                    ],
                    testName: "Master Test Suite"
                }
            }
        },
        qunit: {
            all: [ "test/master.html" ]
        },
        connect: {
            server: {
                options: {
                    hostname: "",
                    port: 8001,
                    base: "."
                }
            }
        },
        jshint: {
            all: [
                "tasks/**/*.js",
                "src/**/*.js"
            ],
            grunt: {
                options: {
                    node: true
                },
                src: [ "Gruntfile.js" ]
            },
            test: {
                files: {
                    src: [ "test/test.js" ]
                },
                options: {
                    globals: {
                        $: false,
                        QUnit: false,
                        start: false,
                        expect: false,
                        module: false,
                        ok: false,
                        asyncTest: false,
                        jQuery: false
                    }
                }
            },
            options: {
                curly: true,
                eqeqeq: true,
                newcap: true,
                eqnull: true,
                bitwise: true,
                immed: true,
                noarg: true,
                unused: true,
                undef: true,
                trailing: true,
                browser: true,
                nonew: true,
                noempty: true,
                globals: {
                    jQuery: false,
                    require: false,
                    module: false
                }
            },
            
        }
    });
    
    grunt.registerTask( "default", [ "jshint", "fetch_jquery_versions", "qunit", "uglify" ]);
    grunt.registerTask( "dev", [ "connect", "watch" ]);
    grunt.registerTask( "travis", [ "jshint", "fetch_jquery_versions", "connect", "saucelabs-qunit" ]);
};