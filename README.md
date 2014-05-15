# jQuery.ajaxRetry

[![Build Status](https://travis-ci.org/dcherman/jQuery.ajaxRetry.svg?branch=master)](https://travis-ci.org/dcherman/jQuery.ajaxRetry)

This plugin allows you to easily retry a failed ajax request while still allowing you to add callbacks via any of the normal options or deferreds.
jQuery.ajaxRetry is supported on all version of jQuery from 1.5 - latest.

## Usage

* **Boolean**
If you set this to `true`, your request will be retried until it successfully completes.  Be careful you don't DOS yourself here.
```
$.ajax({
      shouldRetry: true
});
```

* **Number**
You can provide a simple number and the request will be retried that many times.
```
$.ajax({
      // Retry this request up to 2 times
      shouldRetry: 2
});
```

* **Function**
Passing a function is the most flexible and powerful way to handle your retries.  A retry will occur if your function returns `true`, or if it
returns a `promise` that resolves to `true`.
```
$.ajax({
      shouldRetry: function( jqXHR, retryCount, requestMethod ) {
          // Retry only if the request method is POST and we have not retried this request yet.
          return requestMethod === "POST" && retryCount === 0;
      }
});
```

  ```
    $.ajax({
      shouldRetry: function() {
          // Always retry this request with a delay of 250ms between retries
          return $.Deferred(function(dfr) {
              setTimeout(function() {
                  dfr.resolve(true);
              }, 250);
          }).promise();
      }
    });
```

## License
Copyright (c) 2014 Daniel Herman, contributors Licensed under the MIT license.
[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/6893f686c161d2497e5d0080614ca6e6 "githalytics.com")](http://githalytics.com/dcherman/jQuery.ajaxRetry)
