module.exports = function( grunt ) {
	"use strict";
	
	var request = require( "request" );
	var semver = require( "semver" );
	var rMajorMinorPatch = /^(\d+\.\d+\.\d+)/;
	var rMajorMinor = /^(\d+\.\d+)/;
	var badLabel = /(.*\d)(rc|beta|a|b)/;

	var fixedVersions = {};

	function isJqueryCore( name ) {
		return /^jquery-\d+\.\d+(?:\.\d+)?[^\.]*\.js$/.test( name );
	}

	function getName( entry )  {
		return entry.name.trim();
	}

	function removePrefix( name ) {
		return name.replace( "jquery-", "" );
	}

	function removeSuffix( name ) {
		return name.replace( ".js", "" );
	}

	function minVer( target ) {
		return function( version ) {
			return semver.gte( version, target );
		};
	}

	function maxVer( target ) {
		return function( version ) {
			return !semver.gt( version, target );
		};
	}

	// Older versions of jQuery did not follow semver.
	// When we encounter one of those scenarios, fix the version
	// for parsing and store the original version so that we can retrieve it later
	function fixInvalidVersions( version ) {
		var originalVersion = version;

		try {
			if ( semver.valid( version ) ) {
				return version;
			}
		}
		finally {
			// If the version is missing patch information ( eg "1.5" ), then append a .0 to complete it( "1.5.0" );
			if ( !rMajorMinorPatch.test( version ) ) {
				version = version.replace( rMajorMinor, "$1.0" );
			}

			// If the version had bad label formatting ( eg "1.5.1beta2" ), then prepend a dash ( "1.5.1-beta2" );
			version = version.replace( badLabel, "$1-$2" );

			fixedVersions[ version ] = originalVersion;

			return version;
		}
	}
	
	grunt.registerTask( "fetch_jquery_versions", function() {
		var options = this.options();

		if ( typeof options.output !== 'string' ) {
			grunt.log.error( "You must provide an `output` path" );
			return false;
		}

		var done = this.async();

		request({
			url: "https://api.github.com/repos/jquery/codeorigin.jquery.com/contents/cdn",
			headers: {
				"User-Agent": "Node"
			}
		}, function( error, response, body ) {
			if ( error ) {
				done( false );
			}

			var files = JSON.parse( body )
				.map( getName )
				.filter( isJqueryCore )
				.map( removePrefix )
				.map( removeSuffix )
				.map( fixInvalidVersions );

			if ( options.minVer ) {
				files = files.filter( minVer( options.minVer ) );
			}

			if ( options.maxVer ) {
				files = files.filter( maxVer( options.maxVer ) );
			}

			var latestVersions = files.reduce(function( latestVersions, version ) {
				var importantVersion = rMajorMinorPatch.exec( version )[ 1 ];

				var latest = latestVersions[ importantVersion ];
				
				if ( !latest || semver.gt( version, latest ) ) {
					latestVersions[ importantVersion ] = version;
				}

				return latestVersions;
			}, {});

			var versions = Object.keys( latestVersions ).map(function( key ) {
				var latest = latestVersions[ key ];

				if ( latest in fixedVersions ) {
					return fixedVersions[ latest ];
				}

				return latest;
			});

			grunt.file.write( options.output, "var versions = " + JSON.stringify(versions, null, 4) + ";");
			grunt.config.set( "fetch_jquery_versions.results", versions );
			done();
		});
	});
};