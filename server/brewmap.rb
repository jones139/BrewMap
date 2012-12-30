#    This file is part of BrewMap - a program to produce web maps
#    of uk breweries.
#
#    BrewMap is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    BrewMap is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with BrewMap.  If not, see <http://www.gnu.org/licenses/>.
#
#    Copyright Graham Jones 2012.
#
########################################################################
#
# This file is the configuration file for the data tile generator programme
# 'ceramic' by Michael Daines (https://github.com/mdaines/ceramic.git).
# It allows data tiles containing the required points of interest
# to be generated using:
#    ceramic expand --zoom 10 -- -8.2,49.3,2.2,61.1 | ceramic render brewmap.rb --callback tileDidLoad --path ./tiles/%z/%x/%y.json
# The above will generate a set of tiles at zoom level 10.



coordinates :latlon

source :postgis, :connection_info => { :dbname => "osmgb" } do

###########################################################################
# Industrial Breweries
  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'brewery_industrial' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_point
  WHERE industrial ilike('%brewery%') and (disused is null or disused != 'yes')
) AS points
SQL

  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'brewery_industrial' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_polygon
  WHERE industrial ilike('%brewery%') and (disused is null or disused != 'yes')
) AS centers
SQL

############################################################################
# Craft Breweries
  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'brewery_craft' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_point
  WHERE craft ilike('%brewery%') and (disused is null or disused != 'yes')
) AS points
SQL

  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'brewery_craft' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_polygon
  WHERE craft ilike('%brewery%') and (disused is null or disused != 'yes')
) AS centers
SQL

############################################################################
# Micro Breweries
  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'microbrewery' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_point
  WHERE (microbrewery is not null and microbrewery!='no') and (disused is null or disused != 'yes')
) AS points
SQL

  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'microbrewery' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_polygon
  WHERE (microbrewery is not null and microbrewery!='no') and (disused is null or disused != 'yes')
) AS centers
SQL

############################################################################
# Wineries
  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'winery' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_point
  WHERE (landuse ilike('%winery%') or craft ilike('%winery%') or industrial ilike('%winery%')) and (disused is null or disused != 'yes')
) AS points
SQL

  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'winery' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_polygon
  WHERE (landuse ilike('%winery%') or craft ilike('%winery%') or industrial ilike('%winery%')) and (disused is null or disused != 'yes')
) AS centers
SQL

############################################################################
# Distilleries
  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'distillery' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_point
  WHERE (landuse ilike('%distillery%') or craft ilike('%distillery%') or industrial ilike('%distillery%')) and (disused is null or disused != 'yes')
) AS points
SQL

  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'distillery' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_polygon
  WHERE (landuse ilike('%distillery%') or craft ilike('%distillery%') or industrial ilike('%distillery%')) and (disused is null or disused != 'yes')
) AS centers
SQL

############################################################################
# Cider/Perry
  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'cider/perry' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_point
  WHERE (craft ilike('%cider%') or craft ilike('%perry%') or industrial ilike('%cider%') or industrial ilike('%perry%')) and (disused is null or disused != 'yes')
) AS points
SQL

  table <<-SQL, :geometry_column => "way", :geometry_srid => 900913, :zoom => "1-"
(
  SELECT osm_id, 'cider/perry' as brewmap_type, name, amenity, website, url, craft, industrial, microbrewery, real_ale, way
  FROM planet_osm_polygon
  WHERE (craft ilike('%cider%') or craft ilike('%perry%') or industrial ilike('%cider%') or industrial ilike('%perry%')) and (disused is null or disused != 'yes')
) AS centers
SQL



end
