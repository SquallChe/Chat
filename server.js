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
    if (users.indexOf(nickname) > -1) {
      socket.emit("nickExisted");
    } else {
      socket.userIndex = users.length;
      socket.nickname = nickname;
      users.push(nickname);
      socket.emit("loginSuccess");
      io.sockets.emit("system", nickname, users.length, "login"); //send nicknames to all users who current online
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
    socket.broadcast.emit('newMsg', socket.nickname, msg, color);
  });

  //get posted image
  socket.on('img', function (imgData) {
    //send to users except the sender
    socket.broadcast.emit('newImg', socket.nickname, imgData);
  });

});