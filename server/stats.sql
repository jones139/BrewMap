select count(osm_id) as dist_point from planet_osm_point where craft='distillery' or industry='distillery'; 
select count(osm_id) as dist_poly from planet_osm_polygon where craft='distillery' or industry='distillery';
select count(osm_id) as wine_point from planet_osm_point where craft='winery' or industry='winery';
select count(osm_id) as wine_poly from planet_osm_polygon where craft='winery' or industry='winery';
select count(osm_id) as cider_point from planet_osm_point where craft='cider' or industry='cider' or craft='cider_house' or industry='cider_house';
select count(osm_id) as cider_poly from planet_osm_polygon where craft='cider' or industry='cider'or craft='cider_house' or industry='cider_house';
select count(osm_id) as perry_point from planet_osm_point where craft='perry' or industry='perry'or craft='perry_house' or industry='perry_house';
select count(osm_id) as perry_poly from planet_osm_polygon where craft='perry' or industry='perry'or craft='perry_house' or industry='perry_house';