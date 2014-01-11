
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


var startDir = "doc";

//app.get('/', routes.index);
app.get('/', function(req, res){
  console.log(dirContent.getDirs("doc"));
  console.log(dirContent.getFiles("doc"));
  console.log("Reguest:", req);
  res.render('index', { title: 'Web Doc',
                       dirs: dirContent.getDirs("doc"),
                       files: dirContent.getFiles("doc"),
                       mtime: fs.statSync("./doc/index.md").mtime});
});

//app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io = socketio.listen(server);
io.set('log level', 2);

io.sockets.on('connection', function (socket){
  var prevDir = '';
  var currentDir = '';
  var dirs = [];
  var files = [];
  var depth = 0;
  var indexFile = false;

  prevDir = currentDir;
  currentDir = startDir + '/';
  changeDir(currentDir, prevDir);


  /*socket.emit('renderNavDirs', { dirs: dirs } );
  socket.emit('renderNavFiles', { files: files, hideFilesExt: true }); // TODO put hide Files Ext to config

  if (indexFile) {
    sendMdFile('index.md');
  }*/

  socket.on('readDoc', function (data){
    // Check for file exist in current dir
    if(files.indexOf(data.fileName) > -1){
      sendMdFile(data.fileName);
    }
  });

  socket.on('navigateToDir', function(data){
    // Check for file exist in current dir
    if(dirs.indexOf(data.dirName) > -1){

      prevDir = currentDir;
      currentDir = currentDir + data.dirName + '/';
      changeDir(currentDir, prevDir);
    }
  });

  socket.on('navigateBack', function(data){
    prevDir = data.dirName.replace(/([^\/]*\/)$/,'');
    currentDir = data.dirName;
    changeDir(currentDir, prevDir);
  });

  socket.on('disconnect', function(){

  });

  function changeDir(dirName, prevDir) {

    dirs = dirContent.getDirs(dirName);
    files = dirContent.getFiles(dirName);
    indexFile = (files.indexOf("index.md") != -1); // if 'index.md' is in current dir;
    console.log('Curren Dir:', dirName);
    console.log('Prev Dir:', prevDir);
    console.log('dirs', dirs);
    console.log('files', files);


    socket.emit('renderNav', { dirs: dirs,
                               files: files,
                               prevDir: prevDir,
                               hideFilesExt: true  } ); // TODO put hide Files Ext to config

    if (indexFile) {
      sendMdFile('index.md');
    } else {
      socket.emit('renderDoc', { doc: ''});
    }
  }

  function sendMdFile(fileName) {
    socket.emit('renderDoc', { doc: renderMdFile(fileName),
                              date: fs.statSync(currentDir + fileName).mtime });
  }

  function renderMdFile(fileName) {
    return marked(fs.readFileSync( currentDir + fileName, 'utf-8')); // TODO move encoding to config
  }
});
