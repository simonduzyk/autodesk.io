var express = require('express');
var engine = require('./engine/engine');
var app = express();
var http = require('http').Server(app);
var request = require('request');

var config = require('./lib/config');
var util = require('./lib/utility');

app.set('port', (process.env.PORT || 8080));

app.use(express.static(__dirname + '/public'));


//// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

app.get('/', util.checkUser, function(request, response) {
  response.render('index');
});

app.get('/login',
  function (req, res) {
    //url for "manual" ADSK authentication
    var url = config.autodeskConfig.authorize_url;
    url += "response_type=code";
    url += "&client_id=" + config.autodeskConfig.client_id;
    url += "&redirect_uri=" + encodeURIComponent(config.autodeskConfig.oauth_callback);
    url += "&scope=data:read";
    res.render('login', { autodeskurl: url});
    //res.render('login', { autodeskurl: url , githuburl: '/oauth/github'});
  });

app.post('/login',
  function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    new User({ username: username }).fetch().then(function (user) {
      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePasswords(password, function (theSame) {
          if (theSame) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        })
      }
    })
  });

//app.get('/oauth/adsk', passport.authenticate('adsk', { failureRedirect: '/login' }));

app.get('/oauth/callback',
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
      if (err) {
        res.redirect('/login');
      } else {
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
