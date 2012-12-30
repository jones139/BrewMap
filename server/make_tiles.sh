#!/bin/sh
time ceramic expand --zoom 10 -- -8.2,49.3,2.2,61.1 | ceramic render brewmap.rb --callback tileDidLoad --path ./brewmap_tiles/%z/%x/%y.json

