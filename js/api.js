var api = api || {};
api = {
	config: {
		ulrs311: {
			base: "http://services.phila.gov/ULRS311/Data/" // Ideally this should allow jsonp. ETA 2012-11-11
			,location: "Location/"
			,timeout: 20000
			,minConfidence: 75
		}
		,gisServer: {
			base: "http://gis.phila.gov/ArcGIS/rest/services/"
			,pollingPlaces: "PhilaGov/PollingPlaces/MapServer/1/"
			,defaultParams: "query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnCountOnly=false&returnIdsOnly=false&returnGeometry=false&outFields=WARD_1%2CDIVISION_1%2CPOLLING_PL%2CADDRESS&f=pjson&geometry="
			,timeout: 20000
		}
		,gmaps: {
			query: "http://maps.google.com/maps?q="
			,staticmap: "http://maps.googleapis.com/maps/api/staticmap?zoom=17&size={width}x{height}&sensor=false&center={address}&markers={address}"
			,width: 260
			,height: 200
		}
		,civicinfo: {
			base: "https://www.googleapis.com/civicinfo/us_v1/"
			,voterinfo: "voterinfo/4000/lookup?fields=contests%2CnormalizedInput%2Cstatus&key="
			,apiKey: "AIzaSyCmJ45zmFdmbe_j7QtgAXLUTNl1gRFzJl4"
		}
	}
	
	,geocode: function(input, successCallback, errorCallback) {
		var url = api.config.ulrs311.base + api.config.ulrs311.location + encodeURIComponent(input);
		$.ajax({
			url: url
			,timeout: api.config.ulrs311.timeout
			,cache: true
			,error: errorCallback
			,success: function(data) {
				var location = null;
				if(data.Locations !== undefined && data.Locations.length) {
					for(i in data.Locations) {
						if(data.Locations[i].Address.Similarity >= api.config.ulrs311.minConfidence) {
							location = data.Locations[i];
							break;
						}
					}
				}
				successCallback(location);
			}
		})
	}
	
	,getPollingPlace: function(x, y, successCallback, errorCallback) {
		var geometry = "{\"x\":" + x + ",\"y\":" + y + "}";
		var url = api.config.gisServer.base + api.config.gisServer.pollingPlaces + api.config.gisServer.defaultParams + encodeURIComponent(geometry);
		$.ajax({
			url: url
			,dataType: "jsonp"
			,timeout: api.config.gisServer.timeout
			,cache: true
			,error: errorCallback
			,success: function(data) {
				var location = null;
				if(data.features !== undefined && data.features.length) {
					location = data.features[0].attributes;
				}
				successCallback(location);
			}
		})
	}
	
	,getCandidates: function(input, successCallback, errorCallback) {
		var url = api.config.civicinfo.base + api.config.civicinfo.voterinfo + api.config.civicinfo.apiKey;
		var body = {address: input};
		$.ajax({
			url: url
			,data: JSON.stringify(body)
			,type: "POST"
			,contentType: "application/json"
			,cache: true
			,error: errorCallback
			,success: successCallback
		});
	}
	
	,getMapUrl: function(address, width, height) {
		return api.config.gmaps.query + encodeURIComponent(address);
	}
	
	,getStaticMap: function(address) {
		return api.config.gmaps.staticmap.replace(/{address}/g, encodeURIComponent(address)).replace("{width}", api.config.gmaps.width).replace("{height}", api.config.gmaps.height);
	}
}