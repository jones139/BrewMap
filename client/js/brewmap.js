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
// Note: these may be overriden by values specified as GET parameters.
// lat,lon and zoom are only global so that they appear at the top of the
// file to make the default values easy to change.
var lat = 54.505;                  // Initial latitude of centre of map.
var lon = -2.0;                    // Initial longitude of centre of map.
var zoom = 5;                      // Initial zoom level.
var configFname = "BrewMap.cfg";   // Configuration file to use.
var layerGroup = "BrewMap";        // The layerGroup to draw.
//
// Other Global Variables
var dataURL;               // the base url to be used for map data downloads.
var imageURL;              // the base url to be used for images.
var map;                   // the map object
var layerDefs = {};        // the icon layer definitions from the config. file.


function makeIcons() {
    // Create Leaflet Icons using the images specified in layerDefs.
    // The icon objects are added to LayrDefs.
    var layers, layerName, iconURL, iconType;
    layers = layerDefs['layerGroups'][layerGroup].layers;
    for (layerName in layers) {
	//alert("layerName="+layerName);
	iconURL = imageURL + "/" + layers[layerName]['iconImg'];
	iconType = L.Icon.extend({
		iconUrl: iconURL,
		shadowUrl: iconURL,
		iconSize: new L.Point(16,16),
		shadowSize: new L.Point(16,16),
		iconAnchor: new L.Point(8,8),
		popupAnchor: new L.Point(8,24)
	    });
	layers[layerName]['icon'] = new iconType();
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
    //alert("loadConfigSuccess - dataObj="+dataObj);
    layerDefs = dataObj;
    load_brewmap_data();
}

function load_brewmap_data() {
    makeIcons();

    var layers = layerDefs['layerGroups'][layerGroup].layers;
    for (var layerName in layers) {
	//alert("Loading Layer "+layerName+", "+typeof(layerName));
	// This loads the required file, and passes it to 
	// loadDataSuccess, along with an extra
	// argument, layerName which is the name of the Layer 
	// just loaded, so that we only need one
	// loadDataSuccess function, no matter how many files we need to load.
	jQuery.getJSON(
	    dataURL+layers[layerName]['dataFile'],
	    bound_loadDataSuccess(layerName)
	);
    }
}

function bound_loadDataSuccess(layerName) {
    // This function is used by load_brewmap_data to create a
    // callback function that
    // passes the layer name as a parameter - it is made to call 
    // loadDataSuccess().
    // 12Nov2011 Craig Loftus
    //
    return function(data) {
	loadDataSuccess(data, layerName);
    };
}

/* 
 * NAME: loadDataSuccess(data,statusText)
 * DESC: This function is called when a brewery datafile is successfully 
 *       downloaded by the server.
 *       Download is initiated from the load_brewmap_data() function.
 *       It parses the file to create the map objects for display.
 * HIST: 12Nov2011  GJ  ORIGINAL VERSION
 * 	 15Nov2011 Craig Loftus Moved pop-up content out
 */
function loadDataSuccess(dataObj,layerName) {

    var layer = layerDefs['layerGroups'][layerGroup].layers[layerName];
    
    for (entity in dataObj) {
	if (entity != 'layerName') {

	    // Local cache to reduce searching
	    var entity_obj = dataObj[entity];
	    // Storing id in object for use in pop-up
	    entity_obj.id = entity;
	    entity_obj.brew_type = layer['label'];
	    
	    var posN = new L.LatLng(entity_obj['point']['lat'],
				   entity_obj['point']['lng']);

	    var marker = new L.Marker(posN, {icon: layer['icon']});

	    marker.brewmap = {};
	    marker.brewmap.osm_id = entity_obj['osm_id'];
	    marker.brewmap.type = entity_obj['type'];

	    marker.bindPopup(popup.content(entity_obj));
	    marker.on('click', function(e) {
		address.target = e.target;
		var data = e.target.brewmap;
		address.search(data.osm_id, data.type);
	    });
	    map.addLayer(marker);
	
	} 
    }
    addStatistics(layer['label'],dataObj);
    addKey(layer['label'],layer['iconImg']);
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
	 *       20nov2011 Graham Jones - got website working after database
	 *                                update.
	 */
    content: function(entity_obj) {
	// Defined in object context (this) for use by other methods

	this.output = [];
	var output = this.output;
	
	output = ['<div class="details"><h3>',entity_obj.name,'</h3>'];	

	output.push('<div class="address">');

	output.push('</div>');

	output.push('<strong>Type: </strong>',entity_obj['brew_type']);

	var website = false;
	if(entity_obj.website !== undefined)
	{
		website = entity_obj.website;
	}
	else if(entity_obj.url !== undefined)
	{
		website = entity_obj.url;
	}
	if(website !== false) {
		output.push(['<p class="website"><a href=\"',website,
		'\" target=\"_blank\">',website,'</a></p>'].join(''));
	}

	output.push(['<p class="edit">#<a href="http://www.openstreetmap.org/browse/',
		entity_obj['type'],'/',
		entity_obj['id'],
		'" target="_blank">',
		entity_obj['id'],'</a></p>'].join(''));

	output.push('</div>');

	return output.join('');
    }
};


function addKey(layerName,iconImg) {
    $('#key table').append(
			   [
			    '<tr><td>',
			    layerName,
			    '</td><td>',
			    '<img src=\"images/',iconImg,'\" width=24>',
			    '</td></tr>'].join(''));
}

function updateStatistics(layerName, layerStats) {
	// Using append to progressively add to existing content
	$('#stats table').append(["<tr><td>", layerName, "</td><td>",
				  layerStats.nNode, "</td><td>",layerStats.nWay, "</td>",
				  "<td>",layerStats.nNode+layerStats.nWay,
				  "</td></tr>"].join(''));
}

function addStatistics(layerName,dataObj) {
    var layerStatistics = {};
    var nWay = 0;
    var nNode = 0;

    for (entity in dataObj) {
	if (entity != 'layerName') {
	    if (dataObj[entity].type === 'node') {
	        nNode=nNode+1;
	    }
	    if (dataObj[entity].type === 'way') {
	        nWay=nWay+1;
	    }
	}
    }

    layerStatistics.nWay = nWay;
    layerStatistics.nNode = nNode;

    // Calling update to add new stats for this layer
    updateStatistics(layerName, layerStatistics);
}

function editButtonCallback() {
    var bounds = map.getBounds();
    var swPoint = bounds.getSouthWest();
    var nePoint = bounds.getNorthEast();
    var zoom = map.getZoom();
    var url = "http://www.openstreetmap.org/edit?bbox="
	+ swPoint.lng + "%2C" + swPoint.lat + "%2C" 
	+ nePoint.lng + "%2C" + nePoint.lat
    window.open(url);
    
}

function updatePermaLink() {
    // update the permalink on the main map page based on the current map
    // state.
    var centrePt = map.getCenter();
    var curLat = centrePt.lat;
    var curLon = centrePt.lng;
    var curZoom = map.getZoom();
    var pageURL = document.location.href.split('?')[0];
    var hrefURL = pageURL + '?lon='+curLon+'&lat='+curLat+'&z='+curZoom;
    jQuery('#permaLink').attr('href',hrefURL);
    
}

var address = {
	url: 'http://open.mapquestapi.com/nominatim/v1/reverse?',
	search: function (id, type) {
		this.id = id;
		this.type = type;
		this.make_query();
		this.get();
	},
	make_query: function () {
		var type_char;
		switch (this.type) {
			case 'node':
				type_char = 'N';
				break;
			case 'way':
				type_char = 'W';
				break;
			default:
				console.log(type_char)
				throw "Failed to match entity type";
				return;
		}
		this.query = [this.url,'osm_id=',this.id,'&osm_type=',
				type_char,'&format=json&json_callback=?'].join('');
		console.log(this.query);
	},
	add: function(data) {
		var name_arr = data.display_name.split(',');
		var first_bits_arr = name_arr.slice(1,4);
	
		console.log(data);
	
		// Check for postcode
		if(data.address.postcode !== undefined) {
			first_bits_arr.push(data.address.postcode);
		}
		if(data.address.house_number !== undefined) {
			if(data.address.house_number === first_bits_arr[0].trim()) {
				var joined_num_and_st = first_bits_arr.splice(0,2).join(' ');
				first_bits_arr.unshift(joined_num_and_st);
			}
		}

		$(this.target._popup._contentNode).find('div.address')
			.html(first_bits_arr.join(',<br />'));
	},
	get: function() {
		var data = jQuery.getJSON(this.query, function(data) {
			// Nominatim will set the error property
			if(data.error !== undefined) {
				console.log(data.error);
				return false;
			}
			address.add(data);		
		});
	}	
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


    //Now read any GET variariables from the URL (to use for permalinks etc.)
    //These are used to set up the initial state of the map.
    var urlVars = getUrlVars();
    if ('lat' in urlVars) {
	lat = parseFloat(urlVars['lat']);
    } 
    if ('lon' in urlVars) {
	lon = parseFloat(urlVars['lon']);
    } 
    if ('z' in urlVars) {
	zoom = parseFloat(urlVars['z']);
    } 
    if ('layerGroup' in urlVars) {
	layerGroup = parseFloat(urlVars['layerGroup']);
    } 
    if ('configFname' in urlVars) {
	configFname = parseFloat(urlVars['configFname']);
    } 

    //alert("Initial Map Position is ("+lon+","+lat+"), z="+zoom);

    // Initialise the map object
    map = new L.Map('map');
    var osmURL = 'http://tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmLayer = new L.TileLayer(osmURL,{maxZoom:18});
    map.addLayer(osmLayer);
    map.setView(new L.LatLng(lat,lon), zoom);
    map.addEventListener('moveend',updatePermaLink);
    map.addEventListener('zoomend',updatePermaLink);
    
    // Set up the Edit Button
    jQuery('#editButton').click(editButtonCallback);

    // Add the icons to the map as defined in the configuration file
    // in global variable configFname, using layer group layerGroup
    loadConfigFile();
}
