var DEBUG = false;

// Render candidates & questions immediately, before jQueryMobile initiates anything
$("#candidates :jqmData(role='content')").html(_.template($("#template-candidates").html(), candidates, {variable: "data"}));
$("#questions :jqmData(role='content')").html(_.template($("#template-questions").html(), questions, {variable: "data"}));

// If user tries to view the polling place page, check if it contains any results yet; otherwise redirect them to the search page
$("#pollingplace").bind("pagebeforeshow", function() {
	if( ! $(":jqmData(role='content')", $(this)).text()) {
		$.mobile.changePage($("#search"));
	}
});

// When the search page is shown, focus on the first form field
$("#search").bind("pageshow", function() {
	$("form input", $(this)).eq(0).focus();
});

$(document).ready(function() {
	// When search form is submitted
	$("#search form").submit(function(e) {
		var inputNode = $("input[name='address']", $(this));
		var input = $.trim(inputNode.val().replace(/^\s+|\s+$/g, "")); // Remove invalid chars
		if(input) {
			$("#pollingplace :jqmData(role='content')").empty(); // Clear the page
			$.mobile.loading("show");
			
			// Get the latitude/longitude of the address
			api.geocode(input, function(data) {
				if(DEBUG) console.log(data);
				if(data) { // If a match was found
					var userAddress = data.Address.StandardizedAddress; // This is the City's version of the address
					
					// Get the polling place for this latitude/longitude
					api.getPollingPlace(data.XCoord, data.YCoord, function(data) {
						if(DEBUG) console.log(data);
						$.mobile.loading("hide");
						if(data) { // If a match was found
						
							// Render results to content area
							var fullAddress = addCityState(data.ADDRESS);
							var contentData = {
								userAddress: userAddress
								,pollingplace: data
								,mapUrl: api.getMapUrl(fullAddress)
								,staticMap: api.getStaticMap(fullAddress)
							};
							$("#pollingplace :jqmData(role='content')").html(_.template($("#template-pollingplace").html(), contentData)).trigger("create");
							$.mobile.changePage($("#pollingplace"));
						} else {
							error("A polling place for this address could not be found.", $("#pollingplace"));
						}
					}, function(xhr, status, error) {
						error("An error occurred when trying to get your polling place from the database. Please try again.", $("#pollingplace"), xhr);
					});
				} else {
					error("Unable to validate the address you entered. Please enter just the basic street address, i.e. 1234 Market", $("#pollingplace"));
				}
			}, function(xhr, status, error) {
				error("An error occurred when trying to validate your address with the database. Please try again.", $("#pollingplace"), xhr);
			});
		} else {
			// No address entered
			inputNode.focus();
		}
		return false;
	});
});

function error(msg, page, xhr) {
	$.mobile.loading("hide");
	var errorData = {msg: msg, xhr: xhr || null};
	$(":jqmData(role='content')", page).html(_.template($("#template-error").html(), errorData)).trigger("create");
	$.mobile.changePage($("#pollingplace"));
}

function addCityState(input) {
	var comma = input.indexOf(",");
	if(comma > -1) {
		input = input.substr(0, comma);
	}
	return input + ", Philadelphia, PA";
}