/**
 * Module dependencies.
 */

var express = require('express');
var fs = require('fs');

var routes = require('./routes');
var docRoute = require('./routes/docRoute');
var http = require('http');
var path = require('path');
var dirContent = require('./lib/dirContent');
var nconf = require('nconf');
var marked = require('marked');
var socketio = require("socket.io");

/********
 * nconf
 ********/

/* configuration */
nconf.env()
     .file(path.join(__dirname, 'config.json'));

/* defaults */
nconf.defaults({
  mode: process.env.NODE_ENV || 'production',
  webServer: {
    host: process.env.IP || 'localhost',
    port: process.env.PORT || 8080,
    docsRootUrl: path.join(__dirname, '/doc/')
  },
  docs: {
    path: './doc',
    encoding: 'utf-8',
    newDirMask: 0755,
    extention: '.md',
    indexName: 'index'
  },
  title: 'WebDoc Portal',
  hideNavigation: false,
  readOnly: true
});

var app = module.exports = express();


// all environments
app.set('port', nconf.get('webServer:port'));
app.set('ipaddress', nconf.get('webServer:host'));
app.set('env', nconf.get('mode'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('strict routing');

app.configure('development', function() {
  app.use(express.logger('dev'));
});

app.configure(function() {
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(app.router);
});

// production environment
app.configure('production', function() {
  var oneYear = 31557600000;
  app.set('view cache');
  app.use(express.favicon(path.join(__dirname, 'favicon.ico'), { maxAge: oneYear }));
  app.use(express.static(path.join(__dirname, 'public'), {maxAge: oneYear}));
  app.use(express.logger());
  app.use(express.errorHandler());
});

app.configure('development', function() {
  app.use(express.favicon(path.join(__dirname, 'favicon.ico')));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Initialize marked
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

app.get(nconf.get('webServer:docsRootUrl') + '*', function (req, res) {
  docUrlRouter(req, res);

  //console.log('DEBUG: req.params', req.params);
});

var docUrlRouter = function(req, res, message) {
  var urlParam = '/' + req.params[0];

  if (urlParam.slice(-1) == '/') {
    // Is req url is an existing dir?
    pathIsExistingDir(path.join(nconf.get('docs:path'), urlParam), function () {
      var currentDirPath = path.join(nconf.get('docs:path'), urlParam);  // ./docs/path/
      var currentDirUrl = req.url;                            // domain/doc/path/
      var currentDirIndexDocPath = currentDirPath + nconf.get('docs:indexName') + nconf.get('docs:extention'); // ./docs/path/index.md

      console.log('DEBUG: Dir exist', currentDirPath);

      // Is there index file in current dir?
      pathIsExistingFile(currentDirIndexDocPath, function (stat) {
        console.log('  DEBUG: Index file found in current dir', currentDirIndexDocPath);

        // Read Index File and render doc page
        fs.readFile(currentDirIndexDocPath, nconf.get('docs:encoding'), function (err, data) {
          if (err) {

            console.log('    DEBUG: Unable to read index file', currentDirIndexDocPath, err.stack);
            renderDocPage(res, currentDirUrl, currentDirPath, false, false, false, 'Unable to read document file ' + currentDirIndexDocPath + ': ' + err.code);
          } else {

            console.log('    DEBUG: Rendering index file', currentDirIndexDocPath);
            renderDocPage(res, currentDirUrl, currentDirPath, currentDirIndexDocPath, data, stat.mtime, message);
          }
        });

      }, function () {
        console.log('  DUBUG: No index file found in dir', currentDirPath);
        console.log('    DEBUG: Rendering dir', currentDirPath);
        renderDocPage(res, currentDirUrl, currentDirPath, false, false, false, message);
      });

    }, function () {
      console.error('  DEBUG: Requested document dir not found', path.join(nconf.get('docs:path'), urlParam));
      if (path.join(nconf.get('docs:path'), urlParam) == nconf.get('docs:path') + path.sep) { // Docuemnts dir root not found
        console.log('    DEBUG: Redirect to server root'); // TODO: redirect to previous dir
        res.redirect('404.html');
      } else {
        console.log('    DEBUG: Redirect to documents root'); // TODO: redirect to previous dir
        res.redirect(nconf.get('webServer:docsRootUrl'));
      }
    });

  } else {
    // Is req url an existing file?
    var currentDocPath = path.join(nconf.get('docs:path'), urlParam + nconf.get('docs:extention'));
    pathIsExistingFile(currentDocPath, function (stat) {
      var currentDirPath = path.dirname(currentDocPath) + path.sep;
      var currentDirUrl = parentUrl(req.url);

      console.log('DEBUG: Document file exist:', currentDocPath);
      fs.readFile(currentDocPath, nconf.get('docs:encoding'), function (err, data) {
        if (err) {

          console.error('  DEBUG: Unable read requested document file', currentDocPath, err.stack);
          renderDocPage(res, currentDirUrl, currentDirPath, false, false, false, 'Unable to read document ' + currentDocPath + ': ' + err.code);
        } else {

          console.log('  DEBUG: Rendering requested doc file:', currentDocPath);
          renderDocPage(res, currentDirUrl, currentDirPath, currentDocPath, data, stat.mtime, message);
        }
      });

    // fallback
    }, function () {
      console.error('  DEBUG: Requested document file not found', path.join(nconf.get('docs:path'), urlParam + nconf.get('docs:extention')));
      console.log('    DEBUG: Redirect to documents root');
      res.redirect(nconf.get('webServer:docsRootUrl'));
    });
  }
};

var renderDocPage = function(res, currentDirUrl, currentDirPath, currentFilePath, documentMd, modifiedTime, message) {
  res.render('docpage', { docsTitle: nconf.get('title'),
                          logoImgPath: nconf.get('logo'),
                          hideNavigation: nconf.get('hideNavigation'),
                          message: message,
                          docsDir: nconf.get('webServer:docsRootUrl'),
                          prevDirUrl: currentDirUrl == nconf.get('webServer:docsRootUrl') ? false : parentUrl(currentDirUrl),
                          currentDirUrl: currentDirUrl,
                          currentDirPath: currentDirPath,
                          dirNames: dirContent.getDirs(currentDirPath),
                          fileNames: dirContent.getFiles(currentDirPath),
                          doc: documentMd ? marked(documentMd) : false,
                          docMd: documentMd,
                          docName: currentFilePath ? docNameFromUrl(currentFilePath) : false,
                          modifiedTime: modifiedTime
                          });
};

// Check providen path is existing Dir
var pathIsExistingDir = function (dirPath, callback, fallback) {
  fs.stat(dirPath, function (err, stat) {
    if (err) {
      fallback();
    } else {
      if (stat.isDirectory()) {
        callback(stat);
      } else {
        fallback();
      }
    }
  });
};

// Check providen path is existing File
var pathIsExistingFile = function (filePath, callback, fallback) {
  fs.stat(filePath, function (err, stat) {
    if (err) {
      fallback();
    } else {
      if (stat.isFile()) {
        callback(stat);
      } else {
        fallback();
      }
    }
  });
};

var parentUrl = function (url) {
  return url.replace(/([^\/]*\/?)$/, '');
};

var docNameFromUrl = function (url) {
  return url.replace(/.*\/([^\/.]*)\.md$/, '$1');
};

app.get('/', function (req, res) {
  res.redirect(nconf.get('webServer:docsRootUrl'));
});

app.get('/form', function (req, res) {
  res.render('form');
});

app.post(nconf.get('webServer:docsRootUrl') + '*', function (req, res) {
  console.log('%%%% POST:', req.body);
  console.log('%%%% action:', req.body.action);

  switch(req.body.action) {
    case 'newDir':
      var currentDirPath = req.body.currentDirPath;
      var newDirName = req.body.dirName;
      var newDirPath = path.join(currentDirPath, newDirName);

      console.log('DEBUG: Create new dir:', currentDirPath, newDirName);
      fs.mkdir(newDirPath, nconf.get('docs:newDirMask'), function (err) {
        if (err) {

          console.log('  DEBUG: Unable to create new dir', newDirPath, ':', err.stack);
          docUrlRouter(req, res, 'Unable to create a directory ' + newDirPath + '. Error code: ' + err.code);
        } else {

          console.log('  DEBUG: New dir has been created successfully', newDirPath);
          docUrlRouter(req,res);
        }
      });
      break;

    case 'newFile':
      newFilePath = path.join(req.body.currentDirPath, req.body.fileName + nconf.get('docs:extention'));
      newFileText = req.body.fileText;

      console.log('DEBUG: Create new file:', req.body.currentDirPath, req.body.fileName);
      mdFileWrite(req, res, newFilePath, newFileText);
      break;

    case 'updateFile':
      newFilePath = path.join(req.body.currentDirPath, req.body.fileName + nconf.get('docs:extention'));
      origFilePath = path.join(req.body.currentDirPath, req.body.fileNameOrig + nconf.get('docs:extention'));
      newFileText = req.body.fileText;

      if (newFilePath != origFilePath) { // Rename

        fs.rename(origFilePath, newFilePath , function(err){
          if (err) {

            console.error('  DEBUG: Unable to rename file', origFilePath, '>', newFilePath, ':', err.stack);
            console.log('  DEBUG: res.location', res.location);
            mdFileWrite(req, res, origFilePath, newFileText, 'Unable to rename file ' + origFilePath + '>' + newFilePath + '. Error code: ' + err.code);
          } else {

            console.log('  DEBUG: File has been renamed successfully', origFilePath, '>', newFilePath);
            console.log('    DEBUG: Redirecting to new url', parentUrl(req.url) + req.body.fileName);
            res.redirect(parentUrl(req.url) + req.body.fileName);
            //mdFileWrite(req, res, newFilePath, newFileText);
          }
        });
      } else {
        mdFileWrite(req, res, newFilePath, newFileText);
      }
      break;

    default:
      console.error('DEBUG: Unknown POST message:', req.body.action);
      docUrlRouter(req, res);
  }

  //res.render('docpage');
});

var mdFileWrite = function (req, res, filePath, fileText, message) {
    fs.writeFile(filePath, fileText, { encoding: nconf.get('docs:encoding') }, function (err) {
    if (err) {

      console.log('  DEBUG: Unable to write to file', filePath, ':', err.stack);
      docUrlRouter(req, res, 'Unable to write to file ' + filePath + '. Error code: ' + err.code);
    } else {

      console.log('  DEBUG: Successfully wrote to file', filePath);
      docUrlRouter(req, res, message);
    }
  });
};

/*
app.get('/*', function (req, res, next) {
  //console.log('>> req.url:', req.url);
  if (req.url.slice(-1) === '/') {

    // Url ends with '/' -> points to Directory
    fs.exists(path.join(docDir, req.url), function (exists) {
      if (exists) {

        // Async check for path is Directory
        fs.stat(path.join(docDir, req.url), function (err, stat) {
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
    fs.exists(path.join(docDir, req.url) + '.md', function (exists) {
      if (exists) {
        console.log('###Found Doc file: ', docDir + req.url + '.md');
        renderPageFile(res, req.url, docDir, path.join(docDir, req.url) + '.md');
      } else {

        fs.exists(__dirname + '/public' + req.url, function (exists) {
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
*/
var renderPageIndex = function (res, reqUrl, docDir) {
  var currentDir = path.join(docDir, reqUrl);
  var indexFileName = path.join(currentDir, 'index.md'); // TODO: move to config

  console.log('@@@renderPageIndex reqUrl:', reqUrl, 'docDir:', docDir, 'fileName:', indexFileName, 'currentDir:', currentDir, 'prevDir:', getDirParent(reqUrl));

  // Async check for index file exist in current dir
  fs.exists(indexFileName, function (exists) {
    if (exists) {
      fs.stat(indexFileName, function (err, stats) {
        if (stats && stats.isFile()) {
          console.log('### Index file', indexFileName, 'found in dir', currentDir);
          res.render('index', {
            title: 'Web Doc Dir',
            dirs: dirContent.getDirs(currentDir),
            files: dirContent.getFiles(currentDir),
            currentDir: reqUrl,
            prevDir: getDirParent(reqUrl),
            doc: marked(fs.readFileSync(indexFileName, 'utf-8')),
            docFileName: indexFileName,
            accessTime: stats.mtime
          });
        } else {
          console.log('###', indexFileName, 'Is not a file');
          res.render('index', {
            title: 'Web Doc Dir',
            dirs: dirContent.getDirs(currentDir),
            files: dirContent.getFiles(currentDir),
            currentDir: reqUrl,
            prevDir: getDirParent(reqUrl)
          });
        }
      });
    } else {
      console.log('### No Idex file found in dir', currentDir);
      res.render('index', {
        title: 'Web Doc Dir',
        dirs: dirContent.getDirs(currentDir),
        files: dirContent.getFiles(currentDir),
        currentDir: reqUrl,
        prevDir: getDirParent(reqUrl)
      });
    }
  });
};

var renderPageFile = function (res, reqUrl, docDir, fileName) {
  console.log('@@@renderPageFile reqUrl:', reqUrl, 'docDir:', docDir, 'fileName:', fileName, 'req Replace:', getFileDir(reqUrl), 'path.dirname(reqUrl):', path.dirname(reqUrl));

  var currentDir = path.join(docDir, getFileDir(reqUrl));

  fs.stat(fileName, function (err, stats) {
    if (stats.isFile()) {
      console.log('### Index file', fileName, 'found in dir', currentDir);
      res.render('index', {
        title: 'Web Doc Dir',
        dirs: dirContent.getDirs(currentDir),
        files: dirContent.getFiles(currentDir),
        currentDir: getFileDir(reqUrl),
        prevDir: getDirParent(getFileDir(reqUrl)),
        doc: marked(fs.readFileSync(fileName, 'utf-8')),
        docFileName: fileName,
        accessTime: stats.mtime
      });
    } else {
      console.log('### Requested path is not a file', reqUrl);
    }
  });
};

// path extension
var getDirParent = function (dirPath) {
  return dirPath.replace(/([^\/]*\/)$/, ''); //cuts last dir xx/yy/zz/ -> xx/yy/
};

var getFileDir = function (filePath) {
  return filePath.replace(/([^\/]*)$/, ''); // cuts file name xx/yy/zz -> xx/yy/
};


//app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), app.get('ipaddress'), function () {
  console.log('Express server listening on ' + app.get('ipaddress') + ':' + app.get('port') + ' in ' + app.get('env') + ' mode');
});

io = socketio.listen(server);
io.set('log level', 2);

// ***   Socket.io   ***
io.sockets.on('connection', function (socket) {
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

  socket.on('readDoc', function (data) {
    // Check for file exist in current dir
    if (files.indexOf(data.fileName) > -1) {
      sendMdFile(data.fileName);
    }
  });

  socket.on('navigateToDir', function (data) {
    // Check for file exist in current dir
    if (dirs.indexOf(data.dirName) > -1) {

      prevDir = currentDir;
      currentDir = currentDir + data.dirName + '/';
      changeDir(currentDir, prevDir);
    }
  });

  socket.on('navigateBack', function (data) {
    prevDir = data.dirName.replace(/([^\/]*\/)$/, '');
    currentDir = data.dirName;
    changeDir(currentDir, prevDir);
  });

  socket.on('createDir', function (data) {
    console.log('>>> Socket: create new directory', data);
    fs.mkdir(docDir + getFileDir(data.url) + data.dirName, 0755, function (err) { // TODO new folder rights should be put to config file
      if (err) {
        console.error('>>> Unable to create a section: ', err.stack);
        socket.emit('showMessage', 'Unable to create a section. Error code:' + err.code);
      } else {
        console.log('>>> Folder created successfully', data.dirName);
        updateDirsLsit(docDir + getFileDir(data.url));
      }
    });
  });

  socket.on('createFile', function (data) {
    console.log('>>> Socket: create new file', data);
    fs.writeFile(docDir + getFileDir(data.url) + data.fileName + '.md', data.fileContent, {
      encoding: 'utf8'
    }, function (err) { //TODO encoding and file ext put to config
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

  socket.on('getMdFile', function (data) {
    console.log('>>> Socket: get MD file content', data);
    fs.readFile(data.fileName, {
      encoding: 'utf8'
    }, function (err, fileContent) {
      if (err) {
        console.log('>>> Unable to read a file', err);
        socket.emit('showMessage', 'Unable to read a document. Error code:' + err.code);
      } else {
        console.log('>>> File has been read successfully', data.fileName, fileContent);
        socket.emit('mdFile', {
          fileContent: fileContent
        });
      }
    });
  });

  socket.on('updateFile', function (data) { // merge with createFile
    console.log('>>> Socket: update file', data);
    var newFileName = docDir + getFileDir(data.url) + data.fileName + '.md';

    // Check file need to be renamed
    if (newFileName != data.docFileName) {
      console.log('>>> New file name provided. Renaming', data.docFileName, ' > ', newFileName);
      fs.rename(data.docFileName, newFileName, function (err) {
        if (err) {
          console.log('>>> Unable to rename a file'.err);
          socket.emit('showMessage', '>>> Unable to rename a file. Error code:', err.code);
          writeFile(data);
        } else {
          writeFile(data); // TODO: Defect - user is on old url + update doc name in html
        }
      });
    } else {
      writeFile(data);
    }


  });

  function writeFile(data) {
    var newFileName = docDir + getFileDir(data.url) + data.fileName + '.md';
    fs.writeFile(newFileName, data.fileContent, {
      encoding: 'utf8'
    }, function (err) {
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

  socket.on('disconnect', function (data) {
    console.log('Good Buy,', data);
  });

  function updateDirsLsit(currentDir) {
    socket.emit('renderNavDirs', {
      dirs: dirContent.getDirs(currentDir)
    });
  }

  function updateFilesList(currentDir) {
    socket.emit('renderNavFiles', {
      files: dirContent.getFiles(currentDir)
    });
  }

  function updateDoc(filePath) {
    console.log('>>> Updating document');
    fs.readFile(filePath, {
      encoding: 'utf8'
    }, function (err, fileContent) {
      if (err) {
        console.log('>>> Unable to read a file', err);
        socket.emit('showMessage', 'Unable to read a document. Error code:' + err.code);
      } else {
        console.log('>>> File has been read successfully', filePath, fileContent);

        fs.stat(filePath, function (err, stats) {
          if (err) {
            console.log('>>> Unable to read file mtime', filePath);
          } else {
            socket.emit('docFile', {
              docContent: marked(fileContent),
              lastModified: stats.mtime,
              filePath: filePath
            });
            console.log('>>> mtime:', stats.mtime);
          }
        });

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
    socket.emit('renderDoc', {
      doc: renderMdFile(fileName),
      date: fs.statSync(currentDir + fileName).mtime
    });
  }

  function renderMdFile(fileName) {
    return marked(fs.readFileSync(currentDir + fileName, 'utf-8')); // TODO move encoding to config
  }
});
