var app = angular.module("autodeskio", []);
app.directive("game", function(){
  return {
    restrict: "A",
    link: function(scope, element){
      var canvas = element[0];

      window.onload = showViewport;
      window.onresize = showViewport;

      var ctx = canvas.getContext('2d');
      var img = new Image();
      img.src = 'assets/background.jpg';
      backgroundTile = {};

      img.onload = function() {
         draw();
         backgroundTile.width = this.width;
         backgroundTile.height = this.height;
      }

     

      var drawPattern = function(width, height){
          // create pattern
          var ptrn = ctx.createPattern(img, 'repeat'); // Create a pattern with this image, and set it to "repeat".
          ctx.fillStyle = ptrn;
          ctx.fillRect(0, 0, width, height); // ctx.fillRect(x, y, width, height);
      }
      function showViewport() {
        var output=document.getElementById("output");
        var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var height= Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        canvas.width = width;
        canvas.height = height;
        drawPattern(canvas.width , canvas.height);
      }

      // variable that decides if something should be drawn on mousemove
      var drawing = false;

      // the last coordinates before the current move
      var lastX;
      var lastY;

      element.bind('mousedown', function(event){
        if(event.offsetX!==undefined){
          lastX = event.offsetX;
          lastY = event.offsetY;
        } else { // Firefox compatibility
          lastX = event.layerX - event.currentTarget.offsetLeft;
          lastY = event.layerY - event.currentTarget.offsetTop;
        }

        // begins new line
        ctx.beginPath();

        drawing = true;
      });
      element.bind('mousemove', function(event){
        if(drawing){
          // get current mouse position
          if(event.offsetX!==undefined){
            currentX = event.offsetX;
            currentY = event.offsetY;
          } else {
            currentX = event.layerX - event.currentTarget.offsetLeft;
            currentY = event.layerY - event.currentTarget.offsetTop;
          }

          draw(lastX, lastY, currentX, currentY);

          // set current coordinates to last one
          lastX = currentX;
          lastY = currentY;
        }

      });
      element.bind('mouseup', function(event){
        // stop drawing
        drawing = false;
      });

      // canvas reset
      function reset(){
       element[0].width = element[0].width; 
      }

      function draw(lX, lY, cX, cY){
        // line from
        ctx.moveTo(lX,lY);
        // to
        ctx.lineTo(cX,cY);
        // color
        ctx.strokeStyle = "#4bf";
        // draw it
        ctx.stroke();
        setTimeout(draw, 100);
      }
    }
  };
});