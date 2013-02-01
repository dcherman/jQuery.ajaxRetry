/*! jQuery.ajaxRetry v0.1 | (c) 2013 Daniel Herman | opensource.org/licenses/MIT */
(function( $ ) {
    "use strict";
    
    var retryKey = "__RETRY__" + new Date().getTime();

    $.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
        // Don't handle a call that's already "fixed" or that doesn't specify a shouldRetry option
        if ( options[retryKey] || typeof options.shouldRetry === "undefined" ) {
            return;
        }
        
        // Mark this as having been processed so the prefilter doesn't touch subsequent retried requests
        originalOptions[ retryKey ] = true;

        var
            // A deferred that will be resolved to satisfy the success, error, done, fail, and always handlers and deferreds
            dfr = $.Deferred(),
            
            // A deferred that'll be resolved to satisy the complete handler and deferred
            completeDeferred = $.Deferred(),
            
            // Any status code specific callbacks that should be invoked
            statusCodes = originalOptions.statusCode || {},
            
            // The number of times our request has been retried thus far
            retryCount = 0,
            
            // The options that'll be passed to our ajax handler if a retry is needed
            newOptions,
            
            // Returns either a boolean or a promise that'll be resolved with a boolean to determine
            // whether or not we should retry a given request.
            shouldRetry = function( jqXHR, retryCount, method ) {
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
                        result = test( jqXHR, retryCount, method );
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
            
        newOptions = $.extend({}, originalOptions );
        newOptions.statusCode = {};
        
        (function tryRequest( options, lastJqXHR ) {
            var willRetryDeferred = $.Deferred();
            
            // If lastJqXHR === undefined at this point, then it's the first ever request.
            // Ensure that we always proceed without calling the shouldRetry function in that case
            ( !lastJqXHR ? $.when(true) : shouldRetry(lastJqXHR, retryCount++, options.type || "GET") ).done(function( willRetry ) {
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