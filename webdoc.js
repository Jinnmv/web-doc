/**
 * Module dependencies
 */

var express         = require('express');
var path            = require('path');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');   // Overrides PUT/DELETE
var morgan          = require('morgan');            // Logger
var favicon         = require('serve-favicon');     // Favicon
var errorHandler    = require('errorhandler');      // Error Handler
var compress        = require('compression');       // Compress
//var fs            = require('fs');
//var marked        = require('marked');

var routes          = require('./routes');
var apiRoutes       = require('./routes/api');
//var docRoute      = require('./routes/docRoute');
var http            = require('http');
//var nconf         = require('nconf');
var config          = require('./lib/config');
var logger          = require('./lib/logger');
//var dirContent    = require('./lib/dirContent');
//var mdServer      = require('./lib/mdServer');
//var url           = require('./lib/url');


var app = module.exports = express();

// all environments
app.set('port', config.webServer.port);
app.set('ipaddress', config.webServer.host);
app.set('env', config.mode);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('strict routing');

// production environment
if ('production' == app.get('env')) {
    var oneYear = 31557600000;

    app.set('view cache');
    //app.use(express.json());
    app.use(compress());
    app.use(bodyParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use(methodOverride());
    app.use(express.static(path.join(__dirname, 'public'), {maxAge: oneYear}));
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'), { maxAge: oneYear }));
    //app.use(app.router);  //deprecated in 4.x
    app.use(morgan('combined'));
    //app.use(express.errorHandler());  //deprecated in 4.x
}

//development environment
if ('development' == app.get('env')) {
    app.use(morgan('combined'));
    app.use(bodyParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use(methodOverride());
    //app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    //app.use(app.router);  // deprecated in 4.x
    app.use(errorHandler());
};

// Marked Configuration
/*marked.setOptions({
	highlight: function (code) {
		return require('highlight.js').highlightAuto(code).value;
	}
});*/

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

app.route(config.webServer.apiUrl + '*')

    .get(apiRoutes.getDocument)

    .post(apiRoutes.createDocument)

    .put(apiRoutes.updateDocument);

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
