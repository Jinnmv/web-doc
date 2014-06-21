/**
 * API routes
 */

// Dependencies
var path =   require('path');
var fs =     require('fs');
var async =  require('async');

var config = require('../lib/config');
var logger = require('../lib/logger');
var url =    require('../lib/url');



var getDocument = function(req, res) {
	var urlParam = '/' + req.params[0];	// TODO: use of middleware
	var reqFilePath = path.join(config.docs.path, urlParam);

	fs.readFile(reqFilePath, config.docs.encoding, function (err, data) {
		if (err) {
			if ('EACCES' === err.code) res.send(403, err);
			res.send(404, err);
		}

		res.send(data);
	});
};

var createDocument = function( req, res ) {

    // Nothing to create
	if (undefined == req.body.dirName &&
	    undefined == req.body.fileName) {
		// HTTP 412 Precondition Failed
		res.send(412, '"fileName" or "dirName" parameter required!');  // TODO: rephrase;
	}

	// Create new File
	if (req.body.fileName) {	// TODD: move to seaprate funct
		createFile(req, res);

		/*fs.exists(reqFilePath, function (exists) {	// TODO: use async
			if (exists) {	// Don't allow override existing file
				res.send(409, {code: 'EEXIST', message: 'Requested file is already exist', path: reqFilePath});
			} else {
				fs.writeFile(reqFilePath, req.body.fileText, { encoding: config.docs.encoding }, function (err) {
					if (err) {
						res.send(409, err);
					} else {
						res.location(config.webServer.docsRootUrl + req.params[0] + '/' + req.body.fileName);
						logger.debug('API: Create new file. Location', res.location());
						res.send(201);
					}
				});
			}
		});*/
	}

	// Create new Dir
	if (req.body.dirName) {	// TODO: move to separate func
		createDir(req, res);
	}

};

/*
 * params: fileName, fileText
 */

var createFile = function ( req, res ) {
	var urlParam = '/' + req.params[0]; // TODO: put to middleware

	var reqFilePath = path.join(config.docs.path, urlParam, req.body.fileName + config.docs.extension);

	async.waterfall([
		function(callback) {
			fs.exists(reqFilePath, function (exists) {
				callback(null, exists);
			});
		},

		function(exists, callback){
			if ( exists ) {
				callback({code: 'EEXIST', message: 'Requested file is already exist', path: reqFilePath});
			} else {
				callback(null);
			}
		},

		async.apply(fs.writeFile, reqFilePath, req.body.fileText, { encoding: config.docs.encoding })

	], function(err) {
		if (err) {
			res.send(409, err);
		} else {
			res.location(config.webServer.docsRootUrl + req.params[0] + '/' + req.body.fileName);
			logger.debug('API: Create new file. Location', res.get('Location'));
			res.send(201);
		}
	});
};

/* param: dirName */

var createDir = function ( req, res ) {
	var urlParam = '/' + req.params[0];	// TODO: use of middleware
	var reqDirPath = path.join(config.docs.path, urlParam, req.body.dirName);

	fs.mkdir(reqDirPath, config.docs.newDirMask, function(err) {
		if (err) {
			res.send(409, err.stack);
		} else {
			//res.location(config.webServer.docsRootUrl + req.params[0] + '/' + req.body.dirName + '/');
			res.send(201);
		}
	});
};

/* Params: fileName, fileNameOrig, currentDirPath, fileText */

var updateDocument = function(req, res) {
	var urlParam = '/' + req.params[0];

	logger.verbose('API: PUT', urlParam);

	logger.debug('fileName:', req.body.fileName);
	logger.debug('Orig fileName:', req.body.fileNameOrig);
	//logger.debug('currentDirPath:', req.body.currentDirPath);

    if (undefined == req.body.fileName) {
        res.send(412, '"fileName" or "dirName" parameter required!');  // TODO: rephrase;
    }

    var origFilePath = path.join(config.docs.path, urlParam);
    logger.debug('origFilePath', origFilePath);

    var newFilePath = path.join(config.docs.path, url.getParent(urlParam), req.body.fileName + config.docs.extension);
    logger.debug('newFilePath', newFilePath);

    async.waterfall([
        function (callback) {
            fs.writeFile(origFilePath, req.body.fileText, { encoding: config.docs.encoding }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    logger.debug('API: File has been updated successfully');
                    callback(null);
                }
            });
        },

        function ( callback ) {
            if (req.body.fileNameOrig != req.body.fileName) {

                logger.debug('API: Rename file');
                fs.exists(newFilePath, function (exists) {
                    callback(null, exists);
                });
            }
          },

        function ( exists, callback ) {
            logger.debug('API: Check for destination file is not present');
            if ( exists ) {
				callback({'errno': 47, code: 'EEXIST', message: 'Unable to rename. Requested file is already exist', path: newFilePath});
            } else {
                callback(null);
            }
        },

        function ( callback ) {
            fs.rename(origFilePath, newFilePath , function(err) {
                if (err) {
                    callback(err);
                } else {
                    res.location(config.webServer.docsRootUrl.slice(0,-1) + url.getParent(urlParam) + req.body.fileName); // slice to avoid double //
                    callback(null);
                }
            });
        }

    ], function (err) {
        if (err) {
            res.send(409, err);
        } else {
            res.send(201);
        }
    });

	/*
    if (req.body.fileName) {

		var origFilePath = path.join(config.docs.path, urlParam);
		logger.debug('origFilePath', origFilePath);

		fs.writeFile(origFilePath, req.body.fileText, { encoding: config.docs.encoding }, function (err) {
			if (err) {
				res.send(409, err);

			} else {

				logger.debug('API: File has been updated successfully');

				if (req.body.fileNameOrig != req.body.fileName) {

                    var newFilePath = path.join(config.docs.path, url.getParent(urlParam), req.body.fileName + config.docs.extension);
                    logger.debug('newFilePath', newFilePath);

					logger.debug('API: Rename file');
					fs.exists(newFilePath, function (exists) {
						if (exists) {	// Don't allow override existing file
							res.send(409, {'errno': 47, code: 'EEXIST', message: 'Unable to rename. Requested file is already exist', path: newFilePath});
						} else {
							fs.rename(origFilePath, newFilePath , function(err) {
								if (err) {
									res.send(409, err);
								} else {
									res.location(config.webServer.docsRootUrl.slice(0,-1) + url.getParent(urlParam) + req.body.fileName); // slice to avoid double //
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
	} else {
        res.send(412, '"fileName" or "dirName" parameter required!');  // TODO: rephrase;
    } */
};


exports.getDocument = getDocument;
exports.createDocument = createDocument;
exports.updateDocument = updateDocument;
