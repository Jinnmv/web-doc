
// Dependencies
var config = require('./config');
var url = require('./url');
var dirContent = require('./dirContent');
var logger = require('./logger');
var marked = require('marked');
var fs = require('fs');
var path = require('path');


marked.setOptions({
	highlight: function (code) {
		return require('highlight.js').highlightAuto(code).value;
	}
});

//+render file doc
//+render dir doc
//create file
//update file
//create dir



var renderDocPage = function(res, reqDirUrl, reqDirPath, reqFilePath, docModifiedTime, message) {
	var templateParams = {
		docsTitle: config.title,
		logoImgPath: config.logo,
		hideNavigation: config.hideNavigation,
		message: message,
		docsDir: config.webServer.docsRootUrl,
		prevDirUrl: reqDirUrl == config.webServer.docsRootUrl ? false : url.getParent(reqDirUrl),
		currentDirUrl: reqDirUrl,
		currentDirPath: reqDirPath,
		relativeDirPath: path.relative(config.docs.path, reqDirPath),
		dirNames: dirContent.getDirs(reqDirPath),
		fileNames: dirContent.getFiles(reqDirPath)
	};

	if (reqFilePath) {

		fs.readFile(reqFilePath, config.docs.encoding, function (err, data) {	//TODO: use streams
			if (err) {
				templateParams.message = 'Unable to read the document ' + reqFilePath + ': ' + err.code;
				logger.error('Unable to read requested document file [%s]: %j', reqFilePath, err.stack);
				res.render('docpage', templateParams);

			} else {

				templateParams.doc = marked(data);
				templateParams.docMd = data;
				templateParams.docName = url.getDocName(reqFilePath);
				templateParams.modifiedTime = docModifiedTime;
				templateParams.relativeFilePath = path.relative(config.docs.path, reqFilePath);
				logger.debug('currentDirUrl=', templateParams.currentDirUrl);

				res.render('docpage', templateParams);
			}
		});

	} else {

		logger.debug('renderDocPage: prevDirUrl=', templateParams.prevDirUrl);

		res.render('docpage', templateParams);
	}

};

// Renders empty document, with navigation only
// alias to renderDocPage
var renderEmptyPage = function(res, reqDirUrl, reqDirPath, message) {
	renderDocPage(res, reqDirUrl, reqDirPath, false, false, message);
};

exports.renderDocPage = renderDocPage;
exports.renderEmptyPage = renderEmptyPage;
