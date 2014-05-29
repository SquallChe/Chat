window.onload = function () {
  var hichat = new HiChat();
  hichat.init();

  window.onkeypress = function () {
    if (window.event.keyCode == 13) {
      document.getElementById("sendBtn").click();
      return false;
    }
  }
};

//definate chat class
var HiChat = function () {
  this.socket = null;
};

//function HiChat() { 
//  this.socket = null;
//}

//add method
HiChat.prototype = {
  init: function () {//initial
    var that = this;
    //create connection to server
    this.socket = io.connect();
    //listen connect event
    this.socket.on('connect', function () {
      //when connected ,show input area
      document.getElementById('info').textContent = 'get yourself a nickname :)';
      document.getElementById('nickWrapper').style.display = 'block';
      document.getElementById('nicknameInput').focus();
    });

    //nickname invalid
    this.socket.on('nickExisted', function () {
      document.getElementById('info').textContent = 'Invalid nickname!';
    });

    //success
    this.socket.on('loginSuccess', function () {
      document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
      document.getElementById('loginWrapper').style.display = 'none';
      document.getElementById('messageInput').focus();
    });

    //set confirm button for nickname
    document.getElementById('loginBtn').addEventListener('click', function () {
      var nickName = document.getElementById('nicknameInput').value;

      if (nickName.trim().length != 0) {

        that.socket.emit('login', nickName);
      } else {

        document.getElementById('nicknameInput').focus();
      };
    }, false);

    //join or left
    this.socket.on('system', function (nickName, userCount, type) {
      var msg = nickName + (type == 'login' ? ' joined' : ' left');

      //      var p = document.createElement('p');
      //      p.textContent = msg;
      //      document.getElementById('historyMsg').appendChild(p);
      that.displayNewMsg('system', msg, "red");

      //show online number
      document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
    });

    //send message
    document.getElementById('sendBtn').addEventListener('click', function () {
      var messageInput = document.getElementById('messageInput'),
        msg = messageInput.value;
      messageInput.value = '';
      messageInput.focus();
      if (msg.trim().length != 0) {
        that.socket.emit('postMsg', msg); //send message to server
        that.displayNewMsg('me', msg);   //show message for myself
      };
    }, false);

    //show broadcasted message
    this.socket.on('newMsg', function (user, msg) {
      that.displayNewMsg(user, msg);
    });


    document.getElementById('sendImage').addEventListener('change', function () {
      //check whether file selected
      if (this.files.length != 0) {
        //get file by FileReader
        var file = this.files[0],
             reader = new FileReader();
        if (!reader) {
          that.displayNewMsg('system', 'your browser doesn\'t support fileReader!!', 'red');
          this.value = '';
          return;
        };
        reader.onload = function (e) {
          //read succeeded,show it and send to server
          this.value = '';
          that.socket.emit('img', e.target.result);
          that.displayImage('me', e.target.result);
        };
        reader.readAsDataURL(file);
      };
    }, false);

    //show image
    this.socket.on('newImg', function (user, img) {
      that.displayImage(user, img);
    });

  },

  //show message
  displayNewMsg: function (user, msg, color) {
    var container = document.getElementById('historyMsg');
    var msgToDisplay = document.createElement('p');
    var date = new Date().toTimeString().substr(0, 8);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },

  //show image
  displayImage: function (user, imgData, color) {
    var container = document.getElementById('historyMsg'),
        msgToDisplay = document.createElement('p'),
        date = new Date().toTimeString().substr(0, 8);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },

  //initialize emoji
  initialEmoji: function () {
    var emojiContainer = document.getElementById('emojiWrapper'),
        docFragment = document.createDocumentFragment();
    for (var i = 69; i > 0; i--) {
      var emojiItem = document.createElement('img');
      emojiItem.src = '../content/emoji/' + i + '.gif';
      emojiItem.title = i;
      docFragment.appendChild(emojiItem);
    }
    emojiContainer.appendChild(docFragment);
  }

};