$(document).ready(function(){


	//***************
	// Event Handlers
	//***************
	$(document).on('click', '#create-dir', function(linkItem){
		createDirUIToggle();
	});

	$(document).on('click', '#cancel-create-dir', function(linkItem){
		createDirUIToggle();
	});

	$(document).on('click', '#create-file', function(linkItem){
		createFileUIToggle();
	});

	$(document).on('click', '#cancel-create-file', function(linkItem){
		createFileUIToggle();
	});

	function createFileUIToggle(){
		$('#create-file').toggleClass('hidden');
		$('#create-file-form').toggleClass('hidden');
	}

	function createDirUIToggle(){
		$('#create-dir').toggleClass('hidden');
		$('#create-dir-form').toggleClass('hidden');
	}
});
