var path = require("path");

// TODO make ext list configurable

// checks if a given file name is allowed (this is usually for reading or writing)
function checkExt(fileName){
  if (path.extname(fileName) == ".md" || 
      path.extname(fileName) == ".mdown" || 
      path.extname(fileName) == ".markdown" || 
      path.extname(fileName) == ".mkd" || 
      path.extname(fileName) == ".mkdn" || 
      path.extname(fileName) == ".txt"){
    return true;
  }
  return false;
}

exports.checkExt = checkExt;