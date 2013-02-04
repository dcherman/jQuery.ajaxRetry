/*global module:false, test:false, ok:false, expect:false, jqVersion:false */

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
            
            $.ajaxSetup({
                async: false
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
            
            $.ajaxSetup({
                async: true
            });
        }
    });
    
    
    // Don't assert the version of jQuery in git.  It's always changing, and we don't want to have to keep this up to date.
    if ( !gitVersion ) {
        test( "jQuery Version", function() {
            expect(1);
            
            ok( jQuery.fn.jquery === jqVersion, "The correct version of jQuery ( " + jqVersion + " ) is being tested" );
        });
    }
    
    test( "shouldRetry - ajaxSetup", function() {
        expect(1);
        
        $.ajaxSetup({
            shouldRetry: function() {
                ok( true, "shouldRetry should be invoked when set via $.ajaxSetup" );
                return false;
            }
        });
        
        $.ajax({
            url: "failure"
        });
        
        delete $.ajaxSettings.shouldRetry;
    });
    
    test( "shouldRetry - arguments", function() {
        expect(1);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function( jqXHR, retryCount, type ) {
                ok( jqXHR.getAllResponseHeaders && retryCount === 0 && type === "GET", "Our parameters are correct" );
            }
        });
        
        $.ajax({
            url: "failThenSuccess",
            type: "POST",
            shouldRetry: function( jqXHR, retryCount, type ) {
                ok( jqXHR.getAllResponseHeaders && retryCount === 0 && type === "POST", "Our parameters are correct" );
            }
        });
    });
    
    test( "shouldRetry - boolean ( true )", function() {
        expect(1);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: true,
            success: function() {
                ok( true, "Our success callback was called" );
            }
        });
    });
    
    test( "shouldRetry - boolean ( false )", function() {
        expect(1);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: false,
            error: function() {
                ok( true, "Our error callback was called" );
            }
        });
    });
    
    test( "shouldRetry - number( 1 )", function() {
        expect(1);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: 1,
            success: function() {
                ok( true, "Our success callback was called" );
            }
        });
    });
    
    test( "shouldRetry - number( 0 )", function() {
        expect(1);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: 0,
            error: function() {
                ok( true, "Our error callback was called" );
            }
        });
    });
    
    test( "shouldRetry - function", function() {
        expect(1);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: function() {
                return true;
            },
            success: function() {
                ok( true, "Our success callback was called" );
            }
        });
    });
    
    test( "shouldRetry - promise( true )", function() {
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
            }
        });
    });
    
    test( "shouldRetry - promise( false )", function() {
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
            }
        });
    });
    
    test( "statusCode - no retry, successful", function() {
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
            }
        });
    });
    
    test( "statusCode - with retry, successful", function() {
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
            }
        });
    });
    
    test( "statusCode ( deferred ) - no retry, successful", function() {
        expect(2);
        var callbackCalled = false;
        
        $.ajax({
            url: "success"
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
    
    test( "statusCode ( deferred ) - with retry, successful", function() {
        expect(2);
        var callbackCalled = false;
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: true
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
    
    test( "statusCode - without retry, failure", function() {
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
            }
        });
    });
    
    test( "statusCode - with retry, successful", function() {
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
            }
        });
    });
    
    test( "statusCode (deferred) - without retry, failure", function() {
        expect(2);
        var callbackCalled = false;

        $.ajax({
            url: "failure",
            shouldRetry: function() {
                return false;
            }
        }).statusCode({
            500: function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            }
        });
    });
    
    test( "statusCode (deferred) - with retry, successful", function() {
        expect(2);
        var callbackCalled = false;

        $.ajax({
            url: "failThenSuccess",
            shouldRetry: true
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
    
    test( "shouldRetry returning false", function() {
        expect(1);
        
        $.ajax({
            url: "failure",
            shouldRetry: function() {
                return false;
            },
            error: function() {
                ok( true, "Our error handler should be invoked" );
            }
        });
    });
    
    test( "Success (options) arguments - no retry, successful", function() {
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
            }
        });
    });
    
    test( "Success (options) arguments - retry, successful", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: true,
            success: function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
            }
        });
    });
    
    test( "Done (deferred) arguments - no retry, successful", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "success",
            shouldRetry: function() {
                return false;
            }
        }).done(function( data, textStatus, jqXHR ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
            ok( !callbackCalled, "Our success callback should only be called once" );
            callbackCalled = true;
        });
    });
    
    test( "Done (deferred) arguments - retry, successful", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: true
        }).done(function( data, textStatus, jqXHR ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
            ok( !callbackCalled, "Our success callback should only be called once" );
            callbackCalled = true;
        });
    });
    
    test( "Error (options) arguments - no retry, failure", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failure",
            error: function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            }
        });
    });
    
    test( "Error (options) arguments - with retry, failure", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failure",
            shouldRetry: 1,
            error: function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            }
        });
    });
    
    test( "Fail (deferred) arguments - no retry, failure", function() {
        expect(2);
        
        var callbackCalled = false;
        
        $.ajax({
            url: "failure",
            shouldRetry: function() {
                return false;
            }
        }).fail(function( jqXHR, textStatus, errorThrown ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
            ok( !callbackCalled, "Our error callback should only be called once" );
            callbackCalled = true;
        });
    });
    
    test( "Error (deferred) arguments - with retry, failure", function() {
        expect(2);
        
        var callbackCalled = false;

        $.ajax({
            url: "failure",
            shouldRetry: 1
        }).fail(function( jqXHR, textStatus, errorThrown ) {
            ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
            ok( !callbackCalled, "Our error callback should only be called once" );
            callbackCalled = true;
        });
    });

    test( "Complete (options) arguments - no retry, successful", function() {
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
            }
        });
    });

    test( "Complete (options) arguments - no retry, failure", function() {
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
            }
        });
    });

    test( "Complete (options) arguments - with retry, successful", function() {
        expect(2);
        var completeCalled = false;
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: true,
            complete: function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
            }
        });
    });

    test( "Complete (options) arguments - with retry, failure", function() {
        expect(2);
        
        var completeCalled = false;
        
        $.ajax({
            url: "failure",
            shouldRetry: 1,
            complete: function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
            }
        });
    });
    
    if ( supportsAlways ) {
        
        test( "always (Deferred) arguments - no retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "success",
                shouldRetry: function() {
                    return false;
                }
            }).always(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
            });
        });

        test( "always (deferred) arguments - no retry, failure", function() {
            expect(2);
            var callbackCalled = false;
            
            $.ajax({
                url: "failure",
                shouldRetry: function() {
                    return false;
                }
            }).always(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            });
        });

        test( "always (deferred) arguments - with retry, successful", function() {
            expect(2);
            var callbackCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true
            }).always(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
            });
        });

        test( "always (deferred) arguments - with retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: 1
            }).always(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            });
        });
    
    }

    test( "Error handler isn't invoked on successful retry", function() {
        expect(0);
        
        $.ajax({
            url: "failThenSuccess",
            shouldRetry: true,
            error: function() {
                ok( false, "Our error handler shouldn't have been invoked" );
            }
        });
    });
    
    if ( supportsLegacyDeferred ) {
        test( "Complete (deferred) arguments - no retry, successful", function() {
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
            });
        });

        test( "Complete (deferred) arguments - no retry, failure", function() {
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
            });
        });

        test( "Complete (deferred) arguments - with retry, successful", function() {
            expect(2);
            
            var completeCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true
            }).complete(function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
            });
        });

        test( "Complete (deferred) arguments - with retry, failure", function() {
            expect(2);
            
            var completeCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: 1
            }).complete(function( jqXHR, textStatus ) {
                ok( jqXHR.getAllResponseHeaders && typeof textStatus === "string", "Our complete callback's parameters are correct" );
                ok( !completeCalled, "Our complete callback should only be called once" );
                completeCalled = true;
            });
        });
        
        test( "Success (deferred) arguments - no retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "success",
                shouldRetry: function() {
                    return false;
                }
            }).success(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
            });
        });
        
        test( "Success (deferred) arguments - retry, successful", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failThenSuccess",
                shouldRetry: true
            }).success(function( data, textStatus, jqXHR ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "success" && data === "success", "Our success callback's parameters are correct" );
                ok( !callbackCalled, "Our success callback should only be called once" );
                callbackCalled = true;
            });
        });
        
        test( "Error (deferred) arguments - no retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;
            
            $.ajax({
                url: "failure",
                shouldRetry: function() {
                    return false;
                }
            }).error(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            });
        });
        
        test( "Error (deferred) arguments - with retry, failure", function() {
            expect(2);
            
            var callbackCalled = false;

            $.ajax({
                url: "failure",
                shouldRetry: 1
            }).error(function( jqXHR, textStatus, errorThrown ) {
                ok( jqXHR.getAllResponseHeaders && textStatus === "error" && errorThrown === "error", "Our error callback's parameters are correct" );
                ok( !callbackCalled, "Our error callback should only be called once" );
                callbackCalled = true;
            });
        });
    }
}());