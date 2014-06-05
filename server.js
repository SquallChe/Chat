//server and page response
var http = require("http");
var express = require("express");

var app = express();

var server = http.createServer(app);
var io = require("socket.io").listen(server);
var users = []; //for saving users' info
var objSockets = {};

app.use("/", express.static(__dirname + "/www"));
server.listen(8080);

console.log("server started");

//socket part
io.on("connection", function (socket) {
  //set nickname
  socket.on("login", function (nickname) {
    var exsist = false;
    for (var i = 0; i < users.length; i++) {
      if (users[i].nickname == nickname) {
        exsist = true;
        break;
      }
    }

    if (exsist) {
      //if (users.indexOf(nickname) > -1) {
      socket.emit("nickExisted");
    }
    else {
      if (socket.iconIndex == undefined)
        socket.iconIndex = '0';

      //socket.userId = id++;
      //users.push(nickname);      
      users.push({ "userId": socket.id, "nickname": nickname, "iconIndex": socket.iconIndex });
      socket.nickname = nickname;
      socket.emit("loginSuccess", socket.id);
      io.sockets.emit("system", nickname, users, "login"); //send nicknames to all users who current online

      objSockets[socket.id] = socket;
    };
  });

  //left room
  socket.on('disconnect', function () {
    //delete user from usrs
    for (var i = 0; i < users.length; i++) {
      if (users[i].userId == socket.id) {
        users.splice(i, 1);
        break;
      }
    }

    delete objSockets[socket.id];

    //send message to all users except user who left room
    socket.broadcast.emit('system', socket.nickname, users, socket.id, 'logout');
  });

  //get message sent by user
  socket.on('postMsg', function (msg, color) {
    //send message to all users except the message sender
    //socket.broadcast.emit('newMsg', socket.nickname, msg, color, socket.iconIndex);
    io.sockets.emit('newMsg', socket.nickname, msg, color, socket.iconIndex);
  });

  //get posted image
  socket.on('img', function (imgData) {
    //send to users except the sender
    socket.broadcast.emit('newImg', socket.nickname, imgData);
  });

  //icon
  socket.on('selectIcon', function (iconIndex) {
    socket.iconIndex = iconIndex;
  });

  //test
  socket.on('test', function (fromId,toId) {
      console.log("from:" + fromId);
      console.log("to:" + toId);
  });

});