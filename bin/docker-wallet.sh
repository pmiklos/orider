#!/bin/bash
#
# Simple script to launch a Byteball Testnet GUI wallet using docker
#

NAME=$1
VOLUME=$NAME-data
XSOCK=/tmp/.X11-unix
XAUTH=/tmp/.docker.xauth

# Allow docker container to access the host X11 server, useful if host and guest user ids are different
xauth nlist $DISPLAY | sed -e 's/^..../ffff/' | xauth -f $XAUTH nmerge -
chmod 644 $XAUTH

docker run -d --rm --name $NAME \
    -e DISPLAY=$DISPLAY \
    -e XAUTHORITY=$XAUTH \
    -v $XSOCK:$XSOCK \
    -v $XAUTH:$XAUTH \
    -v $VOLUME:/byteball \
    pmiklos/byteball-testnet:latest
