//    This file is part of BrewMap - a program to produce web maps
//    of uk breweries.
//
//    BrewMap is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    BrewMap is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with BrewMap.  If not, see <http://www.gnu.org/licenses/>.
//
//    Copyright Graham Jones 2011.
//
////////////////////////////////////////////////////////////////////////
// Define Global Variables
var configFname = "BrewMapCfg.json";
var layerGroup = "BrewMap";
var dataURL;
var imageURL;
var map;
var statistics = {};
var layerDefs = {};

function makeIcons() {
// Create Leaflet Icons using the images specified in LayerDefs.
// The icon objects are added to LayrDefs.
    for (var layerName in layerDefs['layerGroups'][layerGroup]) {
	alert("layerName="+layerName);
	var iconURL = imageURL + "/" + LayerDefs[layerName]['iconImg']
	var iconType = L.Icon.extend({
	    iconUrl: iconURL,
	    shadowUrl: iconURL,
	    iconSize: new L.Point(24,24),
	    shadowSize: new L.Point(24,24),
	    iconAnchor: new L.Point(12,12),
	    popupAnchor: new L.Point(12,24)
	});
	LayerDefs[layerName]['icon'] = new iconType()
    }
}


function loadConfigFile() {
    jQuery.getJSON(
		   dataURL+configFname,
		   loadConfigSuccess
		   );
}

function loadConfigSuccess(dataObj) {
    // Parses the downloaded configuration file object
    // and loads its content into global variables for use by other
    // functions.
    // HIST:
    //      16nov2011  GJ  ORIGINAL VERSION
    alert("loadConfigSuccess - dataObj="+dataObj);
    layerDefs = dataObj;
}

function load_brewmap_data() {
    loadConfigFile();
    makeIcons();
    for (var layerName in LayerDefs) {
	//alert("Loading Layer "+layerName+", "+typeof(layerName));
	// This loads the required file, and passes it to loadDataSuccess, along with an extra
	// argument, layerName which is the name of the Layer just loaded, so that we only need one
	// loadDataSuccess function, no matter how many files we need to load.
	jQuery.getJSON(
	    dataURL+LayerDefs[layerName]['dataFile'],
	    bound_loadDataSuccess(layerName)
	);
    }
    showStatistics();
}

function bound_loadDataSuccess(layerName) {
    // This function is used by load_brewmap_data to create a callback function that
    // passes the layer name as a parameter - it is made to call loadDataSuccess().
    // 12Nov2011 Craig Loftus
    //
    return function(data) {
	loadDataSuccess(data, layerName);
    };
}

/* 
 * NAME: loadDataSuccess(data,statusText)
 * DESC: This function is called when a brewery datafile is successfully downloaded by the server.
 *       Download is initiated from the load_brewmap_data() function.
 *       It parses the file to create the map objects for display.
 * HIST: 12Nov2011  GJ  ORIGINAL VERSION
 * 	 15Nov2011 Craig Loftus Moved pop-up content out
 */
function loadDataSuccess(dataObj,layerName) {
    
    for (entity in dataObj) {
	if (entity != 'layerName') {

	    // Local cache to reduce searching
	    var entity_obj = dataObj[entity];
	    // Storing id in object for use in pop-up
	    entity_obj.id = entity;
	    // Keeping all the info about the entity together
	    entity_obj.brew_type = 'microbrewery';
	    var markerFillColour = 'yellow';
	    if (entity_obj['industry']=="brewery") {
		entity_obj.brew_type = 'industrial';
		markerFillColour = 'blue';
	    }
	    if (entity_obj['craft']=="brewery") {
		entity_obj.brew_type = 'craft';
		markerFillColour = 'green';
	    }
	    //var marker = new L.Marker(posN);
	    //var marker = new L.CircleMarker(posN,
	    //				    {color:markerFillColour,
	    //				     fillColor:markerFillColour,
	    //				     fillOpacity:0.5});
	    
	    var posN = new L.LatLng(entity_obj['point']['lat'],
				   entity_obj['point']['lng']);

	    var marker = new L.Marker(posN, {icon: LayerDefs[layerName]['icon']});
	    marker.bindPopup(popup.content(entity_obj));
	    map.addLayer(marker);
	} 
    }
    addStatistics(layerName,dataObj);
}

/*
 * NAME: popup
 * DESC: Object that provides functions for generating pop-up content
 * HIST: 15Nov2011 Craig Loftus ORIGINAL VERSION
 */
var popup = {
	/*
	 * NAME: popup.item(key,value)
	 * DESC: Produces a list item formatted as a key value pair
	 * HIST: 15Nov2011 Craig Loftus ORIGINAL VERSION
	 */
	item: function(key_str,value_str) {
		// Using [].join() because it is quicker than concat.
		return this.output.push(["<li><strong>",key_str,":</strong> ",
			value_str,"</li>"].join(''));
	},
	/*
	 * NAME: popup.content(entity_obj)
	 * DESC: Produces html for pop-up given an object containing all the
	 *       info on an entity
	 * HIST: 15Nov2011 Craig Loftus ORIGINAL VERSION
	 */
	content: function(entity_obj) {
		// Defined in object context (this) for use by other methods
		this.output = ['<ul>'];

		this.item("Name",entity_obj['name']);
		this.item("Type",entity_obj['brew_type']);
		this.item("Address",[entity_obj['addr:housename'],',',
			entity_obj['addr:housename']].join(''));
		
		// Local cache to reduce searching
		var output = this.output;
		output.push("</ul>");

		output.push(['<p class="edit"><a href="http://www.openstreetmap.org/browse/',
			entity_obj['type'],'/',
			entity_obj['id'],
			'" target="_blank">Browse data</a></p>'].join(''));
		output.push('<p class="website"><a href="http://not.working.yet" rel="nofollow">http://not.working.yet</a></p>');
		
		return output.join('');
	}
}

function showStatistics() {
    //alert("stats="+statistics);
    for (var ln in statistics) {
	//alert("stats["+ln+"] = "+statistics[ln]);
    }
    var htmlStr = "<h2>Statistics</h2><ul>"
    jQuery('#stats').html(htmlStr);
    for (var layerName in LayerDefs) {
	//alert("stats: "+layerName+" nWay="+statistics[layerName]['nWay']);
	//alert("layerName="+layerName+": Stats="+statistics[layerName]);
	//htmlStr += "<li>"+layerName+": Nodes = "+statistics[layerName]['nNode']+"</li>";
	//htmlStr += "<li>"+layerName+": Ways  = "+statistics[layerName]['nWay']+"</li>";
    }    
    jQuery('#stats').html(htmlStr);
}


function addStatistics(layerName,dataObj) {
    //alert("addStatistics "+layerName);
    var nWay = 0;
    var nNode = 0;

    for (entity in dataObj) {
	if (entity != 'layerName') {
	    //alert("layerName="+layerName+", entity="+entity);
	    if (dataObj[entity]['type'] == 'node') { nNode++; }
	    if (dataObj[entity]['type'] == 'way') { nWay++; }
	}
    }
    statistics[layerName] = {}
    statistics[layerName]['nWay'] = nWay;
    statistics[layerName]['nNode'] = nNode;
    //alert("stats: "+layerName+" nWay="+statistics[layerName]['nWay']);
}

function editButtonCallback() {
    //alert("editButtonCallBack");
    //http://www.openstreetmap.org/edit?bbox=-2.62082%2C53.75973%2C-2.61242%2C53.76383    
    var bounds = map.getBounds();
    var swPoint = bounds.getSouthWest();
    var nePoint = bounds.getNorthEast();
    var zoom = map.getZoom();
    var url = "http://www.openstreetmap.org/edit?bbox="
	+ swPoint.lng + "%2C" + swPoint.lat + "%2C" 
	+ nePoint.lng + "%2C" + nePoint.lat
    //alert(url);
    window.open(url);
    
}

function initialise_brewmap() {
    // Set the URL of the source of data for the map (../server)
    // Thanks to http://programmingsolution.net/post/
    //          URL-Parsing-Using-JavaScript-Get-Domain-Name-Port-Number-and-Virtual-Directory-Path.aspx
    // for a pointer to getting this one working.
    var pageURL = document.location.href;
    var URLParts = pageURL.split('/');
    URLParts[URLParts.length - 2] = 'server';
    URLParts[URLParts.length - 1] = '';
    dataURL = URLParts.join('/');

    URLParts = pageURL.split('/');
    URLParts[URLParts.length - 1] = 'images';
    imageURL = URLParts.join('/');

    // Initialise the map object
    map = new L.Map('map');
    var osmURL = 'http://tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmLayer = new L.TileLayer(osmURL,{maxZoom:18});
    map.addLayer(osmLayer);
    map.setView(new L.LatLng(54.505, -2), 5);
    
    // Set up the Edit Button
    jQuery('#editButton').click(editButtonCallback);

    // Add the brewery information to the map
    load_brewmap_data();

}
