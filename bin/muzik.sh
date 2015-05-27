#!/bin/sh
STR="";
for i in "$@"
do
  STR+=$i;
done;
STR="http://muzik-api.herokuapp.com/search?songname="+${STR// /_};
curl $STR;
