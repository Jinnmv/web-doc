/**
 * Module dependencies
 */

var express = require('express');
var fs = require('fs');
var path = require('path');

var routes = require('./routes');
var apiRoutes = require('./routes/api');
//var docRoute = require('./routes/docRoute');
var http = require('http');
//var nconf = require('nconf');
var config = require('./lib/config');
var logger = require('./lib/logger');
var dirContent = require('./lib/dirContent');
var mdServer =require('./lib/mdServer');
var marked = require('marked');
var url = require('./lib/url');


var app = module.exports = express();

// all environments
app.set('port', config.webServer.port);
app.set('ipaddress', config.webServer.host);
app.set('env', config.mode);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('strict routing');

// production environment
app.configure('production', function() {
  var oneYear = 31557600000;
  app.set('view cache');
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.compress());
  app.use(express.methodOverride());
  app.use(express.favicon(path.join(__dirname, 'favicon.ico'), { maxAge: oneYear }));
  app.use(express.static(path.join(__dirname, 'public'), {maxAge: oneYear}));
  app.use(app.router);
  app.use(express.logger());
  app.use(express.errorHandler());
});

//development environment
app.configure('development', function() {
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(express.favicon(path.join(__dirname, 'favicon.ico')));
	//app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Marked Configuration
marked.setOptions({
	highlight: function (code) {
		return require('highlight.js').highlightAuto(code).value;
	}
});

var docDir = "doc"; // TODO put into config

//app.get('/', routes.index);
/*app.get('/', function(req, res, next){
  res.render('index', { title: 'Web Doc',
                       dirs: dirContent.getDirs("doc"),
                       files: dirContent.getFiles("doc"),
                       mtime: fs.statSync("./doc/index.md").mtime});
});*/

// TODO move app.get to rotes
// TODO use of path:
//    path.dirname('/foo/bar/baz/asdf/quux')
//    returns
//      '/foo/bar/baz/asdf'

//    path.basename('/foo/bar/baz/asdf/quux.html')
//    returns
//      'quux.html'
//    path.basename('/foo/bar/baz/asdf/quux.html', '.html')
//    returns
//      'quux'

//    An example on *nix:
//    'foo/bar/baz'.split(path.sep)
//    returns
//      ['foo', 'bar', 'baz']
//    An example on Windows:
//    'foo\\bar\\baz'.split(path.sep)
//    returns
//      ['foo', 'bar', 'baz']

/**
 * Connection log
 */
app.use(function (req, res, next) {
	logger.debug('req.url: ', req.url);
	logger.debug('host: ', req.get('host'));
	logger.debug('connection.remoteAddress: ', req.connection.remoteAddress);

	next();
});

/**
 * API
 **/
app.get(config.webServer.apiUrl + '*', apiRoutes.getDocument);

app.post(config.webServer.apiUrl + '*', apiRoutes.createDocument);

app.put(config.webServer.apiUrl + '*', apiRoutes.updateDocument);

/**
 * Document Server routes
 */

app.get(config.webServer.docsRootUrl + '*', routes.document);


// just for test
app.get('/500', function(req, res) {
    throw new Error('keyboard cat!');
});

// 404 - Not Found
app.use(function(req, res) {
  logger.warn('Page not found [%s]', req.url);
  res.status(404);
  res.render('error', {
    docsTitle: config.title,
    errorTitle: '404: Page Not Found',
    errorMessage: 'Sorry, but the page you were trying to view does not exist'});
});

// 500 - Internal Server Error
app.use(function(error, req, res, next) {
  logger.error(error.stack);

  res.status(500);

  if ('development' == config.mode) {
    var errorStack = error.stack;
    errorStack = errorStack.replace(/</g,'&lt;'); // TODO: avoid this crap
    errorStack = errorStack.replace(/>/g,'&gt;');
    errorStack = errorStack.replace(/\n/g,'<br>');
    errorStack = errorStack.replace(/\s\s\s\s/g,'&nbsp;&nbsp;&nbsp;&nbsp;');

    res.render('error', {
      docsTitle: config.title,
      errorTitle: '500: Internal Server Error',
      errorMessage: error.message,
      errorStack: errorStack});

  } else {
    res.render('error', {
        docsTitle: config.title,
        errorTitle: '500: Internal Server Error',
        errorMessage: 'Please contact your system administrator'});
  }
});


var server = http.createServer(app).listen(app.get('port'), app.get('ipaddress'), function () {
  logger.info('Express server listening on ' + app.get('ipaddress') + ':' + app.get('port') + ' in ' + app.get('env') + ' mode');
});
