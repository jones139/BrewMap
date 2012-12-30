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
//    Copyright Graham Jones & Michael Daines 2012.
//
//    Note that this code is based heavily on the debug renderer code
//    that Michael Daines produced as part of his 2012 Google Summer of Code
//    project to produce a tile data server, which is now used by BrewMap
//    (see https://github.com/mdaines/ceramic).
//
////////////////////////////////////////////////////////////////////////
var BrewMapLayer = L.TileLayer.Canvas.extend({
    
    options: {},
    
    initialize: function(url, options) {
	L.Util.setOptions(this, options);
	this._url = url;
    },
  
    drawTile: function(canvas, tilePoint, zoom) {
	
	var layer = this;
	
	// draw "loading" overlay
  
	var context = canvas.getContext("2d");
	
	context.fillStyle = "rgba(255, 255, 255, 0.5)";
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	// load the tile
	var url = this._url.replace("{x}", tilePoint.x).
            replace("{y}", tilePoint.y).
            replace("{z}", zoom);
		
	jQuery.ajax({
	    'url':url,
	    dataType:"jsonp",
	    jsonpCallback:"tileDidLoad",
	    success: function(data) {
		alert("data="+data);
		var tile = tileDidLoad;
		alert("tile="+tile);
		if (typeof tile.crs === "undefined")
		    BrewMapLayer.projectTile(tile, tilePoint, zoom, 
					     layer.options.tileSize);
		BrewMapRender.renderTile(canvas, tile);
	    }
	});
	
    }
    
});

BrewMapLayer.EXTENT = 2 * Math.PI * 6378137;
BrewMapLayer.ORIGIN = -(BrewMapLayer.EXTENT / 2.0);

BrewMapLayer.projectTile = function(tile, tilePoint, zoom, tileSize) {
    alert("BrewMapLayer.projectTile()");
  tile.scale = tileSize;
  
  // find the tile's left and top in spherical mercator
  
  var scale = Math.pow(2, zoom);
  var size = this.EXTENT / scale;
  var left = this.ORIGIN + (tilePoint.x * size);
  var top = this.ORIGIN + ((scale - tilePoint.y) * size) - size;
  
  function projectPoint(coordinates) {
    
    var point = L.CRS.EPSG3857.project(new L.LatLng(coordinates[1], coordinates[0]));
    
    coordinates[0] = ((point.x - left) / size) * tile.scale;
    coordinates[1] = tile.scale - (((point.y - top) / size) * tile.scale);
    
  }
  
  function projectCoordinates(coordinates, dimension) {
    
    var i;
    
    if (dimension === 1) {
      projectPoint(coordinates);
    } else {
      for (i = 0; i < coordinates.length; i++)
        projectCoordinates(coordinates[i], dimension - 1);
    }
    
  }
  
  function projectGeometry(geometry) {
    
    var i;
    
    switch (geometry.type) {
      case "Point":
        projectCoordinates(geometry.coordinates, 1);
        break;
      case "MultiPoint":
      case "LineString":
        projectCoordinates(geometry.coordinates, 2);
        break;
      case "MultiLineString":
      case "Polygon":
        projectCoordinates(geometry.coordinates, 3);
        break;
      case "MultiPolygon":
        projectCoordinates(geometry.coordinates, 4);
        break;
      case "FeatureCollection":
        for (i = 0; i < geometry.geometries.length; i++)
          projectGeometry(geometry.geometries[i]);
        break;
    }
    
  }
  
  
  var i = 0;
  
  for (i = 0; i < tile.features.length; i++)
    projectGeometry(tile.features[i].geometry);

}
