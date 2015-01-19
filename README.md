bearhug-angular
===============

Response interceptor for elegant bearer-token handling for angular's $http service.

Basic usage
-----

Include the library:

````html
<script src="/my/bower/dir/bearhug-angular/src/bearhug.js"></script>
````

In your main app.js:

````javascript
    angular.module('my-app', [
        'talis.bearhug']) // declare bearhug as a dependancy
        .constant('BEARHUG_USER_LOGIN_ENDPOINT','/get/me/a/new/token.json') // where can bearhug get a new bearer token?
        .constant('BEARHUG_FAILED_REFRESH_ROUTE','/'); // angular path to redirect to if unsuccessful
````

`$rootScope.user` will contain the data returned from `BEARHUG_USER_LOGIN_ENDPOINT`. This endpoint should also return an oauth token via the `oauth` property in its JSON response. This will be set to `$rootScope.oauth`.

That's it. All usage of $http will append

Exclusions
----

Any errors in refreshing tokens are sent to `$rootScope.error` for you to pick up and deal with in your app as you wish. If you want to exclude certain paths, response codes or HTTP methods from this behaviour register them with `bearhugExclusionsService`:

````javascript
    angular.module('my-app', [
        'talis.bearhug']) // declare bearhug as a dependancy
    .config(['bearhugExclusionsService', function(bearhugExclusionsService) {
        bearhugExclusionsService.addErrorHandlerExclusion({path:'/my/route/which/doesnt/error'});
        bearhugExclusionsService.addErrorHandlerExclusion({path:'/modules', code:400, methods:['POST', 'PUT']});
        bearhugExclusionsService.addErrorHandlerExclusion({code:404});
    );
````

See the blog post http://engineering.talis.com/articles/elegant-api-auth-angular-js/


TODO
-----

* Make `user` an injectable rather than rely on your app having it on $rootScope. Have this implement an 'interface' rather than rely on direct access to properties
* Work out why it is necessary to set `$rootScope.oauth` as well as `$rootScope.user.oauth` (Note to non-talis github users - this library was extracted from one of our apps where this was a dependency)