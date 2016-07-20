var resizeCanvas = function() {
  var canvas = document.getElementById('canvas');
  console.log('resize');
  canvas.width = document.body.clientWidth - 1;
  canvas.height = window.innerHeight - 1;
  console.log(canvas.width + ' ' + window.innerWidth);
  console.log(canvas.height + ' ' + window.innerHeight);
}
window.addEventListener('resize', function() {
  resizeCanvas();
}, false);
document.addEventListener("DOMContentLoaded", function(event) { 
  resizeCanvas();
});
