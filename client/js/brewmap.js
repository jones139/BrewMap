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

$(document).ready(function(){
          initialise_brewmap();
});


function makeIcons() {
    // Create Leaflet Icons using the images specified in layerDefs.
    // The icon objects are added to layerDefs.
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
	    popupAnchor: new L.Point(0,0)
	    });
	layers[layerName]['icon'] = new iconType();
    }
}


//function loadConfigFile() {
//    jQuery.getJSON(
//	dataURL+configFname,
//	loadConfigSuccess
//    );
//}

function loadConfigSuccess(dataObj) {
    // Parses the downloaded configuration file object
    // and loads its content into global variables for use by other
    // functions.
    // HIST:
    //      16nov2011  GJ  ORIGINAL VERSION
    //alert("loadConfigSuccess - dataObj="+dataObj);
    layerDefs = dataObj;
    setup_map_page();
    load_brewmap_data();
}

function setup_map_page() {
    // Use data from the configuration file (stored in the layerDefs
    // Global Variable to set up the main map page.
    // HIST:
    //       05feb2011  GJ  ORIGINAL VERSION
    var defaultBaseMap;
    var baseMap;
    var baseMapsObj;
    var baseMapURL;

    jQuery("#title").html(layerDefs['layerGroups'][layerGroup].title);
    jQuery("#introDiv").html(layerDefs['layerGroups'][layerGroup].intro_text);
    jQuery("#tagQuery_note").html(layerDefs['layerGroups'][layerGroup].tagQuery_note);
    jQuery("#gh_issues_href").attr('href',layerDefs['layerGroups'][layerGroup].github_page + "/issues");
    jQuery("#gh_page_href").attr('href',layerDefs['layerGroups'][layerGroup].github_page);
    jQuery("#contact_email").html(layerDefs['layerGroups'][layerGroup].contact_email);

    baseMapsObj = {};
    for (baseMap in layerDefs['layerGroups'][layerGroup]['baseMaps']) {
	baseMapURL = layerDefs['layerGroups'][layerGroup]['baseMaps'][baseMap];
	baseMapsObj[baseMap] = new L.TileLayer(baseMapURL,{maxZoom:18})
	//alert("baseMap="+baseMap+" baseMapURL="+baseMapURL);
    } 

    // Initialise the map object
    map = new L.Map('map');

    // Show the default, other maps get set via the user selection
    for (defaultBaseMap in baseMapsObj) break;  //find first base map.
    map.addLayer(baseMapsObj[defaultBaseMap]);

    var layersControl = new L.Control.Layers(baseMapsObj);
    map.addControl(layersControl);

    map.setView(new L.LatLng(lat,lon), zoom);
    map.addEventListener('moveend',updatePermaLink);
    map.addEventListener('zoomend',updatePermaLink);
    
    // Set up the Edit Button
    jQuery('#editButton').click(editButtonCallback);


    // Sort out the icon.
    jQuery('#favicon').remove();
    $('head').append('<link href="'+
		     layerDefs['layerGroups'][layerGroup].icon+
		     '" id="favicon" rel="shortcut icon">');


}

function load_brewmap_data() {
    // Parses the configuration file (stored in layerDefs global variable
    // and downloads the data files specified in the configuration file.
    // HIST:
    //      16nov2011 GJ ORIGINAL VERSION
    makeIcons();

    var layers = layerDefs['layerGroups'][layerGroup].layers;
    var i = 0;
    for (var layerName in layers) {
	i = i+1;
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
    stats.count = i;
    keys.count = i;
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

var brewmap = {
	map_layer: {},
	local_map: map,
	toggle: function(layer_label) {
		var layer = this.map_layer[layer_label];
		if(layer === undefined) {
			throw "Layer not defined";
		}

		if(layer.brewmap === true) {
			map.removeLayer(layer);
			layer.brewmap = false;
		}
		else {
			map.addLayer(layer);
			layer.brewmap = true;
		}
	}
};

/* 
 * NAME: loadDataSuccess(data,statusText)
 * DESC: This function is called when a brewery datafile is successfully 
 *       downloaded by the server.
 *       Download is initiated from the load_brewmap_data() function.
 *       It parses the file to create the map objects for display.
 * HIST: 12Nov2011  GJ  ORIGINAL VERSION
 * 	 15Nov2011 Craig Loftus Moved pop-up content out
 * 	 25Nov2011 Craig Loftus Moved stats counting in
 */
function loadDataSuccess(dataObj,layer_name) {

	var layer = layerDefs['layerGroups'][layerGroup].layers[layer_name];
	var layer_label = layer.label, layer_icon = layer.icon;
	var nNode=0, nWay=0;

	var group = new L.LayerGroup();
 
	for (entity in dataObj) {
		// Local cache to reduce searching
		var entity_obj = dataObj[entity];
		// Storing id in object for use in pop-up
		entity_obj.brew_type = layer_label;

		var posN = new L.LatLng(entity_obj.point.lat,
			entity_obj.point.lng);

		var marker = new L.Marker(posN, {icon: layer_icon});

		marker.brewmap = entity_obj;

		marker.bindPopup(popup.content(entity_obj));
		marker.on('click', function(e) {
			address.target = e.target;
			var data = e.target.brewmap;
			address.search(data);
		});
		group.addLayer(marker);

		if(entity_obj.type === 'node') {
			nNode = nNode+1;
		}
		else if(entity_obj.type ==='way') {
			nWay = nWay+1;
		}
	}

	brewmap.map_layer[layer_label] = group;
	map.addLayer(group);
	group.brewmap = true;

	stats.save(layer_label,nNode,nWay);
	keys.save(layer_label,layer.iconImg);
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
		entity_obj.type,'/',
		entity_obj.osm_id,
		'" target="_blank">',
		entity_obj.osm_id,'</a></p>'].join(''));

	output.push('</div>');

	return output.join('');
    }
};

// TODO create a parent for the keys and stats objects
// TODO generate() should probably be triggered by an event
var keys = {
	// Locate in DOM the place to add the fragment
	container: $('#key table'),
	// Create the fragment to store rows in
	fragment: document.createDocumentFragment(),
	// Container for counts,
	data: [],
	save: function(layer_name, icon_img) {
		this.data.push({'name':layer_name,'icon_img':icon_img});
		this.decrement();
	},
	decrement: function() {
		this.count = this.count-1;
		if(this.count < 1) {
			this.generate();
		}
	},
	make_row: function(layer) {
		// Create the new row element
		var row = document.createElement('tr');
		// Set the content of the row
		row.innerHTML = ['<td>',layer.name,'</td><td>',
				'<img src="images/', layer.icon_img,
				'" style="width:24px;" /></td>'].join('');

		$(row).on('click',function(e) { 
			brewmap.toggle(layer.name);
			$(row).toggleClass('hidden');
		});

		// Store the row
		this.fragment.appendChild(row);		
	},
	generate: function() {
		var data = this.data;
		for(var i=data.length; i--;) {
			this.make_row(data[i]);
		}
		this.display();
	},
	// Add the fragment to the DOM
	display: function() {
		this.container.append(this.fragment);
	}
}

var stats = {
	// Locate in DOM the place to add the fragment
	container: $('#stats table tbody'),
	// Create the fragment to store rows in
	fragment: document.createDocumentFragment(),
	// Container for counts,
	data: [],
	save: function(layer_name, nNode, nWay) {
		this.data.push({'name':layer_name,'nodes':nNode,'ways':nWay});
		this.decrement();
	},
	decrement: function() {
		this.count = this.count-1;
		if(this.count < 1) {
			this.generate();
		}
	},
	make_row: function(layer) {
		// Create the new row element
		var row = document.createElement('tr');
		// Set the content of the row
		row.innerHTML = ['<td>', layer.name, '</td><td>', layer.nodes,
				'</td><td>', layer.ways, '</td><td>', 
				layer.nodes+layer.ways, '</td>'].join('');
		// Store the row
		this.fragment.appendChild(row);		
	},
	// Make the rows
	generate: function() {
		var data = this.data;
		for(var i=data.length; i--;) {
			this.make_row(data[i]);
		}
		this.display();
	},
	// Add the fragment to the DOM
	display: function() {
		this.container.append(this.fragment);
	}
};

function editButtonCallback() {
    var bounds = map.getBounds();
    var swPoint = bounds.getSouthWest();
    var nePoint = bounds.getNorthEast();
    var zoom = map.getZoom();
    var url = ["http://www.openstreetmap.org/edit?bbox=",
	swPoint.lng, "%2C", swPoint.lat, "%2C" 
	, nePoint.lng, "%2C", nePoint.lat].join('');
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
    var hrefURL = [pageURL, '?lon=', curLon, '&lat=', curLat, '&z=',
        curZoom].join('');
    jQuery('#permaLink').attr('href',hrefURL); 
}

var address = {
	url: 'http://open.mapquestapi.com/nominatim/v1/reverse?',
	data: {},
	search: function (entity_data) {
		this.osm_id = entity_data.osm_id;
		this.type = entity_data.type;
		this.osm = entity_data;

		this.marked = {};
		this.merged = {};
		this.nominatim = {};

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
				throw "Failed to match entity type";
				return;
		}
		this.query = [this.url,'osm_id=',this.osm_id,'&osm_type=',
				type_char,'&format=json&json_callback=?'].join('');
		console.info(this.query);
	},
	// Check for data that needs to be merged
	// Trying to use names consistent with addr:*
	process: function() {
		var osm = this.osm;
		var nominatim = this.nominatim;
		var marked = this.marked;
		var merged = {'housenumber': osm['addr:housenumber'],
				'street': osm['addr:street'],
				'postcode': osm['addr:postcode'],
				'city': osm['addr:city']};

		if(nominatim === undefined) {
			console.warn('No Nominatim data, so not merging',address.process);
			
			this.merged = merged;
			this.marked = marked;
			return false;	
		}

		if(nominatim.house_number !== undefined &&
		merged.housenumber === undefined) {
			merged.housenumber = nominatim.house_number;
			marked.housenumber = true;
		}
		if(nominatim.road !== undefined &&
		merged.street === undefined) {
			merged.street = nominatim.road;
			marked.street = true;
		}
		if(nominatim.town !== undefined &&
		merged.city === undefined) {
			merged.city = nominatim.town;
			marked.city = true;
		}
		else if(nominatim.city !== undefined &&
		merged.city === undefined) {
			merged.city = nominatim.city;
			marked.city = true;
		}

		if(nominatim.postcode !== undefined &&
		merged.postcode === undefined) {
			merged.postcode = nominatim.postcode;
			marked.postcode = true;
		}

		if(nominatim.suburb !== undefined) {
			merged.suburb = nominatim.suburb;
			marked.suburb = true;
		}

		if(nominatim.county !== undefined) {
			merged.county = nominatim.county;
			marked.county = true;
		}
		
		this.merged = merged;
		this.marked = marked;
	},
	add: function() {
		this.process();

		var merged = this.merged;
		var marked = this.marked;

		var to_add = [[merged.suburb,marked.suburb], [merged.city,marked.city], [merged.county,marked.county],[merged.postcode,marked.postcode]];
		var to_add_len = to_add.length;
		var bits = [];

		// Merge house number and street together where appropriate
		if(merged.housenumber !== undefined &&
		merged.street !== undefined) {
			bits.push([merged.housenumber,' ',merged.street].join(''));
		}
		else if(merged.street !== undefined) {
			var street_value = merged.street;
			if(marked.street === true) {
				street_value = ['<span class="marked">',street_value,'</span>'].join('');
			}
			bits.push(street_value);
		}
		else if(merged.housenumber !== undefined) {
			var house_value = merged.housenumber;
			if(marked.housenumber === true) {
				house_value = ['<span class="marked">',house_value,'</span>'].join('');
			}
			bits.push(house_value);
		}

		// Loop through address data adding to bits
		for(var i=0; i<to_add_len; i++) {
			var to_add_i = to_add[i];
			if(to_add_i[0] !== undefined) {
				var value = to_add_i[0];
				if(to_add_i[1] === true) {
					value = ['<span class="marked">',value,'</span>'].join('');
				}
				bits.push(value);
			}
		}

		$(this.target._popup._contentNode).find('div.address')
			.html(bits.join(',<br />'));
	},
	get: function() {
		var data = jQuery.getJSON(this.query, function(data) {
			// Nominatim will set the error property
			if(data.error !== undefined) {
				console.warn(data.error,address.get);
				address.nominatim = undefined;
			}
			else {
				address.nominatim = data.address;
			}
			address.add();
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


    // Add the icons to the map as defined in the configuration file
    // in global variable configFname, using layer group layerGroup
    jQuery.getJSON(
	dataURL+configFname,
	loadConfigSuccess
    );
}
