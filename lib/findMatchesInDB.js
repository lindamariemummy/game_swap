'use strict';

var User = require('../models/user.js');
var Game = require('../models/game.js');
var Match = require('../models/match.js');
var _ = require('lodash');
var eachAsync = require('each-async');

//expects an array of users, all in the same zip code
function findMatches(user, sameZip, res, callback) {
  var i;
  var j;
  var k;
  var match = [];
  var adjMat = [];
  var userIds = [];
  var matchArray = [];
  var temp1D = [];
  var flag = false;
  var me = user._id;
  console.log('myid', me);

  //initialize adjacency matrix with array of empty arrays
  for (i = 0; i < sameZip.length; i++) {
    for (j = 0; j < sameZip.length; j++) {
      temp1D.push([]);
    }
    adjMat.push(temp1D);
    temp1D = [];
  }

  //pulls userIds into userIds object
  for (i = 0; i < sameZip.length; i++) {
    userIds[i] = sameZip[i]._id.toString();
  }

  //build adjacency matrix, i is user in question
  eachAsync(sameZip, function(item, i, done) {

    //find user with first ID
    User.findOne({_id:userIds[i]}, function(err, user) {

      //check for errors
      if (err) return res.json({error:99});
      // put err check here
      if (!user) return res.json({error:99});
      var thisUserWants = user.wantsGames; //pulls out wantsgames array

      //loops through wants games array
      for (j = 0; j < thisUserWants.length; j++) {
        //add 1 to adj mat since match exists
        //console.log('idd', idd);
        console.log('userwants', thisUserWants[j]);
        var idd = thisUserWants[j].ownerId;
        console.log('idd', idd);
        if (idd && userIds.indexOf(idd) >= 0) adjMat[i][userIds.indexOf(idd)].push(thisUserWants[j]);
      }
      console.log('mat', adjMat);
      done();
    });
  },
  function(err) {

    //find matches between users
    flag = false;
    for (i = 0; i < sameZip.length && !flag; i++) {
      //console.log('me',me, userIds.indexOf(me.toString()))
      j = userIds.indexOf(me.toString());

      //executes only if match exists (symmetric entry in array)
      if (adjMat[i][j][0] && adjMat[j][i][0]) {

        //initialize games as empty arrays
        match = {};
        match.yourgame = [];
        match.mygame = [];

        //only return the first match
        k = 0;

        //add first entry in adj matrix
        match.mygame.push(adjMat[i][j][k]);
        match.yourgame.push(adjMat[j][i][k]);
        match.you = userIds[i];
        match.me = userIds[j];

        matchArray.push(match);

        //escapes the loop, capping found matches at 1
        flag = true;
      }
    }

    if (flag) { //a match has been found
      User.find({_id: matchArray[0].you}, function(err, user) {
        matchArray[0].you = user;
        callback(null, matchArray);
      });
    }
    else { //no matches were found
      callback(null, []);
    }
  });
}

module.exports = findMatches;
