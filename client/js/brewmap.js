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
var industryObj;
//var dataURL = "http://maps.webhop.net/BrewMap/server/";
var dataURL;
var imageURL;
var map

var LayerDefs = {
    "brewmap_industry": {
	"dataFile": "brewmap_industry.json",
	"iconImg": "factory.png"
    },
    "brewmap_craft": {
	"dataFile": "brewmap_craft.json",
	"iconImg": "house.png"
    },

    "brewmap_microbrewery": {
	"dataFile": "brewmap_microbrewery.json",
	"iconImg": "drink.png"
    }

};

function makeIcons() {
// Create Leaflet Icons using the images specified in LayerDefs.
// The icon objects are added to LayrDefs.
    for (var layerName in LayerDefs) {
	var iconURL = imageURL + "/" + LayerDefs[layerName]['iconImg']
	var iconType = L.Icon.extend({
	    iconUrl: iconURL,
	    shadowUrl: iconURL,
	    iconSize: new L.Point(16,16),
	    shadowSize: new L.Point(16,16),
	    iconAnchor: new L.Point(8,8),
	    popupAnchor: new L.Point(8,16)
	});
	LayerDefs[layerName]['icon'] = new iconType()
    }
}

function load_brewmap_data() {
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
}

function bound_loadDataSuccess(layerName) {
	return function(data) {
		loadDataSuccess(data, layerName);
	};
}

/* 
 * NAME: loadDataSuccess(data,statusText)
 * DESC: This function is called when a brewery datafile is successfully downloaded by the server.
 *       Download is initiated from the load_brewmap_data() function.
 *       It parses the file to create the map objects for display.
 * HIST: 12nov2011  GJ  ORIGINAL VERSION
 */
function loadDataSuccess(dataObj,layerName) {
    
    //alert('Loaded layer '+layerName);

    for (entity in dataObj) {
	if (entity != 'layerName') {
	    var posN = new L.LatLng(dataObj[entity]['point']['lat'],
				   dataObj[entity]['point']['lng']);
	    var brewType = 'microbrewery';
	    var markerFillColour = 'yellow';
	    if (dataObj[entity]['industry']=="brewery") {
		brewType = 'industrial';
		markerFillColour = 'blue';
	    }
	    if (dataObj[entity]['craft']=="brewery") {
		brewType = 'craft';
		markerFillColour = 'green';
	    }
	    //var marker = new L.Marker(posN);
	    //var marker = new L.CircleMarker(posN,
	    //				    {color:markerFillColour,
	    //				     fillColor:markerFillColour,
	    //				     fillOpacity:0.5});
	    var marker = new L.Marker(posN, {icon: LayerDefs[layerName]['icon']});
	    marker.bindPopup("<ul>"
			     +"<li>"+dataObj[entity]['name']+"</li>"
			     +"<li>"+brewType+"</li>"
			     +"<li>"+"<a href='http://www.openstreetmap.org/browse/"+
			     dataObj[entity]['type']+"/"+
			     entity+"' target='_blank'>browse</a></li>"
			     +"<li>Address:"+dataObj[entity]['addr:housename']+","
			     +dataObj[entity]['addr:housename']+"</li>"
			     +"</ul>");
	    map.addLayer(marker);
	    //alert("adding "+dataObj[entity]['name']);
	} 
	  
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

    // Initialise the map object
    map = new L.Map('map');
    var osmURL = 'http://tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmLayer = new L.TileLayer(osmURL,{maxZoom:18});
    map.addLayer(osmLayer);
    map.setView(new L.LatLng(54.505, -2), 5);
    

    // Add the brewery information to the map
    makeIcons();
    load_brewmap_data();

}
