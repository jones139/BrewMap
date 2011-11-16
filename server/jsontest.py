#!/usr/bin/python
import json
import pprint

settingsFile = open("BrewMapCfg.json")
settingsJSON = settingsFile.read()
seto = json.loads(settingsJSON)
#print "Imported settings as:\n%s\n" % (seto.__str__())


for lg in seto['layerDefs']:
    #print layerGroup,seto['layerDefs']
    layerGroup = seto['layerDefs'][lg]
    sqlSelectCol = layerGroup['sqlSelectCol']
    sqlSelectPoint = layerGroup['sqlSelectPolygon']
    sqlSelectPolygon = layerGroup['sqlSelectPolygon']
    print "sqlSelectCol=%s\nsqlSelectPoint=%s\nsqlSelectPolygon=%s\n" %\
        (sqlSelectCol,sqlSelectPoint,sqlSelectPolygon);
    for layer in layerGroup['layers']:
        print "Layer = %s:" % layer
        pprint.pprint(layerGroup['layers'][layer])
