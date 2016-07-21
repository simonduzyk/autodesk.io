var app = angular.module("autodeskio", []);
var socket = io();

app.service('GameState', function () {
  this.id = '';
  this.state = {};
  this.started = true;
  this.killed = false;
  var that = this;
  this.mousePosition = {x:0, y:0};
  this.center = {x:0, y:0};
  this.assets = [];
  this.loadAssetsCallback;
  
  this.setDraw = function(draw) {
    this.draw = draw;
  }

  this.onChange = function (state) {
    that.state = state;
    that.draw();
  }

  this.onYourId = function (id) {
    that.id = id;
  }

  this.movePlayer = function() {
    var dx = that.mousePosition.x - that.center.x;
    var dy = that.mousePosition.y - that.center.y;
    var l = Math.sqrt(dx*dx + dy*dy);
    var dxNorm = dx/l; 
    var dyNorm = dy/l; 
    socket.emit('moved', {dx: dxNorm*5, dy: dyNorm*5});
    setTimeout(that.movePlayer, 25);
  }

  socket.on('game-over', function () {
    that.killed = true;
    that.draw();
  });

  this.movePlayer();
  socket.on('change', this.onChange);
  socket.on('yourId', this.onYourId);
  socket.on('assets', function () {
    that.assets = Array.prototype.slice.call(arguments[0]);
    that.loadAssetsCallback();
  });
  socket.on('game-over', function () {
    console.log("you dieded");
  });
});

app.directive("game", function (GameState) {
  return {
    restrict: "A",
    link: function (scope, element) {
      var canvas = element[0];
      GameState.setDraw(draw);
      var localCenter = {x: 0, y: 0};

      window.onload = showViewport;
      window.onresize = showViewport;

      var ctx = canvas.getContext('2d');
      var img = new Image();
      img.src = 'assets/background.jpg';
      backgroundTile = {width:0, height:0};
      var productImages = [];
      
      var loadProductImages = function() {
        for(var i = 0; i < GameState.assets.length; i++) {
          productImages.push( new Image());
          productImages[i].src = 'assets/' + GameState.assets[i].img + '50.png';
        }
      }

      GameState.loadAssetsCallback = loadProductImages;


      img.onload = function () {
        backgroundTile.width = this.width;
        backgroundTile.height = this.height;
        draw();
      }
      var getOffset = function(offset) {
        return {
          x: offset.x%backgroundTile.width,
          y: offset.y%backgroundTile.height
        }
      }

      var drawBackground = function (width, height, offset) {
        // create pattern
        var ptrn = ctx.createPattern(img, 'repeat'); // Create a pattern with this image, and set it to "repeat".
        ctx.fillStyle = ptrn;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(-offset.x, -offset.y);
        ctx.fillRect(0, 0, width + backgroundTile.width, height + backgroundTile.height); // ctx.fillRect(x, y, width, height);
      }
      function showViewport() {
        var output = document.getElementById("output");
        var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        canvas.width = width;
        canvas.height = height;
        GameState.center = localCenter;
        draw();
      }

      // // variable that decides if something should be drawn on mousemove
      // var drawing = false;

      // // the last coordinates before the current move

      // element.bind('mousedown', function (event) {
      //   if (event.offsetX !== undefined) {
      //     lastX = event.offsetX;
      //     lastY = event.offsetY;
      //   } else { // Firefox compatibility
      //     lastX = event.layerX - event.currentTarget.offsetLeft;
      //     lastY = event.layerY - event.currentTarget.offsetTop;
      //   }

      //   // begins new line
      //   ctx.beginPath();

      //   drawing = true;
      // });
      element.bind('mousemove', function (event) {
        var currentX, currentY;
        if (event.offsetX !== undefined) {
          currentX = event.offsetX;
          currentY = event.offsetY;
        } else {
          currentX = event.layerX - event.currentTarget.offsetLeft;
          currentY = event.layerY - event.currentTarget.offsetTop;
        }
        GameState.mousePosition = {x: currentX, y: currentY};
      });
      element.bind('mouseup', function (event) {
        console.log(event.clientX);
        console.log(event.clientY);
      });

      function drawUser(centerx, centery, size, color) {
        ctx.beginPath();
        ctx.arc(centerx, centery, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#003300';

        ctx.stroke();
      }

      function drawItem(centerx, centery, size, color) {
        ctx.beginPath();
        ctx.arc(centerx, centery, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#003300';

        ctx.stroke();
      }

      function draw() {

        var center = { x: 0, y: 0 };

        if (GameState.state.players) {
          if (GameState.id in GameState.state.players) {
            var me = GameState.state.players[GameState.id];
            center = me.coords;
          }
        }

        var min = {
          x: center.x - canvas.width / 2,
          y: center.y - canvas.y / 2
        }

        if (min.x < 0) {
          min.x += GameState.width;
        }

        if (min.y < 0) {
          min.y += GameState.height;
        }

        var max = {
          x: center.x + canvas.width / 2,
          y: center.y + canvas.y / 2
        }

        if (max.x >= GameState.width) {
          max.x -= GameState.width;
        }

        if (max.y >= GameState.height) {
          max.y -= GameState.height;
        }

        if (GameState.state.items) {

        }

        var offset = getOffset(center);

        drawBackground(canvas.width, canvas.height, offset);

        localCenter = { x: canvas.width / 2 + offset.x, y: canvas.height / 2 + offset.y};
        var players = 0;
        var items = 0;
        for (var key in GameState.state.players) {
          players++;
          var player = GameState.state.players[key];
          var x = player.coords.x - center.x + localCenter.x;
          var y = player.coords.y - center.y + localCenter.y;
          drawUser(x, y, 30, player.color);
        }

        for (var key in GameState.state.products) {
          items++;
          var item = GameState.state.products[key];
          var x = item.coords.x - center.x + localCenter.x;
          var y = item.coords.y - center.y + localCenter.y;
          ctx.drawImage(productImages[item.assetId], x, y);
          //drawItem(x, y, 10, 'yellow');
        }

        ctx.font = '24pt Courier';
        ctx.strokeText('Players: ' + players, 10 + offset.x, 40 + offset.y);
        ctx.strokeText('Items: ' + items, 10 + offset.x, 80 + offset.y);

        if (GameState.killed) {
          ctx.textAlign="center";
          ctx.strokeText('Game Over!', canvas.width / 2, canvas.height / 2);
        }
      }

    }
  };
});

app.controller('MainController', ['GameState', function (GameState) {
}]);