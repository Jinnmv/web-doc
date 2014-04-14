/**
 * Documents router
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var config = require('../lib/config');
var logger = require('../lib/logger');
var url = require('../lib/url');
var mdServer = require('../lib/mdServer');
var async = require('async');

// Main method
var renderDocument = function(req, res, next) {
	var urlParam = '/' + req.params[0];

	if ('/' === urlParam.slice(-1)) {
		renderDir(req, res, path.join(config.docs.path, urlParam));
		//routes.docDir(req, res, next);
	} else {
		renderFile(req, res, path.join(config.docs.path, urlParam + config.docs.extension));
		//routes.docFile(req, res, next);
	}
};

var renderDir = function(req, res, reqDirPath, message){

	logger.verbose('Requested URL [%s] points to Documents directoty [%s]', req.url, reqDirPath);

	// Async Magic starts there
	async.waterfall([

		// Step 1: Check for requested path exist
		async.apply(fs.stat, reqDirPath),

		// Step 2: Check requested path is a directory
		function(stat, callback){
			var reqDirIdxPath = reqDirPath + config.docs.indexName + config.docs.extension;

			if (stat.isDirectory()) {
				logger.verbose('Documents directory [%s] exist', reqDirPath);
				logger.silly('Checking for index file [%s] exist in documents directory [%s]', reqDirIdxPath, reqDirPath);
				callback(null, reqDirIdxPath);

			} else {
				callback({errorCode: 'NOTDIR', errMessage:'Requested path is not a directory', path: reqDirIdxPath});
			}
		},

		// Step 3: Check index.md exist in current dir
		// Step 4: Render view with index content or empty
		function(reqDirIdxPath, callback) {
			fs.stat(reqDirIdxPath, function (err, stat) {
				if(undefined === err && stat.isFile()){
					logger.verbose('Found index file [%s] in a documents directory', reqDirIdxPath);
					logger.info('Rendering Document index file', reqDirIdxPath);
					mdServer.renderDocPage(res, req.url, reqDirPath, reqDirIdxPath, stat.mtime, message);

				} else {
					logger.verbose('No index file found in a directory [%s]', reqDirPath);
					if (err) logger.verbose('\t ', err);
					logger.info('Rendering empty document', reqDirPath);
					mdServer.renderEmptyPage(res, req.url, reqDirPath, message);
				}
			});
		}

	// Final
	], function (err, result) {
		if (err) {
			logger.warn('Requested directory [%s] does not exist %s', reqDirPath, err ? '(' + err.stack + ')' : '');
			logger.verbose('\t ', err);
			logger.info('Redirecting to parent url [%s]', url.getParent(req.url));
			res.redirect(301, url.getParent(req.url));
		}
	});
};

var renderFile = function(req, res, reqFilePath, message){

	logger.verbose('Requested URL [%s] points to Document file [%s]', req.url, reqFilePath);

	var reqDirPath = path.dirname(reqFilePath) + path.sep;

	// Async Magic starts there
	async.waterfall([

		// Step 1: Check for requested path exist
		async.apply(fs.stat, reqFilePath),

		// Step 2: Check requested path is a file
		// Step 3: Render view with file content
		function(stat, callback){
			if(stat.isFile()){
				logger.verbose('Documents file [%s] exist', reqFilePath);
				logger.info('Rendering Document index file', reqFilePath);
				mdServer.renderDocPage(res, url.getParent(req.url), reqDirPath, reqFilePath, stat.mtime, message);
			} else {
				callback({errorCode: 'NOTFILE', errMessage:'Requested path is not a file', path: reqFilePath});
			}
		}

		// Final
	], function (err, result) {
		if (err) {
			logger.warn('Requested file [%s] does not exist %s', reqDirPath, err ? '(' + err.stack + ')' : '');
			logger.verbose('\t ', err);
			logger.info('Redirecting to parent url [%s]', url.getParent(req.url));
			res.redirect(301, url.getParent(req.url));
		}
	});
};

exports.document = renderDocument;
//exports.renderFile = renderFile;
