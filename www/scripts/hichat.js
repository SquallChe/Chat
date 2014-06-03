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
      document.getElementById('headIcon').style.display = 'block';
      document.getElementById('divSelected').style.display = 'block';
    });

    //nickname invalid
    this.socket.on('nickExisted', function () {
      document.getElementById('info').textContent = 'Nickname already existed..';
    });

    //success
    this.socket.on('loginSuccess', function (iconIndex) {
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
    this.socket.on('system', function (nickName, users, type) {
      var userCount = users.length;
      var msg = nickName + (type == 'login' ? ' joined' : ' left');

      //      var p = document.createElement('p');
      //      p.textContent = msg;
      //      document.getElementById('historyMsg').appendChild(p);
      that.displayNewMsg('system', msg, "red");

      //show x number
      document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
      that.initPanel(users);
    });

    //send message
    document.getElementById('sendBtn').addEventListener('click', function () {
      var messageInput = document.getElementById('messageInput'),
        msg = messageInput.value,
        color = document.getElementById('colorStyle').value;
      messageInput.value = '';
      messageInput.focus();
      if (msg.trim().length != 0) {
        that.socket.emit('postMsg', msg, color); //send message to server
        //that.displayNewMsg('me', msg, color);   //show message for myself
      };
    }, false);

    //show broadcasted message
    this.socket.on('newMsg', function (user, msg, color, iconIndex) {
      that.displayNewMsg(user, msg, color, iconIndex);
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

    //show emoji panel
    this.initialEmoji();
    document.getElementById('emoji').addEventListener('click', function (e) {
      var emojiwrapper = document.getElementById('emojiWrapper');
      emojiwrapper.style.display = 'block';
      e.stopPropagation();
    }, false);

    document.body.addEventListener('click', function (e) {
      var emojiwrapper = document.getElementById('emojiWrapper');
      var bgwrapper = document.getElementById('bgWrapper');
      if (e.target != emojiwrapper) {
        emojiwrapper.style.display = 'none';
      };
      if (e.target != bgwrapper) {
        bgwrapper.style.display = 'none';
      };
    });

    document.getElementById('emojiWrapper').addEventListener('click', function (e) {
      //get selected emoji
      var target = e.target;
      if (target.nodeName.toLowerCase() == 'img') {
        var messageInput = document.getElementById('messageInput');
        messageInput.focus();
        messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
      };
    }, false);

    document.getElementById('clearBtn').addEventListener('click', function (e) {
      //clear screen
      that.clearScreen();
    }, false);

    that.initialHeadIcon();

    document.getElementById('headIcon').addEventListener('click', function (e) {
      //get selected head
      var target = e.target;
      if (target.nodeName.toLowerCase() == 'img') {
        that.socket.emit('selectIcon', target.title);
        document.getElementById('imgSelected').src = target.src;
      };
    }, false);

    //background
    that.initialBg();
    document.getElementById('btnBg').addEventListener('click', function (e) {
      var bgWrapper = document.getElementById('bgWrapper');
      bgWrapper.style.display = 'block';
      e.stopPropagation();
    }, false);

    document.getElementById('bgWrapper').addEventListener('click', function (e) {
      //get selected emoji
      var target = e.target;
      if (target.nodeName.toLowerCase() == 'img') {
        var messageInput = document.getElementById('messageInput');
        messageInput.focus();
        $('#historyMsg').css('background-image', 'url(content/bg/bg' + target.title + '.gif)');
      };
    }, false);

    $('.draggable').draggable();
    $('#btnPanel').click(function () {
      $('.draggable').toggle(500, function () {
        if ($('.draggable').css('display') == 'none')
          $('#btnPanel').val('show panel');
        else
          $('#btnPanel').val('hide panel');
      });

    });

  },

  //show message
  displayNewMsg: function (user, msg, color, iconIndex) {
    var container = document.getElementById('historyMsg'),
         msgToDisplay = document.createElement('p'),
         date = new Date().toTimeString().substr(0, 8),
    //change to image
         msg = this.showEmoji(msg);
    msgToDisplay.style.color = color || '#000';
    if (iconIndex != undefined)
      msgToDisplay.innerHTML = '<img src="../content/headIcon/' + iconIndex + '.gif" style="width:40px;height:40px;">' + user + '<span class="timespan">(' + date + '): </span>' + msg;
    else
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
  },

  //initialize head icon
  initialHeadIcon: function () {
    var iconContainer = document.getElementById('headIcon'),
        docFragment = document.createDocumentFragment();
    for (var i = 7; i > 0; i--) {
      var iconItem = document.createElement('img');
      iconItem.src = '../content/headIcon/' + i + '.gif';
      iconItem.title = i;
      iconItem.width = 50;
      iconItem.height = 50;
      iconItem.style.cursor = 'pointer';
      docFragment.appendChild(iconItem);
    }
    iconContainer.appendChild(docFragment);
  },

  showEmoji: function (msg) {
    var match, result = msg,
        reg = /\[emoji:\d+\]/g,
        emojiIndex,
        totalEmojiNum = document.getElementById('emojiWrapper').children.length;
    while (match = reg.exec(msg)) {
      emojiIndex = match[0].slice(7, -1);
      if (emojiIndex > totalEmojiNum) {
        result = result.replace(match[0], '[X]');
      } else {
        result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');
      };
    };
    return result;
  },

  clearScreen: function () {
    var parent = document.getElementById("historyMsg");
    var children = parent.childNodes;
    for (var i = children.length - 1; i >= 0; i--) {
      parent.removeChild(children[i]);
    }
  },

  //initialize bg
  initialBg: function () {
    var bgContainer = document.getElementById('bgWrapper'),
        docFragment = document.createDocumentFragment();
    for (var i = 2; i > 0; i--) {
      var bgItem = document.createElement('img');
      bgItem.src = '../content/bg/bg' + i + '.gif';
      bgItem.title = i;
      docFragment.appendChild(bgItem);
    }
    bgContainer.appendChild(docFragment);
  },

  initPanel: function (users) {
    var content = '<ul id="ulSelf">me';
    for (var i = 0; i < users.length; i++) {
      content += '<li><img src="../content/headIcon/' + users[i].iconIndex + '.gif" style="width:40px;height:40px;">' + users[i].nickname + '</li>';
    }
    content += '</ul>';
    $('#userPanel').html(content);
  }
};