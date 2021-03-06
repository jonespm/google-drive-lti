/**
 *  Various small utility support functions.
 * 
 * Author: Raymond Louis Naseef
 * 
 * @author lsloan@umich.edu (Lance E Sloan)
 */

if (typeof(jQuery) === 'undefined') {
	console.log('ERROR: utils.js requires jQuery');
}

/*
 * Replace the jQuery :contains() selector with a case-insensitive version
 */
$.expr[":"].contains = $.expr.createPseudo(function(searchText) {
	return function(element) {
		return $(element).text().toUpperCase()
				.indexOf(searchText.toUpperCase()) >= 0;
	};
});

function escapeHtml(value) {
	return $('<escapeHtmlHack/>').text(value).html();
}

function escapeJson(value) {
	return ($.trim(value) === '') ? '' : value.replace(/"/g,'\\"');
}
function escapeDoubleQuotes(value) {
	return ($.trim(value) === '') ? '' : value.replace(/"/g,'&quot;');
}

function escapeAllQuotes(value) {
	// Using "&apos;" for "'" causes trouble when making values for onclick attributes.  Why?
	return ($.trim(value) === '') ? '' : value.replace(/'/g, "\\'").replace(/"/g,'&quot;');
}

function escapeUrl(value) {
	return encodeURIComponent(value);
}

function logError(message, textStatus, jqXHR, debugMode) {
	if ((typeof(console) !== 'undefined') && (typeof(console.log) === 'function')) {
		console.log(message + ': ' + textStatus);
	} else if (debugMode === true) {
		alert(message + ': ' + textStatus);
	}
}

/**
 * Checks if arguments are not empty, used by callers to ensure values they
 * require are not undefined, null, or trim to "".
 * 
 * This is critical to avoid sending request to Google with bad access token, as
 * Google will ask the user to authenticate.
 */
function verifyAllArgumentsNotEmpty() {
	var result = true;
	for (var argIdx = 0; result && (argIdx < arguments.length); argIdx++) {
		result = ($.trim(arguments[argIdx]) !== '');
	}
	return result;
}

/**
 * clearTime(d) copied from fulcalendar.js
 */
function clearTime(d) {
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	return d;
}

/**
 * Returns true if the given value is undefined, not a number, or zero.
 */
function isZero(value) {
	var result = (typeof(value) === 'undefined');
	if  (!result) {
		if (isNaN(value) || (value === 0)) {
			result = true;
		}
	}
	return result;
}

/**
 * Returns date & time in ISO format, adjusting to current time zone if caller
 * wants that (Google timeMin/timeMax use current time zone instead of UTC)
 */
function getTimeIso(dt, useLocalTimezone) {
	// From: http://stackoverflow.com/questions/2573521/how-do-i-output-an-iso-8601-formatted-string-in-javascript
	if (!Date.prototype.toISOString) {
		Date.prototype.toISOString = function() {
			function pad(n) { return n < 10 ? '0' + n : n; }
			// NOTE: removed newline after "return" to fix parsing the return in IE8 (MacBook Pro VM)
			return this.getUTCFullYear() + '-'
			+ pad(this.getUTCMonth() + 1) + '-'
			+ pad(this.getUTCDate()) + 'T'
			+ pad(this.getUTCHours()) + ':'
			+ pad(this.getUTCMinutes()) + ':'
			+ pad(this.getUTCSeconds()) + 'Z';
		};
	}
	// Modify to current timezone
	if (useLocalTimezone) {
		dt = new Date(dt.getTime() - (dt.getTimezoneOffset() * 60 * 1000));
	}
	var result = dt.toISOString();
	return result;
}

/**
 * 
 * From: http://stackoverflow.com/questions/4450837/javascript-string-to-date-php-iso-string-format
 * Corrected to adjust for local time zone, so the resulting date/time is correct if string is GMZ
 */
Date.fromISOString = (function(){
	var tzoffset = new Date().getTimezoneOffset();
	function fastDateParse(y, m, d, h, i, s, ms){ // this -> tz
		return new Date(y, m - 1, d, h || 0, +(i || 0) - this, s || 0, ms || 0);
	}

	// result function
	return function(isoDateString){
		var tz = isoDateString.substr(10).match(/([\-\+])(\d{1,2}):?(\d{1,2})?/) || 0;
		if (tz) {
			tz = tzoffset + (tz[1] === '-' ? -1 : 1) * (tz[3] !== null ? +tz[2] * 60 + (+tz[3]) : +tz[2]);
		} else {
			tz = tzoffset;
		}
		return fastDateParse.apply(tz || 0, isoDateString.split(/\D/));
	};
})();

/**
 * Pads number so it displays with leading zeros (e.g., fixing minutes display
 * from 10:3 => 10:03)
 * 
 * @param number
 * @param len
 * @returns {String}
 */
function padNumber(number, len) {
	var result = '';
	if (!isNaN(number)) {
		result = '' + number;
		while (result.length < len) {
			result = '0' + result;
		}
	}
	return result;
}

/**
 * @returns {Boolean} true if console is object with function console.log()
 */
function getHasConsoleLogFunction() {
	return ((typeof(console) === 'object') && (console !== null) && (typeof(console.log) === 'function'));
}

/**
 * See: http://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling
 * 
 * This one checks if the whole height of the element is showing; this does not
 * work for iframes (see getDistanceFromBottomOfScroll() for how to fix this)
 */
function isScrolledIntoView($elem)
{
	var docViewTop = $(window).scrollTop();
	var docViewBottom = docViewTop + $(window).height();

	var elemTop = $elem.offset().top;
	var elemBottom = elemTop + $elem.height();

	return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
			&& (elemBottom <= docViewBottom) &&  (elemTop >= docViewTop) );
}

/**
 * sprintf() from https://github.com/alexei/sprintf.js would be great, but it's
 * overkill for this project.  
 * 
 * Call like: sprintf('%s, %s!', 'Hello', 'world')
 * 
 * @param format
 *            string with "%s" placeholder(s)
 * @param arg
 *            string values to be placed into format
 * @returns format with each occurrence of "%s" replaced by corresponding arg
 */
function sprintf(format) {
	var formatted = null;
	var args = arguments;
	var i = 1;
	
	if (format !== null) {
		formatted = format.replace(/%((%)|s)/g, function(m) {
			return m[2] || args[i++];
		});
	}
	return formatted;
}

function showInfo(container, message) {
    container.append($('<div>', {
        'class': 'alert alert-info',
        'html': message
    }).append($('<button>', {
        'type': 'button',
        'class': 'close',
        'html': '&times',
        'click': function() {
            $(this).parent().remove();
        }
    })));
}
