var request = require('request');
var config = require('./config');

exports.destroySession = function(request,response){
  
  request.session.destroy();
  response.redirect('/login');
}

exports.createSession = function(request,response, newUser){
  return request.session.regenerate(function(){
    request.session.user = newUser;
    response.redirect('/');
  })
}

exports.checkUser = function(request,response, next) {
  if(config.dev || request.session && request.session.user) {
    next();
  } else {
    response.redirect('/signin');
  }
}