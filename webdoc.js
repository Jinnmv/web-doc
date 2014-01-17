
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

app.get('/*', function(req, res, next){
  //console.log('>> req.url:', req.url);
  if (req.url.slice(-1) === '/') {

    // Url points to Directory
    fs.exists(docDir + req.url, function(exists){
      if (exists) {

        // Async check for path is Directory
        fs.stat(docDir + req.url, function(err, stat) {
          if (stat && stat.isDirectory()) {
            console.log('### Found Doc directory by URL', docDir + req.url);
            renderPageIndex(res, req.url, docDir);
          } else {
            console.log('### URL:', docDir + req.url, 'is not doc dir');
            res.redirect('/');
          }
        });

      } else {
        console.log('### Doc Directory', docDir + req.url, 'not found!');
        res.redirect('/');
      }
    });

  } else {

    // Url points to File
    fs.exists(docDir + req.url + '.md', function(exists){
      if (exists) {
        console.log('###Found Doc file: ', docDir + req.url + '.md');
        renderPageFile(res, req.url, docDir, docDir + req.url + '.md');
      } else {

        fs.exists(__dirname + '/public' + req.url, function(exists){
          if (exists) {
            next();
          } else {
            // not existing file requested -> redirect to root
            res.redirect('/');
          }
        });


      }
    });
  }


});

var renderPageIndex = function (res, reqUrl, docDir ) {
  var currentDir = path.join(docDir, reqUrl);
  var indexFileName = path.join(currentDir, 'index.md'); // TODO: move to config

  console.log('@@@renderPageIndex reqUrl:', reqUrl, 'docDir:', docDir, 'fileName:', indexFileName, 'currentDir:', currentDir, 'prevDir:', getParentDir(reqUrl));

  // Async check for index file exist in current dir
  fs.exists(indexFileName, function(exists) {
    if (exists) {
      fs.stat(indexFileName, function(err, stats) {
        if (stats && stats.isFile()) {
          console.log('### Index file', indexFileName, 'found in dir', currentDir);
          res.render('index', {title: 'Web Doc Dir',
                               dirs: dirContent.getDirs(currentDir),
                               files: dirContent.getFiles(currentDir),
                               currentDir: reqUrl,
                               prevDir: getParentDir(reqUrl),
                               doc: marked(fs.readFileSync(indexFileName, 'utf-8'))});
        } else {
          console.log('###',indexFileName, 'Is not a file');
          res.render('index', {title: 'Web Doc Dir',
                               dirs: dirContent.getDirs(currentDir),
                               files: dirContent.getFiles(currentDir),
                               currentDir: reqUrl,
                               prevDir: getParentDir(reqUrl)});
        }
      });
    } else {
      console.log('### No Idex file found in dir', currentDir);
      res.render('index', { title: 'Web Doc Dir',
                            dirs: dirContent.getDirs(currentDir),
                            files: dirContent.getFiles(currentDir),
                            currentDir: reqUrl,
                            prevDir: getParentDir(reqUrl)});
    }
  });
}

var renderPageFile = function (res, reqUrl, docDir, fileName) {
  console.log('@@@renderPageFile reqUrl:', reqUrl, 'docDir:', docDir, 'fileName:', fileName, 'req Replace:', getFileDir(reqUrl), 'path.dirname(reqUrl):', path.dirname(reqUrl));

  var currentDir = path.join(docDir, getFileDir(reqUrl));

  fs.stat(fileName, function(err, stats) {
    if (stats.isFile()) {
        res.render('index', {title: 'Web Doc Dir',
                   dirs: dirContent.getDirs(currentDir),
                   files: dirContent.getFiles(currentDir),
                   currentDir: getFileDir(reqUrl),
                   prevDir: getParentDir(getFileDir(reqUrl)),
                   doc: marked(fs.readFileSync(fileName, 'utf-8'))});
    }
  });
}

// path extension
var getParentDir = function(dirPath) {
  return dirPath.replace(/([^\/]*\/)$/,'') //cuts last dir xx/yy/zz/ -> xx/yy/
}

var getFileDir = function(filePath) {
  return filePath.replace(/([^\/]*)$/,''); // cuts file name xx/yy/zz -> xx/yy/
}


//app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io = socketio.listen(server);
io.set('log level', 2);

// ***   Socket.io   ***
io.sockets.on('connection', function (socket){
  var prevDir = '';
  var currentDir = '';
  var dirs = [];
  var files = [];
  var depth = 0;
  var indexFile = false;

  prevDir = currentDir;
  currentDir = docDir + '/';
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
    /*console.log('Curren Dir:', dirName);
    console.log('Prev Dir:', prevDir);
    console.log('dirs', dirs);
    console.log('files', files);*/

/*
    socket.emit('renderNav', { dirs: dirs,
                               files: files,
                               prevDir: prevDir,
                               hideFilesExt: true  } ); // TODO put hide Files Ext to config

    if (indexFile) {
      sendMdFile('index.md');
    } else {
      socket.emit('renderDoc', { doc: ''});
    }*/
  }

  function sendMdFile(fileName) {
    socket.emit('renderDoc', { doc: renderMdFile(fileName),
                              date: fs.statSync(currentDir + fileName).mtime });
  }

  function renderMdFile(fileName) {
    return marked(fs.readFileSync( currentDir + fileName, 'utf-8')); // TODO move encoding to config
  }
});
