#!/usr/bin/python
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
#    Copyright Graham Jones 2011.
#
import psycopg2 as psycopg2
import psycopg2.extras
import json

def query2obj(sqlstr,options):
    connection = psycopg2.connect('dbname=%s' % options.dbname,\
                                     'user=%s' % options.dbuname)
    mark = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    mark.execute(sqlstr)
    records = mark.fetchall()
    
    if options.debug:
        if len(records)!=0: print "records=",records
    microbreweries={}
    if len(records)!=0:
        for record in records:
            mb = {}
            point = {}
            point['x'] = record['way'].split("POINT(")[1].split(" ")[0]
            point['y'] = record['way'].split("POINT(")[1].split(" ")[1]
            mb['point'] = point
            for key in record:
                if key != "way":
                    mb[key] = record[key]
            print mb
            microbreweries[record['osm_id']] = mb
        
    return microbreweries



def make_brew_json(options):
    sqlstr = "select osm_id,st_astext(way) as way,name,amenity,craft,industry,microbrewery from planet_osm_point" \
                  " where microbrewery is not null"
    microbrewery_point = query2obj(sqlstr,options)

    sqlstr = "select osm_id,st_astext(st_centroid(way)) as way,name,amenity,craft,industry,microbrewery from planet_osm_polygon" \
                  " where microbrewery is not null"
    microbrewery_poly = query2obj(sqlstr,options)

    microbrewery = {}
    microbrewery.update(microbrewery_poly)
    microbrewery.update(microbrewery_point)

    sqlstr = "select osm_id,st_astext(way) as way,name,amenity,craft,industry,microbrewery from planet_osm_point" \
                  " where craft='brewery'"
    craft_point = query2obj(sqlstr,options)

    sqlstr = "select osm_id,st_astext(st_centroid(way)) as way,name,amenity,craft,industry,microbrewery from planet_osm_polygon" \
                  " where craft='brewery'"
    craft_poly = query2obj(sqlstr,options)

    craft = {}
    craft.update(craft_poly)
    craft.update(craft_point)


    sqlstr = "select osm_id,st_astext(way) as way,name,amenity,craft,industry,microbrewery from planet_osm_point" \
                  " where industry='brewery'"
    industry_point = query2obj(sqlstr,options)

    sqlstr = "select osm_id,st_astext(st_centroid(way)) as way,name,amenity,craft,industry,microbrewery from planet_osm_polygon" \
                  " where industry='brewery'"
    industry_poly = query2obj(sqlstr,options)

    industry = {}
    industry.update(industry_poly)
    industry.update(industry_point)


    outfile = open("%s_microbrewery.json" % options.outfile,"w")
    outfile.write(json.dumps(microbrewery))
    outfile.close()
    outfile = open("%s_craft.json" % options.outfile,"w")
    outfile.write(json.dumps(craft))
    outfile.close()
    outfile = open("%s_industry.json" % options.outfile,"w")
    outfile.write(json.dumps(industry))
    outfile.close()


# INIT ----------------------------------------------------------
if __name__ == "__main__":
    from optparse import OptionParser

    usage = "Usage %prog [options] "
    version = "SVN Revision $Rev: 177 $"
    parser = OptionParser(usage=usage,version=version)
    parser.add_option("-f", "--file", dest="outfile",
                      help="filename to use for output",
                      metavar="FILE")
    parser.add_option("-n", "--dbname", dest="dbname",
                      help="database name")
    parser.add_option("-u", "--uname", dest="dbuname",
                      help="database user name")
    parser.add_option("-p", "--dbpass", dest="dbpass",
                      help="database password")
    parser.add_option("-v", "--verbose", action="store_true",dest="verbose",
                      help="Include verbose output")
    parser.add_option("-d", "--debug", action="store_true",dest="debug",
                      help="Include debug output")
    parser.set_defaults(
        outfile = "brewmap",
        dbname = "osm_gb",
        dbuname = "graham",
        dbpass = "1234",
        debug = False,
        verbose = False)
    (options,args)=parser.parse_args()
    
    if (options.debug):
        options.verbose = True
        print "options   = %s" % options
        print "arguments = %s" % args


    make_brew_json(options)
    











