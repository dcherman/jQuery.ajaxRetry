(function( $, undefined ) {
    "use strict";
    
    var retryKey = "__RETRY__" + new Date().getTime();

    $.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
        // Don't handle a call that's already "fixed" or that doesn't specify a shouldRetry option
        if ( options[retryKey] || typeof options.shouldRetry === "undefined" ) {
            return;
        }
        
        // Mark this as having been processed so the prefilter doesn't touch subsequent retried requests
        originalOptions[ retryKey ] = true;
        
        // We haven't retried anything yet, so start us out at 0;
        originalOptions.retryCount = 0;

        var dfr = $.Deferred(),
            statusCodes = originalOptions.statusCode || {},
            completeDeferred = $.Deferred(),
            shouldRetry = function( jqXHR, retryCount ) {
                var result,
                    test = originalOptions.shouldRetry,
                    type = typeof test;
                    
                switch( type ) {
                    case "number":
                        result = retryCount < test;
                        break;
                    case "boolean":
                        result = test;
                        break;
                    case "function":
                        result = test( jqXHR, retryCount );
                        break;
                }

                return $.when( result );
            };
        
        dfr.then( options.success, options.error );
        completeDeferred.done( options.complete );

        // Completely obliterate the original request state handlers since we want to handle them manually.
        // Also get rid of the statusCode handler since we're going to handle that manually as well.
        options.success = options.error = options.complete = originalOptions.success =
            originalOptions.error = originalOptions.complete = jqXHR.statusCode = $.noop;
            
        var newOptions = $.extend({}, originalOptions );
        newOptions.statusCode = {};
        
        (function tryRequest( options, lastJqXHR ) {
            var willRetryDeferred = $.Deferred();
            
            // If lastJqXHR === undefined at this point, then it's the first ever request.
            // Ensure that we always proceed without calling the shouldRetry function in that case
            ( !lastJqXHR ? $.when(true) : shouldRetry(lastJqXHR, options.retryCount++) ).done(function( willRetry ) {
                if ( willRetry === true ) {
                    (!lastJqXHR ? jqXHR : $.ajax(options) ).then(
                        function( data, textStatus, jqXHR ) {
                            dfr.resolveWith( this, arguments );
                            dfr.done( statusCodes[jqXHR.status] );
                            completeDeferred.resolveWith( this, [ jqXHR, textStatus ]);
                        },
                        function( jqXHR, textStatus ) {
                            var failureArgs = arguments,
                                failureContext = this;
                            
                            tryRequest( options, jqXHR ).done(function( willRetry ) {
                                if ( willRetry !== true ) {
                                    dfr.rejectWith( failureContext, failureArgs );
                                    dfr.fail( statusCodes[jqXHR.status] );
                                    completeDeferred.resolveWith( failureContext, [ jqXHR, textStatus ]);
                                }
                            });
                        }
                    );
                }
                
                willRetryDeferred.resolve( willRetry );
            });
 
            return willRetryDeferred.promise();
        }( newOptions ));
        
        // Install legacy deferred style functions.  These are deprecated,
        // and presumably will be removed as a group at some point.
        // To maintain API compatibility, first check if we should even install these.
        if ( jqXHR.complete ) {
            jqXHR.complete = completeDeferred.done;
            jqXHR.success = dfr.done;
            jqXHR.error = dfr.fail;
        }
        
        // Override the promise methods on the jqXHR.  Don't use the .promise(obj) syntax
        // here since that wasn't introduced until 1.6.
        $.extend( jqXHR, dfr.promise() );
    });
}( jQuery ));