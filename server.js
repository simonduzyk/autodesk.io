var express = require('express');
var engine = require('./engine/engine');
var app = express();
var http = require('http').Server(app);

app.set('port', (process.env.PORT || 8080));

app.use(express.static(__dirname + '/public'));

//// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('index');
});

app.use('/engine', new engine(http));

http.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
