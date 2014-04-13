/**
 * Module dependencies
 */

var express = require('express');
var fs = require('fs');
var path = require('path');

var routes = require('./routes');
//var docRoute = require('./routes/docRoute');
var http = require('http');
//var nconf = require('nconf');
var config = require('./lib/config');
var logger = require('./lib/logger');
var dirContent = require('./lib/dirContent');
var mdServer =require('./lib/mdServer');
var marked = require('marked');
var socketio = require("socket.io");
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

app.get(config.webServer.docsRootUrl + '*', routes.document);

var docUrlRouter = function(req, res, message) {

  var urlParam = '/' + req.params[0];

  if ('/' === urlParam.slice(-1)) {
    var reqDirPath = path.join(config.docs.path, urlParam);  // ./docs/path/

	//mdServer.renderDir(req, reqDirPath);

    // Is req url is an existing dir?
    pathIsExistingDir(reqDirPath, function () {

      //var req.url = req.url;                            // domain/doc/path/
      var reqIdxFilePath = req.dirPath + config.docs.indexName + config.docs.extension; // ./docs/path/index.md

      //console.log('DEBUG: Dir exist', req.dirPath);

      // Is there index file in current dir?
      pathIsExistingFile(reqIdxFilePath, function (stat) {
        //console.log('  DEBUG: Index file found in current dir', req.indexDocPath);

        // Read Index File and render doc page
        //renderDocFile(res, req.indexDocPath, req.url, req.dirPath, stat.mtime, message);
        mdServer.renderDocPage(res, req.url, reqDirPath, reqIdxFilePath, stat.mtime, message);

      }, function () {
        //console.log('  DUBUG: No index file found in dir', req.dirPath);
        //console.log('    DEBUG: Rendering dir', req.dirPath);
        //mdServer.renderDocPage(res, req.url, req.dirPath, false, false, message);
        mdServer.renderDocEmpty(res, req.url, reqDirPath, message);
        //renderDoc(res, req.url, req.dirPath, false, false, false, message);
      });

    // fallback
    }, function () {
      console.error('  DEBUG: Requested document dir', req.url, 'not found', req.dirPath);
      console.log('    DEBUG: Redirect to documents root', parentUrl(urlParam));
      res.redirect(301, parentUrl(req.url));
    });

  } else {
    // Is req url an existing file?
    var currentDocPath = path.join(config.docs.path, urlParam + config.docs.extension);
    pathIsExistingFile(currentDocPath, function (stat) {
      var currentDirPath = path.dirname(currentDocPath) + path.sep;
      var currentDirUrl = parentUrl(req.url);

      console.log('DEBUG: Document file exist:', currentDocPath);
      renderDocFile(res, currentDocPath, currentDirUrl, currentDirPath, stat.mtime, message);

    // fallback
    }, function () {
      console.error('  DEBUG: Requested document file not found', path.join(config.docs.path, urlParam + config.docs.extension));
      console.log('    DEBUG: Redirect to documents root');
      res.redirect(config.webServer.docsRootUrl);
    });
  }
};
/**
 * API
 **/

app.get('/api/v1/docs/*', function(req, res) {
	var urlParam = '/' + req.params[0];
	var reqFilePath = path.join(config.docs.path, urlParam);

	fs.readFile(reqFilePath, config.docs.encoding, function (err, data) {
		if (err) {
			if ('EACCES' === err.code) res.send(403, err);
			res.send(404, err);
		}

		res.send(data);
	});
});

app.post('/api/v1/docs/*', function(req, res) {
	var urlParam = '/' + req.params[0];

	if (req.body.fileName) {
		var reqFilePath = path.join(config.docs.path, urlParam, req.body.fileName + config.docs.extension);

		fs.exists(reqFilePath, function (exists) {
			if (exists) {	// Don't allow override existing file
				res.send(409, {code: 'EEXIST', message: 'Requested file is already exist', path: reqFilePath});
			} else {
				fs.writeFile(reqFilePath, req.body.fileText, { encoding: config.docs.encoding }, function (err) {
					if (err) {
						res.send(409, err);
					} else {
						res.location(config.webServer.docsRootUrl + req.params[0] + '/' + req.body.fileName);
						res.send(201);
					}
				});
			}
		});
	}

	if (req.body.dirName) {
		var reqDirPath = path.join(config.docs.path, urlParam, req.body.dirName);

		fs.mkdir(reqDirPath, config.docs.newDirMask, function(err) {
			if (err) {
				res.send(409, err.stack);
			} else {
				//res.location(config.webServer.docsRootUrl + req.params[0] + '/' + req.body.dirName + '/');
				res.send(201);
			}
		});
	}

	// nothing to create
	if (undefined == req.body.dirName &&
	    undefined == req.body.fileName) {
		// HTTP 412 Precondition Failed
		res.send(412);
	}
});

app.put('/api/v1/docs/*', function(req, res) {
	var urlParam = '/' + req.params[0];

	logger.verbose('API: PUT', urlParam);

	logger.debug('fileName:', req.body.fileName);
	logger.debug('Orig fileName:', req.body.fileNameOrig);

	if (req.body.fileName) {

		var origFilePath = path.join(req.body.currentDirPath, req.body.fileNameOrig + config.docs.extension);

		logger.debug('origFilePath', origFilePath);


		fs.writeFile(origFilePath, req.body.fileText, { encoding: config.docs.encoding }, function (err) {
			if (err) {
				res.send(409, err);

			} else {

				logger.debug('API: File has been updated successfully');

				//var newFilePath = path.join(config.docs.path, url.getParent(urlParam), req.body.fileName + config.docs.extension);
				var newFilePath = path.join(req.body.currentDirPath, req.body.fileName + config.docs.extension);
				logger.debug('newFilePath', newFilePath);

				if (origFilePath != newFilePath) {
					logger.debug('API: Rename file');
					fs.exists(newFilePath, function (exists) {
						if (exists) {	// Don't allow override existing file
							res.send(409, {'errno': 47, code: 'EEXIST', message: 'Unable to rename. Requested file is already exist', path: newFilePath});
						} else {
							fs.rename(origFilePath, newFilePath , function(err) {
								if (err) {
									res.send(409, err);
								} else {
									res.location(config.webServer.docsRootUrl.slice(0,-1) + url.getParent(urlParam) + req.body.fileName); // slice ofr avoid double //
									res.send(201);
								}
							});
						}
					});
				} else {
					res.send(201);
				}
			}
		});
	}
});

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



var handleDocDir = function(req, res, next) {
  var currentDirPath = path.join(config.docs.path, '/' + req.params[0]);  // ./docs/path/

    // Is req url is an existing dir?
    pathIsExistingDir(currentDirPath, function () {

      var currentDirUrl = req.url;                            // domain/doc/path/
      var currentDirIndexDocPath = currentDirPath + config.docs.indexName + config.docs.extension; // ./docs/path/index.md

      console.log('DEBUG: Dir exist', currentDirPath);

      // Is there index file in current dir?
      pathIsExistingFile(currentDirIndexDocPath, function (stat) {
        console.log('  DEBUG: Index file found in current dir', currentDirIndexDocPath);

        // Read Index File and render doc page
        renderDocFile(res, currentDirIndexDocPath, currentDirUrl, currentDirPath, stat.mtime, message);

      }, function () {
        console.log('  DUBUG: No index file found in dir', currentDirPath);
        console.log('    DEBUG: Rendering dir', currentDirPath);
        renderDoc(res, currentDirUrl, currentDirPath, false, false, false, message);
      });

    // fallback
    }, function () {
      console.error('  DEBUG: Requested document dir not found', currentDirPath);
      if (currentDirPath == config.docs.path + path.sep) { // Docuemnts dir not found
        console.log('    DEBUG: Redirect to parent');
        res.redirect('..');
      } else {
        console.log('    DEBUG: Redirect to documents root'); // TODO: redirect to previous dir
        res.redirect(config.webServer.docsRootUrl);
      }
    });
};


var renderDoc = function(res, currentDirUrl, currentDirPath, currentFilePath, documentMd, modifiedTime, message) {
  res.render('docpage', { docsTitle: config.title,
                          logoImgPath: config.logo,
                          hideNavigation: config.hideNavigation,
                          message: message,
                          docsDir: config.webServer.docsRootUrl,
                          prevDirUrl: currentDirUrl == config.webServer.docsRootUrl ? false : parentUrl(currentDirUrl),
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

var renderDocFile = function(res, docPath, dirUrl, dirPath, time, message) {
  fs.readFile(docPath, config.docs.encoding, function (err, data) {
    if (err) {

      console.error('  DEBUG: Unable to read requested document file', docPath, err.stack);
      renderDoc(res, dirUrl, dirPath, false, false, false, 'Unable to read the document ' + docPath + ': ' + err.code);
    } else {

      console.log('  DEBUG: Rendering requested doc file:', docPath);
      renderDoc(res, dirUrl, dirPath, docPath, data, time, message);
    }
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
  if ('/' != config.webServer.docsRootUrl)
    res.redirect(config.webServer.docsRootUrl);
});

app.post(config.webServer.docsRootUrl + '*', function (req, res) {
  console.log('%%%% POST:', req.body);

  switch(req.body.action) {
    case 'newDir':
      var newDirPath = path.join(req.body.currentDirPath, req.body.dirName);

      console.log('DEBUG: Creating new dir:', newDirPath);
      mdNewDir(req, res, newDirPath);

      break;

    case 'newFile': // FIXME: check for file is exist
      newFilePath = path.join(req.body.currentDirPath, req.body.fileName + config.docs.extension);
      newFileText = req.body.fileText;

      console.log('DEBUG: Creating new file:', req.body.currentDirPath, req.body.fileName);
      mdFileWrite(req, res, newFilePath, newFileText);
      break;

    // PUT
    case 'updateFile':
      newFilePath = path.join(req.body.currentDirPath, req.body.fileName + config.docs.extension);
      origFilePath = path.join(req.body.currentDirPath, req.body.fileNameOrig + config.docs.extension);
      newFileText = req.body.fileText;

      if (newFilePath != origFilePath) { // Rename
        mdFileRename(req, res, origFilePath, newFilePath, newFileText);
      // The same file
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

var mdNewDir = function (req, res, newDirPath) {
  fs.mkdir(newDirPath, config.docs.newDirMask, function (err) {
    if (err) {

      console.log('  DEBUG: Unable to create new dir', newDirPath, ':', err.stack);
      docUrlRouter(req, res, 'Unable to create a directory ' + newDirPath + '. Error code: ' + err.code);
    } else {

      console.log('  DEBUG: New dir has been created successfully', newDirPath);
      docUrlRouter(req, res);
    }
  });
};

var mdFileWrite = function (req, res, filePath, fileText, message) {
  fs.writeFile(filePath, fileText, { encoding: config.docs.encoding }, function (err) {
    if (err) {

      console.log('  DEBUG: Unable to write to file', filePath, ':', err.stack);
      docUrlRouter(req, res, 'Unable to write to file ' + filePath + '. Error code: ' + err.code);
    } else {

      console.log('  DEBUG: Successfully wrote to file', filePath);
      docUrlRouter(req, res, message);
    }
  });
};

var mdFileRename = function (req, res, origFilePath, newFilePath, newFileText, newFileUrl) {

  fs.writeFile(origFilePath, newFileText, { encoding: config.docs.encoding }, function (err) {
    if (err) {

      console.log('  DEBUG: Unable to write to file', origFilePath, ':', err.stack);
      docUrlRouter(req, res, 'Unable to write to file ' + origFilePath + '. Error code: ' + err.code);
    } else {

      console.log('  DEBUG: Successfully wrote to file', origFilePath);

      fs.rename(origFilePath, newFilePath , function(err){
        if (err) {

          console.error('  DEBUG: Unable to rename file', origFilePath, '>', newFilePath, ':', err.stack);
          console.log('  DEBUG: res.location', res.location);
          mdFileWrite(req, res, origFilePath, newFileText, 'Unable to rename file ' + origFilePath + '>' + newFilePath + '. Error code: ' + err.code);

        } else {
          console.log('  DEBUG: File has been renamed successfully', origFilePath, '>', newFilePath);
          console.log('    DEBUG: Redirecting to new url', parentUrl(req.url) + req.body.fileName);
          res.redirect(parentUrl(req.url) + req.body.fileName);
        }
      });

      //docUrlRouter(req, res, message);
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
/*var renderPageIndex = function (res, reqUrl, docDir) {
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
};*/

// path extension
var getDirParent = function (dirPath) {
  return dirPath.replace(/([^\/]*\/)$/, ''); //cuts last dir xx/yy/zz/ -> xx/yy/
};

var getFileDir = function (filePath) {
  return filePath.replace(/([^\/]*)$/, ''); // cuts file name xx/yy/zz -> xx/yy/
};


//app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), app.get('ipaddress'), function () {
  logger.info('Express server listening on ' + app.get('ipaddress') + ':' + app.get('port') + ' in ' + app.get('env') + ' mode');
});
