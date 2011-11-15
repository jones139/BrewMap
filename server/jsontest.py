#!/usr/bin/python
import json

settingsFile = open("BrewMapCfg.json")
settingsJSON = settingsFile.read()
seto = json.loads(settingsJSON)
#print "Imported settings as:\n%s\n" % (seto.__str__())


for layerGroup in seto['layerDefs']:
    #print layerGroup,seto['layerDefs']
    sqlSelectCol = seto['layerDefs'][layerGroup]['sqlSelectCol']
    sqlSelectPoint = seto['layerDefs'][layerGroup]['sqlSelectPolygon']
    sqlSelectPolygon = seto['layerDefs'][layerGroup]['sqlSelectPolygon']
    print "sqlSelectCol=%s\nsqlSelectPoint=%s\nsqlSelectPolygon=%s\n" %\
        (sqlSelectCol,sqlSelectPoint,sqlSelectPolygon);
    for layer in seto['layerDefs'][layerGroup]['layers']:
        print "%s - %s\n" % (layer,seto['layerDefs'][layerGroup]['layers'][layer])
