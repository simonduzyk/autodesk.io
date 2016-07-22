var app = angular.module("autodeskio", []);
var socket = io();

var AttributesDictionary = {
  bullets: 'Ammo',
  size: 'Health',
  velocity: 'Speed',
  shield: 'Shield'
}

app.service('GameState', function () {
  this.id = '';
  this.state = {};
  this.isAlive = false;
  this.killedAtLeastOnce = false;
  var that = this;
  this.mousePosition = {x:0, y:0};
  this.assets = [];
  this.loadAssetsCallback;
  this.playerVelocity = 1;
  this.direction = {};
  
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

  this.balloons = 0;

  this.showBaloon = function (line1, line2, line3) {
      $('#line1').text(line1 || '');
      $('#line2').text(line2 || '');
      $('#line3').text(line3 || '');
      if (that.balloons == 0) {
        var canvas = document.getElementById('canvas');
        var baloon = $('#balloon'); 
        baloon.animate({ top: canvas.height - baloon.height() }, 500);
      }
      that.balloons += 1;
      setTimeout(function () {
        that.balloons -= 1;
        if (that.balloons == 0) {
          var canvas = document.getElementById('canvas');
          var baloon = $('#balloon'); 
          $('#balloon').animate({ top: canvas.height }, 200);
        }
      }, 3000);
  }

  this.onUserDeleted = function (user) {
    if (user) {
      that.showBaloon('Player killed:', user.name);
    }
  }

  this.onUserJoined = function (user) {
    if (user) {
      that.showBaloon('Player joined:', user.name);
    }
  }

  this.onUserLeft = function (user) {
    if (user) {
      that.showBaloon('Player left:', user.name);
    }
  }

  this.onEaten = function (data) {
    if (data && data.player === that.id) {
      var line1 = 'Bonus: ' + that.assets[data.product].name;
      var line2 = that.assets[data.product].description;
      var line3;
      var attribute = AttributesDictionary[that.assets[data.product].attribute];
      if(attribute === 'Shield')
        line3 = attribute + ' activated.';
      else if(attribute === 'Ammo')
        line3 = attribute + ' increased by ' + that.assets[data.product].value + '.';
      else
        line3 = attribute + ' increased.';
      that.showBaloon(line1, line2, line3);
    }
  }

  this.movePlayer = function() {
    var dx = that.mousePosition.x - canvas.width / 2;
    var dy = that.mousePosition.y - canvas.height / 2;
    var l = Math.sqrt(dx*dx + dy*dy);
    var dxNorm = dx/l; 
    var dyNorm = dy/l; 
    that.direction.x = dxNorm;
    that.direction.y = dyNorm;
    socket.emit('moved', {dx: dxNorm * 5 * Math.sqrt(that.playerVelocity), dy: dyNorm* 5 * Math.sqrt(that.playerVelocity)});
    setTimeout(that.movePlayer, 25);
  }
  this.shoot = function(vx, vy) {
    socket.emit('shoot', {vx: vx, vy: vy});
  }
  this.movePlayer();
  socket.on('change', this.onChange);
  socket.on('yourId', this.onYourId);
  socket.on('assets', function () {
    that.assets = Array.prototype.slice.call(arguments[0]);
    that.loadAssetsCallback();
  });
  socket.on('player-delete', this.onUserDeleted);
  socket.on('player-left', this.onUserLeft);
  socket.on('player-joined', this.onUserJoined);
  socket.on('product-eaten', this.onEaten);
  socket.on('game-over', function () {
    that.killedAtLeastOnce = true;
    that.draw();
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
        draw();
      }
      var bullets = 0;

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
        if (!GameState.isAlive) {
          socket.emit('restart');
        }
        else if(bullets > 0){//shoot
          var dir = GameState.direction;
          if('x' in dir) {
            GameState.shoot(dir.x, dir.y);
            bullets --;
          }
        }
        draw();
      });
      function drawCircle (centerx, centery, size, color, lineWidth) {
        ctx.beginPath();
        ctx.arc(centerx, centery, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        if(lineWidth > 0) {
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = '#000000';
          ctx.stroke();
        }
      }
      function drawRect(x, y, width, height, color, lineWidth) {
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      }
      function drawUser(centerx, centery, size, color, shield, offset, dirx, diry, name) {
        drawCircle(centerx, centery, size, color, 5);

        ctx.beginPath();

        ctx.translate( centerx, centery);
        var rot = Math.atan2(dirx, diry);
        ctx.rotate(-rot +Math.PI/2);
        ctx.rect(0, -5, size + 0.3*size, 11);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(-offset.x, -offset.y);
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        if(shield > 0) {
          var shieldPower = (shield > 5) ? 0.5 : shield * 0.1;
          shieldPower += 0.2;
          var shColor = "rgba(70, 200, 200,"+ shieldPower + ")";
          drawCircle(centerx, centery, size + size * 0.4, shColor, 0);
        }
        ctx.textAlign="center";
        ctx.font = '12pt  "Orbitron"';
        ctx.fillStyle = "green";
        ctx.fillText(name, centerx, centery - size -20);
      }

      function drawBullet(x, y) {
        drawCircle(x, y, 10, 'red', 2);
      }
      var MAX_AMMO = 14;
      var AMMO_ROW = MAX_AMMO/2;
      function drawAmmoGrid(ammoCount, offset) {
        
        ammo = ammoCount > MAX_AMMO ? MAX_AMMO : ammoCount;
        var yOffset = 111 + offset.y;
        if(ammo > AMMO_ROW) {
          yOffset -= 11;
        }
        for(var i = 0; i < ammo; i++) {      
          drawCircle(150 + offset.x + (i%AMMO_ROW)*15, yOffset, 6, '#fdfd22', 1);
          if(i == (AMMO_ROW - 1))
            yOffset += 20;

        }
      }
      function fixCoords(item, center, max, min) {
          if(max.x < center.x && item.coords.x < max.x)
           item.coords.x += GameState.state.width;
          if(max.y < center.y && item.coords.y < max.y)
           item.coords.y += GameState.state.height;

          if(min.x > center.x && item.coords.x > min.x)
           item.coords.x -= GameState.state.width;
          if(min.y > center.y && item.coords.y > min.y)
           item.coords.y -= GameState.state.height;
      }

      function draw() {

        var center = { x: 0, y: 0 };
        var me;

        GameState.isAlive = false;

        if (GameState.state.players) {
          if (GameState.id in GameState.state.players) {
            GameState.isAlive = true;
            me = GameState.state.players[GameState.id];
            center = me.coords;
            GameState.playerVelocity = me.velocity;
            bullets = me.bullets;
          }
        }

        var min = {
          x: center.x - canvas.width / 2,
          y: center.y - canvas.height / 2
        }

        if (min.x < 0) {
          min.x += GameState.state.width;
        }

        if (min.y < 0) {
          min.y += GameState.state.height;
        }

        var max = {
          x: center.x + canvas.width / 2,
          y: center.y + canvas.height / 2
        }

        if (max.x >= GameState.state.width) {
          max.x -= GameState.state.width;
        }

        if (max.y >= GameState.state.height) {
          max.y -= GameState.state.height;
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

          fixCoords(player, center, max, min)

          var x = player.coords.x - center.x + localCenter.x;
          var y = player.coords.y - center.y + localCenter.y;
          //var dir = GameState.direction;
          var playerName = "";
          if(me.id !== player.id) {
            playerName = player.name;
          }
          drawUser(x, y, player.size, player.color, player.shield, offset, player.dx, player.dy, playerName);
        }

        for (var key in GameState.state.products) {
          items++;
          var item = GameState.state.products[key];

          fixCoords(item, center, max, min)

          var x = item.coords.x - center.x + localCenter.x - 25;
          var y = item.coords.y - center.y + localCenter.y - 25;
          ctx.drawImage(productImages[item.assetId], x, y);
        }

        for (var key in GameState.state.bullets) {
          var item = GameState.state.bullets[key];

          fixCoords(item, center, max, min)

          var x = item.coords.x - center.x + localCenter.x;
          var y = item.coords.y - center.y + localCenter.y;
          drawBullet(x, y);
        }
        
        var rectHeight = 135;

        drawRect(canvas.width - 200 + offset.x, -3 + offset.y, 220, rectHeight - 40, "rgba(0, 0, 0, 0.6)", 5);
        if(me) {
          drawRect(-3 + offset.x, -3 + offset.y, 280, rectHeight, "rgba(0, 0, 0, 0.6)", 5);
          drawRect(145 + offset.x, 19 + offset.y, 100, 20, "rgba(0, 0, 0, 1)", 2);
          var health = me.size;
          drawRect(145 + offset.x, 19 + offset.y, health, 20, "rgba(150, 0, 0, 1)", 0);
          drawRect(145 + offset.x, 60 + offset.y, 100, 20, "rgba(0, 0, 0, 1)", 2);
          var speed = me.velocity*20;
          drawRect(145 + offset.x, 60 + offset.y, speed, 20, "rgba(0, 125, 200, 1)", 0);
          drawAmmoGrid(me.bullets, offset);
          
        }
        ctx.font = '24pt  "Orbitron"';
        ctx.fillStyle = "#47d147";
        ctx.textAlign="left";
        ctx.fillText('Players: ' + players, canvas.width - 190 + offset.x, 40 + offset.y);
        ctx.fillText('Items: ' + items, canvas.width - 190 + offset.x, 80 + offset.y);
        if(me) {
          ctx.beginPath();
          ctx.fillText('Health:  ', 10 + offset.x, 40 + offset.y);
          ctx.fillText('Speed:  ', 10 + offset.x, 80 + offset.y);
          ctx.fillText('Ammo: ', 10 + offset.x, 120 + offset.y);

          // if(me.shield > 0)
          //   ctx.fillText('Shield active', 10 + offset.x, 160 + offset.y);
        }
        
        // ctx.fillText('Position: ' + Math.round(center.x) + ", " + Math.round(center.y), canvas.width - 400 + offset.x, 120 + offset.y);


        if (!GameState.isAlive && GameState.killedAtLeastOnce) {
          ctx.font = '44pt "Orbitron"';
          ctx.textAlign="center";
          ctx.fillStyle = "red";
          ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
        }
        if (!GameState.isAlive) {
          ctx.font = '44pt "Orbitron"';
          ctx.textAlign="center";
          ctx.fillStyle = "green";
          ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2 + 40);
        }
      }

    }
  };
});

app.controller('MainController', ['GameState', function (GameState) {
}]);