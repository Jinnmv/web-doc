$(document).ready(function(){

  /*var socket = io.connect();
  socket.on('connect', function(){
    console.log("connected");

    socket.on('renderNav', function(data){
      renderNavDirs('#nav-dirs', data.dirs);
      renderNavFiles('#nav-files', data.files, data.hideFilesExt);
      renderBackLink('#nav-back', data.prevDir);
    });

    socket.on('renderDoc', function(data){
      $('#doc').html(data.doc);
      $('#doc-footer').html('<p>Last Modified: ' + data.date + '</p><hr>');
    });


  });*/

  $(document).on('click', '#nav-files a', function(fileLink){
    socket.emit('readDoc', { fileName: fileLink.currentTarget.attributes['value'].value });
  });

  $(document).on('click', '#nav-dirs a', function(dirLink){
      socket.emit('navigateToDir', { dirName: dirLink.currentTarget.attributes['value'].value });
  });

  $(document).on('click', '#nav-back a', function(backLink){
      socket.emit('navigateBack', { dirName: decodeURIComponent(backLink.currentTarget.attributes['value'].value) });
  });


  function renderBackLink(container, backDirName) {
    // clear container data
    $(container).html('');

    if (backDirName.length != 0) {
      $(container).html('<a href="#" value="'  + encodeURIComponent(backDirName) + '">Back</a>');
    }
  }

  function renderNavDirs(container, dirs) {
    // clear container
    $(container).html('');

    dirs.forEach( function(item) {
      $(container).prepend('<li><a href="#" value="' + item + '">' + item + '</a></li>');
    });
  }

  function renderNavFiles(container, files, hideFilesExt) {
    // clear container
    $(container).html('');

    files.forEach( function(item) {
      //$(container).prepend('<li><a href="#" value="' + item + '">' + hideFilesExt ? trimFileExt(item) : item + '</a></li>');
      var name = hideFilesExt ? trimFileExt(item) : item;
      $(container).prepend('<li><a href="#" value="' + item + '">' + name + '</a></li>');
    });
  }

  function trimFileExt(fileName) {
    return fileName.replace(/(.*)\.[^.]+$/, '$1');
  }
});
