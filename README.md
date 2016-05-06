# bearhug-angular [![Build Status](https://travis-ci.org/talis/bearhug-angular.svg)](https://travis-ci.org/talis/bearhug-angular)

Elegant bearer-token handling for AngularJS's `$http` service.

## Basic usage

Install with Bower into your bower components.

```bash
    bower install bearhug-angular
```

Include the library in your HTML file:

```html
    <script src="/my/bower/dir/bearhug-angular/dist/bearhug-angular.js"></script>
```

Then, configure it in one of your AngularJS `config` blocks:

```javascript
    angular.module('myApp', ['talis.bearhug']) // declare bearhug as a module dependancy
    angular.config(function($httpProvider, bearhugProvider) {
        // Add Bearhug as an HTTP interceptor
        $httpProvider.interceptors.push('bearhugInterceptor');

        /**
        * Configure the authentication promise that Bearhug will use on authentication failure (HTTP 401).
        *
        * Here's an example using `$http`
        *
        * The __$injector variable is the standard AngularJS $injector, provided so you can access services 
        * (since this is inside a config block).
        **/
        bearhugProvider.setAuthenticationFunction(function(__$injector) {
            var $http = __$injector('$http');

            // extract the access token from an HTTP response
            var extractAccessTokenFromResponse = function(response) {
                return response && response.access_token;
            }

            return (
                $http.get('http://example.com/log/me/in/please')
                    .then(extractAccessTokenFromResponse);
            );
        });
    });
```

Bearhug will now handle wrapping HTTP requests with bearer tokens.

## In detail


## Approach

Once you've authenticated your user, each request to a protected resource requires a `Bearer` token. This token needs to be established, attached to your requests, and periodically updated.

Bearhug uses `$http`'s interceptors to handle authentication, such that:

* All unprotected resources will operate as normal;
* When accessing a protected resource, authentication is required.  Attempts to access that resource will result in an HTTP 401 (Unauthorized) response, and Bearhug handles this by attempting to authenticated the user and obtain a bearer token (from a location of your choice);
* The bearer token is held in-memory, inside the `bearhugStorage` service, so that it can be reused across requests;
* Once a token is available, HTTP requests will be intercepted before transmission, and the bearer token will be added in the `Authorization` header;
* If a response contains a replacement token (in the `Authorization` header), it will replace the current bearer token;

## Customisation
 
### `bearhugInterceptor`

In order for Bearhug to operate, you must add the `bearhugInterceptor` to your `$http` interceptors:

```javascript
    $httpProvider.interceptors.push('bearhugInterceptor');
```

### `bearhugProvider.setAuthenticationFunction(($injector) => Promise[String])`

When a 401 is received, Bearhug needs to be able to reauthenticate.  To achieve this, you provide it with an *authentication function*, which must resolve to a `Promise` of an access token, so in its simplest form:

```javascript
    bearhugProvider.setAuthenticationFunction(function(__$injector) {
        var $q = __$injector('$q');
        return $q.when('mytoken');
    });
```

This mechanism is flexible in that you can perform any steps you need in the authentication pipeline, provided you return a promise at the end.  The promise allows for asynchrony, user interaction, and more.


#### Service injection 

Importantly, the authentication function must be provided at `config` time, at which point you have no access to other AngularJS services (as they are not yet configured).  Since you'll need these services to perform authentication, `bearhugProvider.setAuthenticationFunction` provides access to the `$injector`, which you can use to access your services.

```javascript
    bearhugProvider.setAuthenticationFunction(function(__$injector) {
        var $http = __$injector('$http');
        var myService = __$injector('myService');

        // ... Now use your services to authenticate!
    });
```


#### Retrying requests

Just to give an idea of how you can configure Bearhug at the application level, consider the use-case of an unreliable authentication server that you want to retry untli you get what you want, up to some retry count.

This can be achieved using promises, and customised by the application by specifying the `setAuthenticationFunction`.  Here's an example that retries 9 times.

```javascript

    angular.module('myApp').factory('MyService', function($http, $q) {

        function authetiCat(livesRemaining) {
            // defaults to nine lives, unless specified
            livesRemaining = angular.isNumber(livesRemaining) ? livesRemaining || 9;

            return (
                $http.get('http://example.com/authenticate_miaow')
                    .catch(function(rejection) {
                        if(livesRemaining > 0) {
                            return authentiCat(livesRemaining - 1);
                        } else {
                            return $q.reject(rejection);
                        }
                    })
            );
        }
    });

    angular.module('myApp').config(function(bearhugProvider) {

        bearhugProvider.setAuthenticationFunction(function(__$injector) {
            var MyService = __$injector('MyService');
            return MyService.authetiCat();
        });
    });
```




### Exclusions

You may not need or want to use bearer authorization on all requests, so Bearhug provides a mechanism for customising when its interceptor is applied.

The `interceptorFilter` is a generic mechanism for selectively applying an interceptor on different routes. To use it, you effectively wrap up an existing interceptor with a wrapper that determines when the underlying interceptor is applied. This requires two components: a filter specification, and a wrapper interceptor.


#### Filter specifications 

To configure an `interceptorFilter`, you first need to specify predicates against the different interception points in `$http` interceptors:

```javascript

var filterSpecification = {
    request:       function requestPredicate(requestConfig) { return requestConfig.url.indexOf('private') >= 0; },
    requestError:  function requestErrorPredicate(rejection) { ... },
    response:      function responsePredicate(responseObject) { ... },
    responseError: function responseErrorPredicate(rejection) { ... }
}

```

In this case, the `filterSpecification` will only apply the underlying interceptor to requests made against URLs that include the string `private`.

Predicates should return `true` or `false`, indicating whether or not to apply the interceptor. If you omit one of these named properties, the interceptor for that property will not be run:

```javascript

// only applies the interceptor to requests
var filterSpecification = {
    request:       function requestPredicate(requestConfig) { return requestConfig.url.indexOf('private') >= 0; }
}

```

#### Wrapping your interceptor

Once you have a filter specification, you can wrap your interceptor and apply it selectively. In our case, we'd like to wrap up our `bearhugInterceptor` and apply it selectively:

```javascript

function mySelectiveInterceptor(bearhugInterceptor, interceptorFilter) {

  /**
   * Selectively apply the Bearhug interceptor to certain routes
   * Filters out all HTML requests/responses
   **/
  var filterSpec = {
    request: function request(requestConfig) {
      return requestConfig && angular.isString(requestConfig.url) && !requestConfig.url.match(/\.html$/) && true;
    },
    response: function response(responseObj) {
      return responseObj && responseObj.config && angular.isString(responseObj.config.url) && !responseObj.config.url.match(/\.html$/) && true;
    },
    responseError: function responseError() {
      return true;
    }
  };

  return interceptorFilter.wrapInterceptor(bearhugInterceptor, filterSpec);
}

angular.module('myApp').factory('mySelectiveInterceptor', mySelectiveInterceptor);

```

You should now attach your customised interceptor, rather that attaching `bearhugInterceptor` directly:

```javascript
    angular.module('myApp').config(function($httpProvider) {
        $httpProvider.interceptors.push('mySelectiveInterceptor');
    })
```


#### The future?

The `interceptorFilter` will likely be moved into another module, since it is broadly useful outside Bearhug.



## History

Bearhug is the product of our experience using older `responseInterceptors` for token handling.

See [our blog post](http://engineering.talis.com/articles/elegant-api-auth-angular-js/) for a more detailed discussion of the approach.
