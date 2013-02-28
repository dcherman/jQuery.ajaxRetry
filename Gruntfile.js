module.exports = function( grunt ) {
    grunt.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.loadNpmTasks( "grunt-contrib-connect" );
    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-contrib-watch" );
    grunt.loadNpmTasks( "grunt-contrib-qunit" );
    
    var jQueryManifest = grunt.file.readJSON( "jquery.ajaxRetry.jquery.json" );
    
    grunt.initConfig({
        watch: {
            dev: {
              files: "<%= jshint.all %>",
              tasks: [ "jshint", "qunit" ]
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
                "grunt.js",
                "src/**/*.js"
            ],
            test: {
                files: {
                    src: [ "test/test.js" ]
                },
                options: {
                    globals: {
                        $: false,
                        QUnit: false,
                        start: false,
                        ok: false,
                        asyncTest: false,
                        gitVersion: false,
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
                    jQuery: false
                }
            },
            
        }
    });
    
    grunt.registerTask( "default", [ "jshint", "qunit", "uglify" ]);
    grunt.registerTask( "dev", [ "connect", "watch" ]);
};