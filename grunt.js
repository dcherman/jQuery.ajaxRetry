module.exports = function( grunt ) {
    // JSHint chokes when a UTF8 file is read that includes the BOM.
    // This bug is fixed in grunt versions >= 0.4, but include the fix
    // for previous versions as well since 0.4 is still in development / unstable.
    // https://github.com/cowboy/grunt/issues/338
    // https://github.com/cowboy/grunt/commit/44b57274ceba147e24dcc121ed7d9b84e6ec4e49
    if ( parseFloat(grunt.version) < 0.4 ) {
        var _readFile = grunt.file.read;
        
        grunt.file.read = function() {
            var src = _readFile.apply( this, arguments );
            
            if (typeof src === 'string' && src.charCodeAt(0) === 0xFEFF) {
              src = src.substring(1);
            }
            
            return src;
        };
    }
    
    var jQueryManifest = grunt.file.readJSON( "manifest.jquery.json" );
    
    grunt.initConfig({
        watch: {
            dev: {
              files: '<config:lint.all>',
              tasks: 'lint qunit'
            }
        },
        lint: {
            all: [
                "grunt.js",
                "src/**/*.js",
                "test/test.js"
            ]
        },
        min: {
            dist: {
                src: [ "src/jQuery.ajaxRetry.js" ],
                dest: "dist/" + jQueryManifest.version + "/jQuery.ajaxRetry.min.js"
            }
        },
        qunit: {
            all: [ "test/master.html" ]
        },
        server: {
            port: 8001,
            base: "."
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                newcap: true,
                eqnull: true,
                bitwise: true,
                immed: true,
                noarg: true,
                unused: true,
                trailing: true,
                browser: true,
                nonew: true,
                noempty: true
            },
            globals: {
                require: false,
                define: false
            }
        }
    });
    
    grunt.registerTask( "default", "lint min qunit:all" );
    grunt.registerTask( "dev", "server watch" );
};