/*global module:false, test:false, ok:false, expect:false, jqVersion:false */
QUnit.config.testTimeout = 2000;

(function() {
    var supportMock = $.mockjax({
        url: "support"
    });
    
    var supportsLegacyDeferred = !!$.ajax({ url: "support", async: false }).complete;
    var supportsAlways = !!$.Deferred().always;
    
    $.mockjaxClear( supportMock );
    
    function startAfter( times ) {
        var counter = 0;
        
        return function() {
            if ( ++counter === times ) {
                start();
            }
        };
    }
    
    $.each([ false, true ], function( _, testAsync ) {
        
        module( "Ajax Retry Tests (" + (testAsync ? "Asynchronous" : "Synchronous") + ")", {
            setup: function() {
                var failThenSuccessCalled = false;
                
                $.ajaxSetup({
                    async: testAsync
                });

                this.successMock = $.mockjax({
                    url: "success",
                    responseTime: 10,
                    responseText: "success",
                    status: 200
                });
                
                this.failureMock = $.mockjax({
                    url: "failure",
                    responseTime: 10,
                    responseText: "failure",
                    statusText: "error",
                    status: 500
                });
                
                this.failThenSuccessMock = $.mockjax({
                    url: "failThenSuccess",
                    responseTime: 10,
                    response: function() {
                        this.status = failThenSuccessCalled ? 200 : 500;
                        this.responseText = failThenSuccessCalled ? "success" : "failure";
                        this.statusText = failThenSuccessCalled ? "OK" : "error";
                        
                        failThenSuccessCalled = !failThenSuccessCalled;
                    }
                });
            },
            
            teardown: function() {
                $.mockjaxClear( this.successMock );
                $.mockjaxClear( this.failureMock );
                $.mockjaxClear( this.failThenSuccessMock );
            }
        });
        
        
        // Don't assert the version of jQuery in git.  It's always changing, and we don't want to have to keep this up to date.
        if ( jqVersion !== "git" ) {
            test( "jQuery Version", function() {
                expect(1);
                
                ok( jQuery.fn.jquery === jqVersion, "The correct version of jQuery ( " + jqVersion + " ) is being tested" );
            });
       }
        
        asyncTest( "shouldRetry - ajaxSetup", function() {
            expect(1);
            
            $.ajaxSetup({
                shouldRetry: function() {
                    ok( true, "shouldRetry should be invoked when set via $.ajaxSetup" );
                    return false;
                }
            });
            
            $.ajax({
                url: "failure",
                complete: start
            });
            
            delete $.ajaxSettings.shouldRetry;
        });
        
        asyncTest( "shouldRetry - arguments", function() {
            expect(1);
            
            var start = startAfter( 2 );
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function( jqXHR, retryCount, type ) {
                    ok( jqXHR.getAllResponseHeaders && retryCount === 0 && type === "GET", "Our parameters are correct" );
                },
                complete: start
            });
            
            $.ajax({
                url: "failThenSuccess",
                type: "POST",
                shouldRetry: function( jqXHR, retryCount, type ) {
                    ok( jqXHR.getAllResponseHeaders && retryCount === 0 && type === "POST", "Our parameters are correct" );
                },
                complete: start
            });
        });
        
        asyncTest( "shouldRetry - boolean ( true )", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                success: function() {
                    ok( true, "Our success callback was called" );
                },
                complete: start
            });
        });
        
        asyncTest( "shouldRetry - boolean ( false )", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: false,
                error: function() {
                    ok( true, "Our error callback was called" );
                },
                complete: start
            });
        });
        
        asyncTest( "shouldRetry - number( 1 )", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: 1,
                success: function() {
                    ok( true, "Our success callback was called" );
                },
                complete: start
            });
        });
        
        asyncTest( "shouldRetry - number( 0 )", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: 0,
                error: function() {
                    ok( true, "Our error callback was called" );
                },
                complete: start
            });
        });
        
        asyncTest( "shouldRetry - function", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function() {
                    return true;
                },
                success: function() {
                    ok( true, "Our success callback was called" );
                },
                complete: start
            });
        });
        
        asyncTest( "shouldRetry - promise( true )", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function() {
                    var dfr = $.Deferred();
                    dfr.resolve( true );
                    return dfr.promise();
                },
                success: function() {
                    ok( true, "Our success callback was called" );
                },
                complete: start
            });
        });
        
        asyncTest( "shouldRetry - promise( false )", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function() {
                    var dfr = $.Deferred();
                    dfr.reject();
                    return dfr.promise();
                },
                error: function() {
                    ok( true, "Our error callback was called" );
                },
                complete: start
            });
        });

        asyncTest( "shouldRetry - rejected promise", function() {
            expect(1);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function() {
                    var dfr = $.Deferred();
                    dfr.resolve( false );
                    return dfr.promise();
                },
                error: function() {
                    ok( true, "Our error callback was called" );
                },
                complete: start
            });
        });
        
        asyncTest( "statusCode - no retry, successful", function() {
            expect(2);
            var callbackCalled = false;
            
            $.ajax({
                url: "success",
                statusCode: {
                    200: function( data, textStatus, jqXHR ) {
                        ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                        ok( !callbackCalled, "Our success callback should only be called once" );
                        callbackCalled = true;
                    },
                    500: function() {
                        ok( false, "The 500 statusCode handler shouldn't be invoked" );
                    }
                },
                complete: start
            });
        });
        
        asyncTest( "statusCode - with retry, successful", function() {
            expect(2);
            var callbackCalled = false;

            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                statusCode: {
                    200: function( data, textStatus, jqXHR ) {
                        ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                        ok( !callbackCalled, "Our success callback should only be called once" );
                        callbackCalled = true;
                    },
                    500: function() {
                        ok( false, "The 500 statusCode handler shouldn't be invoked" );
                    }
                },
                complete: start
            });
        });
        
        asyncTest( "statusCode ( deferred ) - no retry, successful", function() {
            expect(2);
            var callbackCalled = false;
            
            $.ajax({
                url: "success",
                complete: start
            }).statusCode({
                200: function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                },
                500: function() {
                    ok( false, "The 500 statusCode handler shouldn't be invoked" );
                }
            });
        });
        
        asyncTest( "statusCode ( deferred ) - with retry, successful", function() {
            expect(2);
            var callbackCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                complete: start
            }).statusCode({
                200: function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                },
                500: function() {
                    ok( false, "The 500 statusCode handler shouldn't be invoked" );
                }
            });
        });
        
        asyncTest( "statusCode - without retry, failure", function() {
            expect(2);
            var callbackCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: function() {
                    return false;
                },
                statusCode: {
                    500: function( jqXHR, textStatus, errorThrown ) {
                        ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                        ok( !callbackCalled, "Our error callback should only be called once" );
                        callbackCalled = true;
                    }
                },
                complete: start
            });
        });
        
        asyncTest( "statusCode - with retry, successful", function() {
            expect(2);
            var callbackCalled = false;

            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                statusCode: {
                    200: function( data, textStatus, jqXHR ) {
                        ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                        ok( !callbackCalled, "Our success callback should only be called once" );
                        callbackCalled = true;
                    },
                    500: function() {
                        ok( false, "The 500 statusCode handler shouldn't be invoked" );
                    }
                },
                complete: start
            });
        });
        
        asyncTest( "statusCode (deferred) - without retry, failure", function() {
            expect(2);
            var callbackCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: function() {
                    return false;
                },
                complete: start
            }).statusCode({
                500: function( jqXHR, textStatus, errorThrown ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                    ok( !callbackCalled, "Our error callback should only be called once" );
                    callbackCalled = true;
                }
            });
        });
        
        asyncTest( "statusCode (deferred) - with retry, successful", function() {
            expect(2);
            var callbackCalled = false;

            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                complete: start
            }).statusCode({
                200: function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                },
                500: function() {
                    ok( false, "The 500 statusCode handler shouldn't be invoked" );
                }
            });
        });
        
        asyncTest( "shouldRetry returning false", function() {
            expect(1);
            
            $.ajax({
                url: "failure",
                shouldRetry: function() {
                    return false;
                },
                error: function() {
                    ok( true, "Our error handler should be invoked" );
                },
                complete: start
            });
        });
        
        asyncTest( "Success (options) arguments - no retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "success",
                shouldRetry: function() {
                    return false;
                },
                success: function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                },
                complete: start
            });
        });
        
        asyncTest( "Success (options) arguments - retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                success: function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                },
                complete: start
            });
        });
        
        asyncTest( "Done (deferred) arguments - no retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "success",
                shouldRetry: function() {
                    return false;
                },
                complete: start
            }).done(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
            });
        });
        
        asyncTest( "Done (deferred) arguments - retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                complete: start
            }).done(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
            });
        });
        
        asyncTest( "Error (options) arguments - no retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failure",
                error: function( jqXHR, textStatus, errorThrown ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                    ok( !callbackCalled, "Our error callback should only be called once" );
                    callbackCalled = true;
                },
                complete: start
            });
        });
        
        asyncTest( "Error (options) arguments - with retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failure",
                shouldRetry: 1,
                error: function( jqXHR, textStatus, errorThrown ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                    ok( !callbackCalled, "Our error callback should only be called once" );
                    callbackCalled = true;
                },
                complete: start
            });
        });
        
        asyncTest( "Fail (deferred) arguments - no retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failure",
                shouldRetry: function() {
                    return false;
                },
                complete: start
            }).fail(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            });
        });
        
        asyncTest( "Error (deferred) arguments - with retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: 1,
                complete: start
            }).fail(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            });
        });

        asyncTest( "Complete (options) arguments - no retry, successful", function() {
            expect(2);
            
            var completeCalled = false;
            
            $.ajax({
                url: "success",
                shouldRetry: function() {
                    return false;
                },
                complete: function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                    start();
                }
            });
        });

        asyncTest( "Complete (options) arguments - no retry, failure", function() {
            expect(2);
            var completeCalled = false;
            
            $.ajax({
                url: "failure",
                shouldRetry: function() {
                    return false;
                },
                complete: function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                    start();
                }
            });
        });

        asyncTest( "Complete (options) arguments - with retry, successful", function() {
            expect(2);
            var completeCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                complete: function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                    start();
                }
            });
        });

        asyncTest( "Complete (options) arguments - with retry, failure", function() {
            expect(2);
            
            var completeCalled = false;
            
            $.ajax({
                url: "failure",
                shouldRetry: 1,
                complete: function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                    start();
                }
            });
        });
        
        if ( supportsAlways ) {
            
            asyncTest( "always (Deferred) arguments - no retry, successful", function() {
                expect(2);
                
                var callbackCalled = false;
                
                $.ajax({
                    url: "success",
                    shouldRetry: function() {
                        return false;
                    },
                    complete: start
                }).always(function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                });
            });

            asyncTest( "always (deferred) arguments - no retry, failure", function() {
                expect(2);
                var callbackCalled = false;
                
                $.ajax({
                    url: "failure",
                    shouldRetry: function() {
                        return false;
                    },
                    complete: start
                }).always(function( jqXHR, textStatus, errorThrown ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                    ok( !callbackCalled, "Our error callback should only be called once" );
                    callbackCalled = true;
                });
            });

            asyncTest( "always (deferred) arguments - with retry, successful", function() {
                expect(2);
                var callbackCalled = false;
                
                $.ajax({
                    url: "failThenSuccess",
                    shouldRetry: true,
                    complete: start
                }).always(function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                });
            });

            asyncTest( "always (deferred) arguments - with retry, failure", function() {
                expect(2);
                
                var callbackCalled = false;

                $.ajax({
                    url: "failure",
                    shouldRetry: 1,
                    complete: start
                }).always(function( jqXHR, textStatus, errorThrown ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                    ok( !callbackCalled, "Our error callback should only be called once" );
                    callbackCalled = true;
                });
            });
        
        }

        asyncTest( "Error handler isn't invoked on successful retry", function() {
            expect(0);
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true,
                error: function() {
                    ok( false, "Our error handler shouldn't have been invoked" );
                },
                complete: start
            });
        });
        
        if ( supportsLegacyDeferred ) {
            asyncTest( "Complete (deferred) arguments - no retry, successful", function() {
                expect(2);
                
                var completeCalled = false;
                
                $.ajax({
                    url: "success",
                    shouldRetry: function() {
                        return false;
                    }
                }).complete(function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                }).complete(start);
            });

            asyncTest( "Complete (deferred) arguments - no retry, failure", function() {
                expect(2);
                
                var completeCalled = false;
                
                $.ajax({
                    url: "failure",
                    shouldRetry: function() {
                        return false;
                    }
                }).complete(function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                }).complete(start);
            });

            asyncTest( "Complete (deferred) arguments - with retry, successful", function() {
                expect(2);
                
                var completeCalled = false;
                
                $.ajax({
                    url: "failThenSuccess",
                    shouldRetry: true
                }).complete(function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                }).complete(start);
            });

            asyncTest( "Complete (deferred) arguments - with retry, failure", function() {
                expect(2);
                
                var completeCalled = false;

                $.ajax({
                    url: "failure",
                    shouldRetry: 1
                }).complete(function( jqXHR, textStatus ) {
                    ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                    ok( !completeCalled, "Our complete callback should only be called once" );
                    completeCalled = true;
                }).complete(start);
            });
            
            asyncTest( "Success (deferred) arguments - no retry, successful", function() {
                expect(2);
                
                var callbackCalled = false;
                
                $.ajax({
                    url: "success",
                    shouldRetry: function() {
                        return false;
                    },
                    complete: start
                }).success(function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                });
            });
            
            asyncTest( "Success (deferred) arguments - retry, successful", function() {
                expect(2);
                
                var callbackCalled = false;
                
                $.ajax({
                    url: "failThenSuccess",
                    shouldRetry: true,
                    complete: start
                }).success(function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                });
            });
            
            asyncTest( "Error (deferred) arguments - no retry, failure", function() {
                expect(2);
                
                var callbackCalled = false;
                
                $.ajax({
                    url: "failure",
                    shouldRetry: function() {
                        return false;
                    },
                    complete: start
                }).error(function( jqXHR, textStatus, errorThrown ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                    ok( !callbackCalled, "Our error callback should only be called once" );
                    callbackCalled = true;
                });
            });
            
            asyncTest( "Error (deferred) arguments - with retry, failure", function() {
                expect(2);
                
                var callbackCalled = false;

                $.ajax({
                    url: "failure",
                    shouldRetry: 1,
                    complete: start
                }).error(function( jqXHR, textStatus, errorThrown ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                    ok( !callbackCalled, "Our error callback should only be called once" );
                    callbackCalled = true;
                });
            });
        }
    });
}());