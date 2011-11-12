#!/bin/sh
SCRIPTDIR="$( cd -P "$( dirname "$0" )" && pwd )"
cd $SCRIPTDIR
$SCRIPTDIR/make_brew_json.py
