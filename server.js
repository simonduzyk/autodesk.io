var express = require('express');
var engine = require('./engine/engine');
var app = express();
var http = require('http').Server(app);
var request = require('request');
var session = require('express-session');

var config = require('./lib/config');
var util = require('./lib/utility');

app.set('port', (process.env.PORT || 80));

app.use(express.static(__dirname + '/public'));
app.use(session({ secret: 'imr8k793jd73k6', saveUninitialized: true, resave: false }));

app.get('/', util.checkUser, function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

app.get('/login',
  function (req, res) {
    //url for "manual" ADSK authentication
    var url = config.autodeskConfig.authorize_url;
    url += "response_type=code";
    url += "&client_id=" + config.autodeskConfig.client_id;
    url += "&redirect_uri=" + encodeURIComponent(config.autodeskConfig.oauth_callback);
    url += "&scope=data:read";
    res.redirect(url);
    //res.render('login', { autodeskurl: url , githuburl: '/oauth/github'});
  });

app.get('/signin',
  function (req, res) {
    res.sendFile(__dirname + '/login.html');
  });

app.get('/*',
  function (req, res) {
    res.sendFile(__dirname + '/login.html');
  });

app.get('/oauthcallback',
  function (req, res) {
    var body = {
      'client_id': config.autodeskConfig.client_id,
      'client_secret': config.autodeskConfig.client_secret,
      'grant_type': 'authorization_code',
      'code': req.query.code,
      'redirect_uri': config.autodeskConfig.oauth_callback
    }
    request.post({
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: config.autodeskConfig.get_token_url,
      form: body
    }, function (err, response, body) {
      if (JSON.parse(body).access_token) {
        request.get({
          url: config.autodeskConfig.get_user_url,
          headers: { Authorization: 'Bearer ' + JSON.parse(body).access_token }
        }, function (err, response, body) {
          if (err) {
            res.redirect('/login');
          } else {
            util.createSession(req, res, JSON.parse(body).userName);
          }
        });
      } else {
        res.redirect('/login');
      }
    });
  });

app.get('/logout',
  function (req, res) {
    util.destroySession(req, res);
  });


app.use('/engine', new engine(http));

http.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
