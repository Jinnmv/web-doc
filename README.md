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

/api/1/document/dir01/index.md

* GET - read file by relative path
* POST - create file/dir
* PUT - update file

## Notes
Update NPS with package.json: `npm install --save`

## Node.js windows install

1. Download Node from http://nodejs.org/download/ (Windows Installer (.msi)).
2. Install.

	> Now you can use Node in command line

3. Download WebDoc project from Git (https://github.com/Jinnmv/webdoc/archive/master.zip);
4. Unpack archive to some directory, e.g.: `D:\webdoc`
5. Right click on a `webdoc` folder holding `<Shift>` key. Select '`Open command window here`'

You will get command prompt opened in you directory `D\webdoc`.

6. Type `npm install` to download and install all required modules.

Now you can launch server

7. Type `node webdoc`
8. Enjoy

> **Note**: if you have git client, you can clone repositry `git clone https://github.com/Jinnmv/webdoc.git`.

> For better update/working with git repo, it's recommnded to use Git clients for Windows. E.g.: http://code.google.com/p/tortoisegit/wiki/Download .

### Script to launch server
You can write simple script for windows to launch a server:

`webdoc-run.cmd`:

```cmd
@echo off

D:
cd D:\webdoc\
node webdoc.js

echo on
```
