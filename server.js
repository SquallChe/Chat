//server and page response
var http = require("http");
var express = require("express");

app = express();

server = http.createServer(app);
io = require("socket.io").listen(server);
users = []; //for saving users' nickname

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

      socket.userIndex = users.length;
      //users.push(nickname);      
      users.push({ "nickname": nickname, "iconIndex": socket.iconIndex });
      socket.nickname = nickname;
      socket.emit("loginSuccess");
      io.sockets.emit("system", nickname, users, "login"); //send nicknames to all users who current online
    };
  });

  //left room
  socket.on('disconnect', function () {
    //delete user from usrs
    users.splice(socket.userIndex, 1);
    //send message to all users except user who left room
    socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
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

});