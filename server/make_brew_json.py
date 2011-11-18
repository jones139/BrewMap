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
from pprint import pprint

def query2obj(sqlstr,options):
    """
    Takes an sql string to use as a query and executes it, returning the result.
    The results are returned as an object.  It expectes the query to return
    a field called 'way' which is a text formatted postgis geometry 
    (ie POINT( longitude , latitude)).  This is parsed to create an object
    called 'point' with 'lat' and 'lng' entries in it.
    """
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
            point['lng'] = record['way'].split("POINT(")[1].split(" ")[0]
            point['lat'] = record['way'].split("POINT(")[1].split(" ")[1]
            mb['point'] = point
            for key in record:
                if key != "way":
                    mb[key] = record[key]
            microbreweries[record['osm_id']] = mb
        
    return microbreweries


def deleteNullEntries(obj):
    """Delete entries from an object obj that are 'None'
    Recursively scans through obj for objects with obj.
    Non-object entities are checked and if they are not None, they are
    written to the output object, which is returned.
    NOTE:  This will probably not work problem for lists, but works for 
    objects within objects.
    
    HIST:
    16nov2011 GJ  ORIGINAL VERSION
    """
    op = {}
    for nameStr in obj:
        if type(obj[nameStr]).__name__=='dict':
            op[nameStr] = deleteNullEntries(obj[nameStr])
        elif  obj[nameStr]!=None:
            op[nameStr]=obj[nameStr]
    return op
    

def make_brew_json(options):
    """
    Generates JSON files for various types of breweries from data in a 
    postgresql database.
    """

    # Define the main parts of the SQL queries required to extract the data
    # we separate the query into a select part which defines most of the
    # fields to extract, a SelectPoint or SelectPolygon part, which 
    # adds the type to the resulting data, and specifies the table
    # to query, then a where clause which filters out the require data.
    sqlSelectStr = "select osm_id,name,amenity,"\
        "craft,industry,microbrewery," \
        "\"addr:housename\", \"addr:housenumber\", \"addr:interpolation\"," \
        " "

    sqlSelectPointStr = " st_astext(st_transform(way,4326)) as way "\
        ",'node' as type from planet_osm_point "

    sqlSelectPolygonStr = "st_astext(st_transform(st_centroid(way),4326)) as way "\
        ",'way' as type from planet_osm_polygon "

    # MicroBreweries
    sqlWhereStr = " where microbrewery is not null and microbrewery != 'no'" \
        " and (disused is null or disused != 'yes')"
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPointStr,sqlWhereStr)
    microbrewery_point = query2obj(sqlStr,options)
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPolygonStr,sqlWhereStr)
    microbrewery_poly = query2obj(sqlStr,options)

    microbrewery = {'layerName':'brewmap_microbrewery'}
    microbrewery.update(microbrewery_poly)
    microbrewery.update(microbrewery_point)
    microbrewery = deleteNullEntries(microbrewery)

    # Craft Breweries
    sqlWhereStr = " where craft = 'brewery'" \
        " and (disused is null or disused != 'yes')"
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPointStr,sqlWhereStr)
    craft_point = query2obj(sqlStr,options)
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPolygonStr,sqlWhereStr)
    craft_poly = query2obj(sqlStr,options)

    craft = {'layerName':'brewmap_craft'}
    craft.update(craft_poly)
    craft.update(craft_point)
    #print "input"
    #pprint(craft)
    craft = deleteNullEntries(craft)
    #print "output"
    #pprint(craft)

    # Industrial Breweries
    sqlWhereStr = " where industry = 'brewery'" \
        " and (disused is null or disused != 'yes')"
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPointStr,sqlWhereStr)
    industry_point = query2obj(sqlStr,options)
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPolygonStr,sqlWhereStr)
    industry_poly = query2obj(sqlStr,options)

    industry = {'layerName':'brewmap_industry'}
    industry.update(industry_poly)
    industry.update(industry_point)
    #print "input"
    #pprint(industry)
    industry = deleteNullEntries(industry)
    #print "output"
    #pprint(industry)
    #deleteNullEntries(industry)

    # Pubs Breweries
    sqlWhereStr = " where amenity = 'pub'" \
        " and (disused is null or disused != 'yes')"
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPointStr,sqlWhereStr)
    pub_point = query2obj(sqlStr,options)
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPolygonStr,sqlWhereStr)
    pub_poly = query2obj(sqlStr,options)


    pub = {'layerName':'brewmap_pub'}
    pub.update(pub_poly)
    pub.update(pub_point)
    pub = deleteNullEntries(pub)

    # Tagging Queries (things that may be breweries, but not tagged
    # as per our schema.
    sqlWhereStr = " where name ilike('%brewery%')" \
        " and (disused is null or disused != 'yes')" \
        " and (industry is null or industry != 'brewery')" \
        " and (craft is null or craft != 'brewery')" \
        " and (highway is null)" \
        " and (leisure is null)" \
        " and (landuse != 'farmyard' and landuse!='allotments' and landuse!='wharf')"
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPointStr,sqlWhereStr)
    tagQuery_point = query2obj(sqlStr,options)
    sqlStr = "%s %s %s" % \
        (sqlSelectStr, sqlSelectPolygonStr,sqlWhereStr)
    tagQuery_poly = query2obj(sqlStr,options)

    tagQuery = {}
    tagQuery.update(tagQuery_poly)
    tagQuery.update(tagQuery_point)
    tagQuery = deleteNullEntries(tagQuery)
    ##################################################################
    # Write the files to disk
    ##################################################################
    outfile = open("%s_microbrewery.json" % options.outfile,"w")
    outfile.write(json.dumps(microbrewery))
    outfile.close()
    outfile = open("%s_craft.json" % options.outfile,"w")
    outfile.write(json.dumps(craft))
    outfile.close()
    outfile = open("%s_industry.json" % options.outfile,"w")
    outfile.write(json.dumps(industry))
    outfile.close()
    outfile = open("%s_pub.json" % options.outfile,"w")
    outfile.write(json.dumps(pub))
    outfile.close()
    outfile = open("%s_tagQuery.json" % options.outfile,"w")
    outfile.write(json.dumps(tagQuery))
    outfile.close()


def make_json(options,seto):
    """
    makes the json files specified in the settings object seto.
    """
    if options.debug: print "make_json"
    # Loop through each layer group
    for lg in seto['layerGroups']:
        layerGroup = seto['layerGroups'][lg]
        sqlSelectCol = layerGroup['sqlSelectCol']
        sqlSelectPoint = layerGroup['sqlSelectPoint']
        sqlSelectPolygon = layerGroup['sqlSelectPolygon']
        sqlTagQueries = layerGroup['sqlTagQueries']
        tagQueriesDataFile = layerGroup['tagQueriesDataFile']
        # Loop through each layer within the group
        for layerStr in layerGroup['layers']:
            if options.debug: print "Layer = %s:" % layerStr
            layer = layerGroup['layers'][layerStr]
            if options.debug: pprint(layer)
            sqlWhere = layer['sqlWhere']
            dataFile = layer['dataFile']
            # Extract data from the points table
            sqlStr = "%s, %s %s" % \
                (sqlSelectCol, sqlSelectPoint,sqlWhere)
            if options.debug: print sqlStr
            pointObj = query2obj(sqlStr,options)
            # Extract data from the polygons table
            sqlStr = "%s, %s %s" % \
                (sqlSelectCol, sqlSelectPolygon,sqlWhere)
            if options.debug: print sqlStr
            polyObj = query2obj(sqlStr,options)
            # Merge the point and polygon data
            retObj = {}
            retObj.update(pointObj)
            retObj.update(polyObj)
            retObj = deleteNullEntries(retObj)
            # Write it to disk
            outfile = open("%s" % dataFile,"w")
            outfile.write(json.dumps(retObj))
            outfile.close()

        ##########################################################
        # Now calculate the tagQueries.json file.
        sqlStr = "%s, %s %s" % \
            (sqlSelectCol, sqlSelectPoint,sqlTagQueries)
        tagQuery_point = query2obj(sqlStr,options)
        sqlStr = "%s, %s %s" % \
            (sqlSelectCol, sqlSelectPolygon,sqlTagQueries)
        tagQuery_poly = query2obj(sqlStr,options)

        tagQuery = {}
        tagQuery.update(tagQuery_poly)
        tagQuery.update(tagQuery_point)
        tagQuery = deleteNullEntries(tagQuery)
        outfile = open(tagQueriesDataFile,"w")
        outfile.write(json.dumps(retObj))
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
    parser.add_option("-c", "--config", dest="configFile",
                      help="Configuration File Name",
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
        configFile = "BrewMap.cfg",
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

    try:
        settingsFile=open(options.configFile)
        settingsJSON = settingsFile.read()
    except:
        print "Error Reading Configuration File: %s.\n" % options.configFile

    try:
        seto = json.loads(settingsJSON)
    except:
        print "oh no - there is an error in the configuration file: %s.\n" %\
            options.configFile
        if options.debug:
            print sys.exc_info()[0]
            raise

    #make_brew_json(options)
    make_json(options,seto)











