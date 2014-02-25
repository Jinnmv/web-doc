$(document).ready(function(){

	// Init
	showMessage();
	$('footer#doc-footer > time').html(convertDateToLocal($('footer#doc-footer > time').attr('datetime')));

	// Local helpers
	function showMessage() {
		$('#notification').hide();  // TODO put to CSS layout

		$('#notification').slideDown('fast', function(){
			window.setTimeout(function(){
				$('#notification').slideUp();
			}, 5000);
		});
	}

	function convertDateToLocal(dateTime) {
		return new Date(dateTime).toLocaleString();
	}

	//***************
	// Event Handlers
	//***************
	$(document).on('click', '#create-dir', function(linkItem){
		createDirFormShow();
	});

	$(document).on('click', '#cancel-create-dir', function(linkItem){
		createDirFormHide();
	});

	$(document).on('click', '#create-file', function(linkItem){
		createFileFormShow();
	});

	$(document).on('click', '#cancel-create-file', function(linkItem){
		createFileFormHide();
	});

	$(document).on('click', '#edit-file', function(linkItem){
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
		$('article#doc').removeClass('hidden');
	}

	function createDirFormHide(){
		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');

		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('article#doc').removeClass('hidden');
	}

	function createFileFormShow() {
		$('#create-file').addClass('hidden');
		$('#create-file-form').removeClass('hidden');

		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('article#doc').removeClass('hidden');
	}

	function createFileFormHide(){
		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');

		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('article#doc').removeClass('hidden');
	}

	function editFileFormShow(){
		$('#edit-file').addClass('hidden');
		$('#edit-file-form').removeClass('hidden');
		$('article#doc').addClass('hidden');

		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');
		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
	}

	function editFileFormHide(){
		$('#edit-file').removeClass('hidden');
		$('#edit-file-form').addClass('hidden');
		$('article#doc').removeClass('hidden');

		$('#create-file').removeClass('hidden');
		$('#create-file-form').addClass('hidden');
		$('#create-dir').removeClass('hidden');
		$('#create-dir-form').addClass('hidden');
	}
});
