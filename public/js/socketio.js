$(document).ready(function(){

  var socket = io.connect();
  socket.on('connect', function(){
    console.log("connected");

    /*socket.on('renderNav', function(data){
      renderNavDirs('#nav-dirs', data.dirs);
      renderNavFiles('#nav-files', data.files, data.hideFilesExt);
      renderBackLink('#nav-back', data.prevDir);
    });*/

    socket.on('renderNavDirs', function(data){
      renderNavDirs('#nav-dirs', data.dirs, getFileDir(window.location.pathname));
    });

    socket.on('renderNavFiles', function(data){
      renderNavFiles('#nav-files', data.files, getFileDir(window.location.pathname));
    });

    socket.on('renderDoc', function(data){
      $('#doc').html(data.doc);
      $('#doc-footer').html('<p>Last Modified: ' + data.date + '</p><hr>');
    });

    socket.on('showMessage', function(msg){
      showMessage(msg);
    });


  });

  /*$(document).on('click', '#nav-files a', function(fileLink){
    socket.emit('readDoc', { fileName: fileLink.currentTarget.attributes['value'].value });
  });

  $(document).on('click', '#nav-dirs a', function(dirLink){
      socket.emit('navigateToDir', { dirName: dirLink.currentTarget.attributes['value'].value });
  });

  $(document).on('click', '#nav-back a', function(backLink){
      socket.emit('navigateBack', { dirName: decodeURIComponent(backLink.currentTarget.attributes['value'].value) });
  });*/

// *** New Dir ***
  $(document).on('click', '#create-dir', function(linkItem){
    $('#create-dir').hide();
    $('#create-dir').after('<div id="temp-new-folder"><form><input id="dir-name" type="text" /><a href="#" id="confirm-create-dir" class="btn btn-submit">Create</a><a href="#" id="cancel-create-dir" class="btn btn-cancel">Cancel</a></form></div>');

      //socket.emit('createDir', { dirName: decodeURIComponent(backLink.currentTarget.attributes['value'].value) });
  });

  $(document).on('click', '#confirm-create-dir', function(linkItem){
    //TODO validation!

    socket.emit('createDir', { dirName: $('input#dir-name').val(), url: window.location.pathname });

    $('#temp-new-folder').remove();
    $('#create-dir').show();
  });

  $(document).on('click', '#cancel-create-dir', function(linkItem){
    $('#temp-new-folder').remove();
    $('#create-dir').show();
  });

// *** New File ***
  $(document).on('click', '#create-file', function(linkItem){
    var doc = $('#doc') == 0 ? $('#doc') : $('#nav');  // in case of empty dir = no doc div
    $('#doc').hide();
    $('#create-file').hide();
    $('#edit-file').hide();
    doc.after('<div id="temp-edit-file"><form><a href="#" id="confirm-create-file" class="btn btn-submit">Save</a><a href="#" id="cancel-edit-file" class="btn btn-cancel">Cancel</a><br><input id="file-name" type="text"><br><textarea id="doc-edit"></textarea></form></div>');
  });

  $(document).on('click', '#confirm-create-file', function(linkItem){
    socket.emit('createFile', { fileName: $('input#file-name').val(), fileContent: $('#doc-edit').val(), url: window.location.pathname });

    $('#temp-edit-file').remove();
    $('#create-file').show();
    $('#edit-file').show();
    $('#doc').show();
  });

  $(document).on('click', '#cancel-edit-file', function(linkItem){
    $('#temp-edit-file').remove();
    $('#create-file').show();
    $('#edit-file').show();
    $('#doc').show();
  });

// *** Edit File ***
  $(document).on('click', '#edit-file', function(linkItem){
    var fileName = $('#doc').data('fileName');
    $('#doc').hide();
    $('#create-file').hide();
    $('#edit-file').hide();
    $('#doc').after('<div id="temp-edit-file"><form><a href="#" id="save-file" class="btn btn-submit">Save</a><a href="#" id="cancel-edit-file" class="btn btn-cancel">Cancel</a><br><input id="file-name" type="text"><br><textarea id="doc-edit"></textarea></form></div>');
    $('#file-name').val( trimFileExt(getFileName(fileName)));
    socket.emit('getMdFile', { fileName: fileName, url: window.location.pathname });

    socket.on('mdFile', function(data){
      $('#doc-edit').val(data.fileContent);
    });
  });

  $(document).on('click', '#save-file', function(linkItem){
    socket.emit('updateFile', { fileName: $('input#file-name').val(), docFileName: $('#doc').data('fileName'), fileContent: $('#doc-edit').val(), url: window.location.pathname });
    socket.on('docFile', function(data){
      console.log('>> Socket on docFile ', data);
      $('#doc').html(data.docContent);
      //$('#doc').data('fileName') = data.filePath;
      $('#doc-footer').html('Last Modified: ' + data.lastModified);

    });

    $('#temp-edit-file').remove();
    $('#create-file').show();
    $('#edit-file').show();
    $('#doc').show();
  });

// *** Generic functions ***
  function renderBackLink(container, backDirName) {
    // clear container data
    $(container).html('');

    if (backDirName.length != 0) {
      $(container).html('<a href="#" value="'  + encodeURIComponent(backDirName) + '">Back</a>');
    }
  }

  function renderNavDirs(container, dirs, currentDir) {
    // clear container
    $(container).html('');

    dirs.forEach( function(item) {
      $(container).prepend('<li><a href="' + currentDir + item + '/">' + item + '</a></li>');
    });
  }

  function renderNavFiles(container, files, currentDir) {
    // clear container
    $(container).html('');

    files.forEach(function(item) {
      $(container).prepend('<li><a href="' + currentDir + item + '" >' + item + '</a></li>');
    });
  }

  var trimFileExt = function(fileName) {
    return fileName.replace(/(.*)\.[^.]+$/, '$1');
  }

  var getFileName = function(filePath) {
    return filePath.replace(/.*\/([^\/]*)$/, '$1'); //cuts file path xx/yy/zz.md -> zz.md
  }

  var getFileDir = function(filePath) {
    return filePath.replace(/([^\/]*)$/,''); // cuts file name xx/yy/zz -> xx/yy/
  }

  function showMessage(messageText) {
    $('#notification').hide();  // TODO put to CSS layout
    $('#notification').html(messageText);
    $('#notification').slideDown('fast', function(){
      window.setTimeout(function(){
        $('#notification').slideUp();
      }, 5000);
    });
  }



});
