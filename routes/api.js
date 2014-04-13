/**
 * API routes
 */

// Dependencies
var path = require('path');
var fs = require('fs');
var config = require('../lib/config');
var logger = require('../lib/logger');
var url = require('../lib/url');



var getDocument = function(req, res) {
	var urlParam = '/' + req.params[0];
	var reqFilePath = path.join(config.docs.path, urlParam);

	fs.readFile(reqFilePath, config.docs.encoding, function (err, data) {
		if (err) {
			if ('EACCES' === err.code) res.send(403, err);
			res.send(404, err);
		}

		res.send(data);
	});
};

var createItem = function(req, res) {
	var urlParam = '/' + req.params[0];

	// Create new File
	if (req.body.fileName) {	// TODD: move to seaprate funct
		var reqFilePath = path.join(config.docs.path, urlParam, req.body.fileName + config.docs.extension);

		fs.exists(reqFilePath, function (exists) {	// TODO: use async
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

	// Create new Dir
	if (req.body.dirName) {	// TODO: move to separate func
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

	// Nothing to create
	if (undefined == req.body.dirName &&
	    undefined == req.body.fileName) {
		// HTTP 412 Precondition Failed
		res.send(412);
	}
};

var updateDocument = function(req, res) {
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
};


exports.getDocument = getDocument;
exports.createItem = createItem;
exports.updateDocument = updateDocument;
