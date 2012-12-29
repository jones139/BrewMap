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
var BrewMapRender = {
  
  renderPoint: function(context, coordinates, hue, scale) {

    context.beginPath();

    context.arc(coordinates[0], coordinates[1], 3 / scale, 0, Math.PI * 2);

    context.fillStyle = "hsla(" + hue + ", 100%, 50%, 0.8)";
    context.fill();

  },

  renderLineString: function(context, coordinates, hue, scale) {

    var i;

    // draw the line

    context.beginPath();

    context.moveTo(coordinates[0][0], coordinates[0][1]);

    for (i = 1; i < coordinates.length; i++) {
      context.lineTo(coordinates[i][0], coordinates[i][1]);
    }

    context.strokeStyle = "hsla(" + hue + ", 90%, 50%, 0.5)";
    context.stroke();

    // draw points

    context.beginPath();

    for (i = 0; i < coordinates.length; i++) {
      context.moveTo(coordinates[i][0] + 2 / scale, coordinates[i][1])
      context.arc(coordinates[i][0], coordinates[i][1], 1 / scale, 0, Math.PI * 2);
    }

    context.fillStyle = "#f00";
    context.fill();

  },

  renderMultiLineString: function(context, coordinates, hue, scale) {

    var i;

    for (i = 0; i < coordinates.length; i++)
      this.renderLineString(context, coordinates[i], hue, scale);

  },

  renderPolygon: function(context, coordinates, hue, scale) {

    var i, j, k;

    // draw shape

    context.beginPath();

    for (i = 0; i < coordinates.length; i++) {

      context.moveTo(coordinates[i][0][0], coordinates[i][0][1]);

      for (j = 0; j < coordinates[i].length; j++)
        context.lineTo(coordinates[i][j][0], coordinates[i][j][1]);

    }

    context.fillStyle = "hsla(" + hue + ", 90%, 50%, 0.4)";
    context.fill();

    context.strokeStyle = "hsla(" + hue + ", 90%, 50%, 0.5)";
    context.stroke();

    // draw points

    context.beginPath();

    for (i = 0; i < coordinates.length; i++) {

      for (j = 0; j < coordinates[i].length; j++) {
        context.moveTo(coordinates[i][j][0] + 2 / scale, coordinates[i][j][1])
        context.arc(coordinates[i][j][0], coordinates[i][j][1], 1 / scale, 0, Math.PI * 2);
      }

    }

    context.fillStyle = "#f00";
    context.fill();

  },

  renderMultiPolygon: function(context, coordinates, hue, scale) {
    
    var i;

    for (i = 0; i < coordinates.length; i++)
      this.renderPolygon(context, coordinates[i], hue, scale);

  },
  
  renderGeometry: function(context, geometry, hue, scale) {
    
    var i;
    
    if (geometry.type === "Point")
      this.renderPoint(context, geometry.coordinates, hue, scale);
    else if (geometry.type === "LineString")
      this.renderLineString(context, geometry.coordinates, hue, scale);
    else if (geometry.type === "MultiLineString")
      this.renderMultiLineString(context, geometry.coordinates, hue, scale);
    else if (geometry.type === "Polygon")
      this.renderPolygon(context, geometry.coordinates, hue, scale);
    else if (geometry.type === "MultiPolygon")
      this.renderMultiPolygon(context, geometry.coordinates, hue, scale);
    else if (geometry.type === "GeometryCollection") {
      for (i = 0; i < geometry.geometries.length; i++)
        this.renderGeometry(context, geometry.geometries[i], hue, scale);
    }
    
  },

  /////////////////////////////////////////////////////////////////////
  // NAME: renderTile(canvas,tile,options)
  // DESC: Render a data tile 'tile' to the graphic canvas 'canvas'.
  //       options is an array which can contain the following values
  //         { 'inset': <what does this do?> }
  // 
  renderTile: function(canvas, tile, options) {
    
    var context = canvas.getContext("2d");
    var inset = (options && options["inset"]) ? options["inset"] : 0;
    var scale = (canvas.width - inset * 2) / tile.scale;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw an outline around the tile

    context.lineWidth = 1;

    context.strokeStyle = "rgba(255, 255, 255, 0.5)";
    context.strokeRect(0.5, 0.5, canvas.width, canvas.height);

    // Set scale for features

    context.save();
    context.translate(inset, inset);
    context.scale(scale, scale);

    context.lineWidth = 2 / scale;

    // Iterate over features
    
    var i;

    for (i = 0; i < tile.features.length; i++) {
      
      var feature = tile.features[i];
      var hue;

      if (typeof feature.id === "undefined")
        hue = 45;
      else
        hue = feature.id;
        
      this.renderGeometry(context, feature.geometry, hue, scale);

    }

    context.restore();

  }
  
}
