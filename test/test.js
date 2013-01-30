/*globals module:false, test:false, ok:false, expect:false, asyncTest:false, start:false, jqVersion:false, strictEqual:false */

(function() {
    var supportMock = $.mockjax({
        url: "support"
    });
    
    var supportsLegacyDeferred = !!$.ajax({ url: "support", async: false }).complete;
    var supportsAlways = !!$.Deferred().always;
    
    $.mockjaxClear( supportMock );

    module( "Ajax Retry Tests", {
        setup: function() {
            var failThenSuccessCalled = false;
            
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


    test( "jQuery Version", function() {
        expect(1);
        
        ok( jQuery.fn.jquery === jqVersion, "The correct version of jQuery is being tested" );
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
                    start();
                },
                500: function() {
                    ok( false, "The 500 statusCode handler shouldn't be invoked" );
                }
            }
        });
    });
    
    asyncTest( "statusCode - with retry, successful", function() {
        expect(2);
        var callbackCalled = false;

        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function() {
                return true;
            },
            statusCode: {
                200: function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                    start();
                },
                500: function() {
                    ok( false, "The 500 statusCode handler shouldn't be invoked" );
                }
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
                    start();
                }
            }
        });
    });
    
    asyncTest( "statusCode - with retry, successful", function() {
        expect(2);
        var callbackCalled = false;

        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function() {
                return true;
            },
            statusCode: {
                200: function( data, textStatus, jqXHR ) {
                    ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                    ok( !callbackCalled, "Our success callback should only be called once" );
                    callbackCalled = true;
                    start();
                },
                500: function() {
                    ok( false, "The 500 statusCode handler shouldn't be invoked" );
                }
            }
        });
    });
    
    asyncTest( "shouldRetry returning promise", function() {
        expect(1);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function() {
                var dfr = $.Deferred();
                dfr.resolve( true );
                return dfr.promise();
            },
            success: function() {
                ok( true, "We successfully retried with shouldRetry returning a promise" );
                start();
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
            success: function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
                start();
            }
        });
    });
    
    asyncTest( "Success (options) arguments - retry, successful", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function() {
                return true;
            },
            success: function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
                start();
            }
        });
    });
    
    asyncTest( "Done (deferred) arguments - no retry, successful", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "success"
        }).done(function( data, textStatus, jqXHR ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
            ok( !callbackCalled, "Our success callback should only be called once" );
            callbackCalled = true;
            start();
        });
    });
    
    asyncTest( "Done (deferred) arguments - retry, successful", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function() {
                return true;
            }
        }).done(function( data, textStatus, jqXHR ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
            ok( !callbackCalled, "Our success callback should only be called once" );
            callbackCalled = true;
            start();
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
                start();
            }
        });
    });
    
    asyncTest( "Error (options) arguments - with retry, failure", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failure",
            shouldRetry: function( jqXHR, retryCount ) {
                return retryCount === 0;
            },
            error: function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
                start();
            }
        });
    });
    
    asyncTest( "Fail (deferred) arguments - no retry, failure", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failure"
        }).fail(function( jqXHR, textStatus, errorThrown ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
            ok( !callbackCalled, "Our error callback should only be called once" );
            callbackCalled = true;
            start();
        });
    });
    
    asyncTest( "Error (deferred) arguments - with retry, failure", function() {
        expect(2);
        
        var callbackCalled = false;

        $.ajax({
            url: "failure",
            shouldRetry: function( jqXHR, retryCount ) {
                return retryCount === 0;
            }
        }).fail(function( jqXHR, textStatus, errorThrown ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
            ok( !callbackCalled, "Our error callback should only be called once" );
            callbackCalled = true;
            start();
        });
    });

    asyncTest( "Complete (options) arguments - no retry, successful", function() {
        expect(2);
        
        var completeCalled = false;
        
        $.ajax({
            url: "success",
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
            shouldRetry: function() {
                return true;
            },
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
            shouldRetry: function( jqXHR, retryCount ) {
                return retryCount === 0;
            },
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
                url: "success"
            }).always(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });

        asyncTest( "always (deferred) arguments - no retry, failure", function() {
            expect(2);
            var callbackCalled = false;
            
            $.ajax({
                url: "failure"
            }).always(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });

        asyncTest( "always (deferred) arguments - with retry, successful", function() {
            expect(2);
            var callbackCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function() {
                    return true;
                }
            }).always(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });

        asyncTest( "always (deferred) arguments - with retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: function( jqXHR, retryCount ) {
                    return retryCount === 0;
                }
            }).always(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });
    
    }

    asyncTest( "Error handler isn't invoked on successful retry", function() {
        expect(0);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function() {
                return true;
            },
            error: function() {
                ok( false, "Our error handler shouldn't have been invoked" );
            },
            complete: function() {
                start();
            }
        });
    });
    
    if ( supportsLegacyDeferred ) {
        asyncTest( "Complete (deferred) arguments - no retry, successful", function() {
            expect(2);
            
            var completeCalled = false;
            
            $.ajax({
                url: "success"
            }).complete(function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
                start();
            });
        });

        asyncTest( "Complete (deferred) arguments - no retry, failure", function() {
            expect(2);
            
            var completeCalled = false;
            
            $.ajax({
                url: "failure"
            }).complete(function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
                start();
            });
        });

        asyncTest( "Complete (deferred) arguments - with retry, successful", function() {
            expect(2);
            
            var completeCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function() {
                    return true;
                }
            }).complete(function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
                start();
            });
        });

        asyncTest( "Complete (deferred) arguments - with retry, failure", function() {
            expect(2);
            
            var completeCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: function( jqXHR, retryCount ) {
                    return retryCount === 0;
                }
            }).complete(function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
                start();
            });
        });
        
        asyncTest( "Success (deferred) arguments - no retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "success"
            }).success(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });
        
        asyncTest( "Success (deferred) arguments - retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: function() {
                    return true;
                }
            }).success(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });
        
        asyncTest( "Error (deferred) arguments - no retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failure"
            }).error(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });
        
        asyncTest( "Error (deferred) arguments - with retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: function( jqXHR, retryCount ) {
                    return retryCount === 0;
                }
            }).error(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
                start();
            });
        });
    }
}());