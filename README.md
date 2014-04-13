# web-doc

A simple engine for web-documentation using markdown files

## Folder structure

## Configuration
Engine reads `config.json` config file by default for the system configuration.

Configuration example:
```json
{
	"mode": "development",
	"webServer": {
		"host": "localhost",
		"port": 8080,
		"docsRootUrl": "/doc/"
	},
	"docs": {
		"path": "./doc",
		"encoding": "utf-8",
		"newDirMask": 0755,
		"extention": ".md",
		"indexName": "index"
	},
	
	"log": {
		"fileName":"./webdoc.log",
		"fileMaxSize": 10485760,
		"filesMaxCount": 10
	},
	
	"title": "WebDoc Portal",
	"logo": "/img/logo.png",
	"hideNavigation": false,
	"readOnly": false,
	"moderators": [
		"localhost",
		"ivan",
		"127.0.0.1"
	]
}
```

* `mode` - possible values:
  * `development` - enables extended logging and disables server caching;
  * `production` - disables extended logging and enables server caching;
* `webServer` - section for webserver detailed configuration:
  * `host` - host for the system. Hostname or ip address could be provided; In case of WebServer + node configuration, there should be local IP (`127.0.0.1` or `localhost`). In case of Node standalone configuration, there should be `0.0.0.0` - to listen any connection. '
  * `port` - port used;
  * `decsRootUrl` - mapping of documentation system url. Default value `/` or `/doc/`;
* `docs` - section for documentation files detailed configuraiton:
  * `path` - path to the docs directory in file system; Absolute or relative to webserver root;
  * `encoding` - documentation files text encoding. Default: `utf-8`;
  * `newDirMask` - file system mask used for new folders;
  * `extension` - default file extension for documentation files. Will be used to hide it for user on UI. Default: `.md`;
  * `indexName` - index file name. This file will be loaded by default when navigationg inside folder. Default: `index`;
* `title` - documentation system title; Will be used in web-page header and browser title;
* `logo` - path to logo image; Will be displayed left from web page header. Default: ``/img/logo.png`;
* `hideNavigation` - you probably don't want navigation section; Defalult: `false`;
* `readOnly` - if `true` will not be possible to edit documentation / create folders from web UI, except `moderators` hosts list. if `false` webdoc will be available to edit for everyone. Default: `false`. **Not Implemented**
* `moderators` - list of hosts/IPs of moderators to allow them edit read-only webdoc; **Not implemented**

## API
/api/1/document?path='/dir01/index.md'
/api/1/document/dir01/index.md
GET - read
POST - create
PUT - update

## Notes
Update NPS with package.json: `npm install --save`
