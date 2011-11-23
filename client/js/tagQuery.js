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
var dataURL;
var imageURL;
var map;
var statistics = {};


function loadTagQueryData() {
    // This loads the required file, and passes it to loadDataSuccess, along with an extra
    // argument, layerName which is the name of the Layer just loaded, so that we only need one
    // loadDataSuccess function, no matter how many files we need to load.
    jQuery.getJSON(
	dataURL+"brewmap_tagQuery.json",
	bound_loadTagQuerySuccess("tagQuery")
	);
}

function bound_loadTagQuerySuccess(layerName) {
    // This function is used by load_brewmap_data to create a callback function that
    // passes the layer name as a parameter - it is made to call loadDataSuccess().
    // 12Nov2011 Craig Loftus
    //
    return function(data) {
	loadTagQuerySuccess(data, layerName);
    };
}

/* 
 * NAME: loadTagQuerySuccess(data,statusText)
 * DESC: This function is called when a brewery datafile is successfully downloaded by the server.
 *       Download is initiated from the loadTagQueryData() function.
 *       It parses the file to create the map objects for display.
 * HIST: 13nov2011  GJ  ORIGINAL VERSION
 */
function loadTagQuerySuccess(dataObj,layerName) {
    var htmlStr = "<table><tr><th>Name</th><th>Browse</th></tr>";
    for (entity in dataObj) {
	htmlStr += "<tr>"
	    +"<td>"+ dataObj[entity]['name']+"</td>"
	    +"<td><a href='http://www.openstreetmap.org/browse/"
	    +dataObj[entity]['type']+"/"
	    +entity+"' target='_blank'>Check OSM Data</a></td> "
	    //+"<td><a active='no' href='http://www.openstreetmap.org/edit?"
	    //+dataObj[entity]['type']+"="
	    //+entity+"' target='_blank'>Edit OSM Data</a></td>"
	    +"</tr>";
	//alert("htmlStr="+htmlStr);
    }
    htmlStr += "</table>";
    jQuery("#tagQueryTable").append(htmlStr);
//alert("adding "+dataObj[entity]['name']);
}  



function initialise_tagQuery() {
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

    loadTagQueryData();

}
