// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.

(function( $ ) {
	$.fn.showMessage = function(messageText) {
		$( this ).before('<div class="message" id="notif" style="display:none">' + messageText + '</div>');
		var $notif = $( '#notif' );

		$notif.slideDown('fast', function(){
			window.setTimeout(function(){
				$notif.slideUp(400, function(){
					$notif.remove();
				});
			}, 5000);
		});
	};
}( jQuery ));
