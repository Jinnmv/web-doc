$(document).ready(function(){

	var apiUrl = '/api/v1/docs/';

	// Init
	showMessageM();
	$('footer#doc-footer > time').html(convertDateToLocal($('footer#doc-footer > time').attr('datetime')));

	// Local helpers
	function showMessageM(messageText) {
		//$('#notification').hide();  // TODO put to CSS layout
		if (messageText) $('#notification').html(messageText);

		if ($('#notification').text.length != 0 ) {
			$('#notification').slideDown('fast', function(){
				window.setTimeout(function(){
					$('#notification').slideUp();
				}, 5000);
			});

		}
	}

	function convertDateToLocal(dateTime) {
		return new Date(dateTime).toLocaleString();
	}

	//***************
	// Event Handlers
	//***************
	$(document).on('click', '#create-dir', function(linkItem){
		linkItem.preventDefault();
		createDirFormShow();
	});

	$(document).on('click', '#cancel-create-dir', function(linkItem){
		createDirFormHide();
	});

	$('#create-dir-form').submit( function( event ) {
		event.preventDefault();

		var $form = $( this ),
			dirUrl = $form.find('input[name=dirPath]').val();

		$.post( apiUrl + dirUrl, $form.serialize() )
		 .done(function( data ) {
			createDirFormHide();
			window.location.reload();
		})
		 .fail(function( data ) {
			$form.showMessage(data.responseText);
		});

	});

	$(document).on('click', '#create-file', function(linkItem){
		linkItem.preventDefault();
		createFileFormShow();
	});

	$(document).on('click', '#cancel-create-file', function(linkItem){
		createFileFormHide();
	});

	$('#create-file-form').submit(function( event ) {
		event.preventDefault();

		var $form = $( this ),
			dirUrl = $form.find('input[name=dirPath]').val();

		$.post( apiUrl + dirUrl, $form.serialize() )
		 .done(function( data, textStatus, jqXHR ) {
			editFileFormHide();
			if ( jqXHR.getResponseHeader('Location') ) {
				window.location.replace( jqXHR.getResponseHeader('Location') );
			} else {
				window.location.reload();
			}
		})
		 .fail(function( data ) {
			$form.showMessage(data.responseText);
		});


	});

	$('#edit-file-form').submit(function( event ) {

		// Stop form from submitting normally
		event.preventDefault();


		var $form = $( this ),
			fileUrl = $form.find('input[name=filePath]').val();

		$.post( apiUrl + fileUrl, $form.serialize() )
		 .done(function( data, textStatus, jqXHR ) {
			createFileFormHide();
			if ( jqXHR.getResponseHeader('Location') ) {
				window.location.replace( jqXHR.getResponseHeader('Location') );
			} else {
				window.location.reload();
			}
		})
		 .fail(function( data ) {
			if ( 409 === data.status ) {
				console.log('Error message:', data.responseJSON.message);
				//showMessage('alarm ' + data.responseJSON.message);
			}
			$form.showMessage(data.responseJSON);
			//showMessageM('alarm ' + data.responseJSON.message);
			//showMessage(data.responseJSON);
			//console.error( 'Failed to load data', data );
		});
	});

	$(document).on('click', '#edit-file', function(linkItem){
		linkItem.preventDefault();

		var fileUrl = $('#edit-file-form input[name=filePath]').val();
		$.get( apiUrl + fileUrl )
		 .done(function( data ) {
			$('#edit-file-form textarea').val(data);
		})
		.fail(function( data ) {
			console.error( 'Failed to load data' );
		});

		editFileFormShow();
	});

	$(document).on('click', '#cancel-edit-file', function(linkItem){
		editFileFormHide();
	});

	function createDirFormShow() {
		$('#create-dir').addClass('hidden');
		$('#create-dir-form').removeClass('hidden');

		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('section#content').removeClass('hidden');
	}

	function createDirFormHide(){
		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');

		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('section#content').removeClass('hidden');
	}

	function createFileFormShow() {
		$('#create-file').addClass('hidden');
		$('#create-file-form').removeClass('hidden');

		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('section#content').addClass('hidden');
	}

	function createFileFormHide(){
		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');

		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('section#content').removeClass('hidden');
	}

	function editFileFormShow(){
		$('#edit-file').addClass('hidden');
		$('#edit-file-form').removeClass('hidden');
		$('section#content').addClass('hidden');

		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');
		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
	}

	function editFileFormHide(){
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('section#content').removeClass('hidden');

		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');
		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
	}


});
