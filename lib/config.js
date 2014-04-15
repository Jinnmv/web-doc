/*
 * Configuration helper
 */

var nconf = require('nconf');

/* configuration */
nconf.env(['NODE_ENV', 'IP', 'PORT'])
		.file('./config.json');

/* defaults */
nconf.defaults({
	mode: process.env.NODE_ENV || 'production',
	webServer: {
		host: process.env.IP || 'localhost',
		port: process.env.PORT || 8080,
		docsRootUrl: '/doc/',
		apiUrl: '/api/v1/docs'
	},

	docs: {
		path: './doc',
		encoding: 'utf-8',
		newDirMask: 0755,
		extension: '.md',
		indexName: 'index'
	},

	log: {
		fileName: './webdoc.log',
		fileMaxSize: 10485760,
		filesMaxCount: 10
	},

	title: 'WebDoc Portal',
	logo: '/img/logo.png',
	copyrigt: 'copyright',
	hideNavigation: false,
	readOnly: true,

	moderators: [
		"localhost",
		"127.0.0.1"
	]
});

/* export object */
// TODO: rewrite to use common approach, not hardcoded;
/*var config = {
	mode: nconf.get('mode'),
	webServer: nconf.get('webServer'),
	docs: nconf.get('docs'),

	log: nconf.get('log'),
	title: nconf.get('title'),
	logo: nconf.get('logo'),
	hideNavigation: nconf.get('hideNavigation'),
	copyrigt: nconf.get('copyright'),
	readOnly: nconf.get('readOnly'),
	moderators: nconf.get('moderators')
}; */

var config = nconf.get();

module.exports = config;
