
/**
 * Module dependencies.
 */

var express = require('express');
var fs = require('fs');

var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var dirContent = require('./lib/dirContent');
var marked = require('marked');
var socketio = require("socket.io");
//var urlrewrite = require('express-rewrite');

var app = module.exports = express();

// all environments
app.set('port', process.env.PORT || 8888 );
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'doc')));

marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var indexFileContent = fs.readFileSync("./doc/index.md", "utf-8");

//app.get('/', routes.index);
app.get('/', function(req, res){
  console.log(dirContent.getDirs("doc"));
  console.log(dirContent.getFiles("doc"));
  res.render('index', { title: 'Web Doc',
                       dirs: dirContent.getDirs("doc"),
                       files: dirContent.getFiles("doc"),
                       indexMd: marked(indexFileContent),
                       mtime: fs.statSync("./doc/index.md").mtime});
});

app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io = socketio.listen(server);
io.set('log level', 2);

io.sockets.on('connection', function (socket){

    socket.on('disconnect', function(){

  });
});
