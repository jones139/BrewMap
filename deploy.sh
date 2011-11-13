#!/bin/sh
SCRIPTDIR="$( cd -P "$( dirname "$0" )" && pwd )"
cd $SCRIPTDIR
ncftpput -m -f ~/.ncftp_data -R /public_html/BrewMap *


