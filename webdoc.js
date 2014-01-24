
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
  console.log('>> req.url:', req.url);
  if (req.url.slice(-1) === '/') {

    // Url points to Directory
    fs.exists(path.join(docDir, req.url), function(exists){
      if (exists) {

        // Async check for path is Directory
        fs.stat(path.join(docDir, req.url), function(err, stat) {
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
    fs.exists(path.join(docDir, req.url) + '.md', function(exists){
      if (exists) {
        console.log('###Found Doc file: ', docDir + req.url + '.md');
        renderPageFile(res, req.url, docDir, path.join(docDir, req.url) + '.md');
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

  console.log('@@@renderPageIndex reqUrl:', reqUrl, 'docDir:', docDir, 'fileName:', indexFileName, 'currentDir:', currentDir, 'prevDir:', getDirParent(reqUrl));

  // Async check for index file exist in current dir
  fs.exists(indexFileName, function(exists) {
    if (exists) {
      fs.stat(indexFileName, function(err, stats) {
        if (stats && stats.isFile()) {
          console.log('### Index file', indexFileName, 'found in dir', currentDir);
          res.render('index', { title: 'Web Doc Dir',
                                dirs: dirContent.getDirs(currentDir),
                                files: dirContent.getFiles(currentDir),
                                currentDir: reqUrl,
                                prevDir: getDirParent(reqUrl),
                                doc: marked(fs.readFileSync(indexFileName, 'utf-8')),
                                docFileName: indexFileName,
                                accessTime: stats.mtime});
        } else {
          console.log('###',indexFileName, 'Is not a file');
          res.render('index', { title: 'Web Doc Dir',
                                dirs: dirContent.getDirs(currentDir),
                                files: dirContent.getFiles(currentDir),
                                currentDir: reqUrl,
                                prevDir: getDirParent(reqUrl)});
        }
      });
    } else {
      console.log('### No Idex file found in dir', currentDir);
      res.render('index', { title: 'Web Doc Dir',
                            dirs: dirContent.getDirs(currentDir),
                            files: dirContent.getFiles(currentDir),
                            currentDir: reqUrl,
                            prevDir: getDirParent(reqUrl)});
    }
  });
}

var renderPageFile = function (res, reqUrl, docDir, fileName) {
  console.log('@@@renderPageFile reqUrl:', reqUrl, 'docDir:', docDir, 'fileName:', fileName, 'req Replace:', getFileDir(reqUrl), 'path.dirname(reqUrl):', path.dirname(reqUrl));

  var currentDir = path.join(docDir, getFileDir(reqUrl));

  fs.stat(fileName, function(err, stats) {
    if (stats.isFile()) {
      console.log('### Index file', fileName, 'found in dir', currentDir);
      res.render('index', { title: 'Web Doc Dir',
                            dirs: dirContent.getDirs(currentDir),
                            files: dirContent.getFiles(currentDir),
                            currentDir: getFileDir(reqUrl),
                            prevDir: getDirParent(getFileDir(reqUrl)),
                            doc: marked(fs.readFileSync(fileName, 'utf-8')),
                            docFileName: fileName,
                            accessTime: stats.mtime });
    } else {
      console.log('### Requested path is not a file', reqUrl);
    }
  });
}

// path extension
var getDirParent = function(dirPath) {
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

  socket.on('createDir', function(data){
    console.log('>>> Socket: create new directory', data);
    fs.mkdir(docDir + getFileDir(data.url) + data.dirName, 0755, function(err){ // TODO new folder rights should be put to config file
      if (err){
        console.log('>>> Unable to create a section: ', err);
        socket.emit('showMessage', 'Unable to create a section. Error code:' + err.code);
      } else {
        console.log('>>> Folder created successfully', data.dirName );
        updateDirsLsit(docDir + getFileDir(data.url));
      }
    });
  });

  socket.on('createFile', function(data) {
    console.log('>>> Socket: create new file', data);
    fs.writeFile(docDir + getFileDir(data.url) + data.fileName + '.md', data.fileContent, {encoding: 'utf8'}, function(err){ //TODO encoding and file ext put to config
      if (err) {
        console.log('>>> Unable to write a file', err);
        socket.emit('showMessage', 'Unable to write a document. Error code:' + err.code);
      } else {
        console.log('>> File has been wrote successfully', data.fileName + '.md');
        updateFilesList(docDir + getFileDir(data.url));
        //updateDoc();
      }
    });
  });

  socket.on('getMdFile', function(data) {
    console.log('>>> Socket: get MD file content', data);
    fs.readFile(data.fileName, {encoding: 'utf8'}, function(err, fileContent){
      if (err) {
        console.log('>>> Unable to read a file', err);
        socket.emit('showMessage', 'Unable to read a document. Error code:' + err.code);
      } else {
        console.log('>>> File has been read successfully', data.fileName, fileContent);
        socket.emit('mdFile', { fileContent: fileContent});
      }
    });
  });

  socket.on('updateFile', function(data) {  // merge with createFile
    console.log('>>> Socket: update file', data);
    var newFileName = docDir + getFileDir(data.url) + data.fileName + '.md';

    // Check file need to be renamed
    if (newFileName != data.docFileName) {
      console.log('>>> New file name provided. Renaming', data.docFileName, ' > ', newFileName);
      fs.rename(data.docFileName, newFileName, function(err){
        if (err) {
          console.log('>>> Unable to rename a file'. err);
          socket.emit('showMessage', '>>> Unable to rename a file. Error code:', err.code);
          writeFile(data);
        } else {
          writeFile(data);  // TODO: Defect - user is on old url
        }
      });
    } else {
      writeFile(data);
    }


  });

  function writeFile(data){
    var newFileName = docDir + getFileDir(data.url) + data.fileName + '.md';
    fs.writeFile(newFileName, data.fileContent, {encoding: 'utf8'}, function(err){
      if (err) {
        console.log('>>> Unable to update a file', err);
        socket.emit('showMessage', 'Unable to update a document. Error code:' + err.code);
      } else {
        console.log('>>> File has been updated successfully', data.fileName + '.md');
        updateFilesList(docDir + getFileDir(data.url));
        updateDoc(newFileName);
      }
    });
  }

  socket.on('disconnect', function(data){
    console.log('Good Buy,', data);
  });

  function updateDirsLsit(currentDir) {
    socket.emit('renderNavDirs', {dirs: dirContent.getDirs(currentDir)});
  }

  function updateFilesList(currentDir) {
    socket.emit('renderNavFiles', {files: dirContent.getFiles(currentDir)});
  }

  function updateDoc(filePath) {
    console.log('>>> Updating document');
    fs.readFile(filePath, {encoding: 'utf8'}, function(err, fileContent){
      if (err) {
        console.log('>>> Unable to read a file', err);
        socket.emit('showMessage', 'Unable to read a document. Error code:' + err.code);
      } else {
        console.log('>>> File has been read successfully', filePath, fileContent);
        socket.emit('docFile', {docContent: marked(fileContent)});
      }
    });
  }

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
