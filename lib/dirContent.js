var fs = require("fs");
var path = require("path");
var allowedExtensions = require("./allowedExtensions");

// get current location directories list
function getDirs(directory) {
  var dirs = [];
  // Read the directory
  var currentDirs = fs.readdirSync(directory);
  currentDirs.forEach(function (dir) {

    // Chek for dir is not hidden
    if (dir.charAt(0) != '.') {

      if (fs.statSync(directory + "/" + dir).isDirectory())
        dirs.push(dir);
    }
  });
  return dirs;
}

// get current location markdown files list
function getFiles(directory) {
  var files = [];
  
  // Read the directory
  var currentFiles = fs.readdirSync(directory);
  currentFiles.forEach(function (file) {

    // check for file extension and not hidden file
    if (allowedExtensions.checkExt(file) && file.charAt(0) != '.') {

      if (fs.statSync(path.join(directory, file)).isFile()) {
        files.push(path.basename(file,'.md'));
      }
    }
  });
  return files;
}

// *** Async example *** TODO: try to make it async
/*function getFiles(directory) {
  var files = [];
  // Read the directory
  fs.readdir(directory, function (err, list) {
    // Return empty if something went wrong
    if (err) {
      console.log(err); // TODO: check for the best logging solution
      return []; //
    }

    // For every file in the list
    list.forEach(function (file) {
      // Check file extension
      if (allowedExtensions.checkExt(file)) {
        // Full path of that file
        var path = directory + "/" + file;
  
        // Get the file's stats
        fs.stat(path, function (err, stat) {
          // If the file is a directory
          if (stat && stat.isFile())
            files.push(file);
        });
      }
    });
  })

  return files;
}*/

exports.getDirs = getDirs;
exports.getFiles = getFiles;
