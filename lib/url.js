/*
 * URL transform helper
 */

// Get Url parent
// /aa/bb/cc/ -> /aa/bb/
exports.getParent = function (url) {
  return url.replace(/([^\/]*\/?)$/, '');
};

// /aa/bb/cc -> cc
exports.getDocName = function (url) {
    return url.replace(/.*\/([^\/.]*)\.md$/, '$1'); //TODO get ext from config
};
