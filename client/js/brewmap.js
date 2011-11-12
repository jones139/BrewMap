
// Define Global Variables
var industryObj;
var dataURL = "http://maps.webhop.net/BrewMap/server/";
var map

var LayerDefs = {
    "brewery_industry": {
	"dataFile": "brewmap_industry.json"
    },
    "brewery_craft": {
	"dataFile": "brewmap_craft.json"
    },

    "microbrewery": {
	"dataFile": "brewmap_microbrewery.json"
    }

};

function load_brewmap_data() {
    for (var layerName in LayerDefs) {
	//alert("Loading Layer "+layerName+", "+typeof(layerName));
	// This loads the required file, and passes it to loadDataSuccess, along with an extra
	// argument, layerName which is the name of the Layer just loaded, so that we only need one
	// loadDataSuccess function, no matter how many files we need to load.
	jQuery.getJSON(
	    dataURL+LayerDefs[layerName]['dataFile'],
	    loadDataSuccess
	);
    }
}

/* 
 * NAME: loadDataSuccess(data,statusText)
 * DESC: This function is called when a brewery datafile is successfully downloaded by the server.
 *       Download is initiated from the load_brewmap_data() function.
 *       It parses the file to create the map objects for display.
 * HIST: 12nov2011  GJ  ORIGINAL VERSION
 */
function loadDataSuccess(dataObj,statusText) {

    var layerName = dataObj['layerName'];
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
	    var marker = new L.CircleMarker(posN,
					    {color:markerFillColour,
					     fillColor:markerFillColour,
					     fillOpacity:0.5});
	    marker.bindPopup("<ul>"
			     +"<li>"+dataObj[entity]['name']+"</li>"
			     +"<li>"+brewType+"</li>"
			     +"<li>"+"<a href='http://www.openstreetmap.org/browse/"+
			     dataObj[entity]['type']+"/"+
			     entity+"'>browse</a></li>"
			     +"</ul>");
	    map.addLayer(marker);
	    //alert("adding "+dataObj[entity]['name']);
	} 
	  
    }
}


function initialise_brewmap() {
    //var dataURL = "file:///home/disk2/OSM/Maps/BrewMap/server";    
    map = new L.Map('map');
    var osmURL = 'http://tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmLayer = new L.TileLayer(osmURL,{maxZoom:18});
    map.addLayer(osmLayer);
    
    map.setView(new L.LatLng(54.505, -2), 5);
    
    load_brewmap_data();

}
