var resizeCanvas = function() {
  var canvas = document.getElementById('canvas');
  canvas.width = document.body.clientWidth;
  canvas.height = window.innerHeight;
	var baloon = $('#balloon'); 
  baloon.animate({ top: canvas.height }, 1);
}
window.addEventListener('resize', function() {
  resizeCanvas();
}, false);
document.addEventListener("DOMContentLoaded", function(event) { 
  resizeCanvas();
});
