#!/bin/bash
echo "restart..."
pid=`ps -ef | grep 2700 | awk '{print $2}'`
ps -ef | grep "rtsp_transport" | cut -c 9-15 | xargs kill -9
# kill -9  $(pidof ffmpeg)
if [ -n "$pid" ]
then
  kill -9 $pid
  echo "kill pid:"$pid
fi
  echo "kill pid finish..."
