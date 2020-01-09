#!/bin/bash
pid=`ps -ef | grep $1 | awk '{print $2}'`
ps -ef | grep "$2" | cut -c 9-15 | xargs kill -9
# kill -9  $(pidof ffmpeg)
if [ -n "$pid" ]
then
  kill -9 $pid
  echo "kill pid:"$pid
fi
  echo "kill pid finish..."
