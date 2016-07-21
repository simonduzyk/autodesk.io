var request = require('request');

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

exports.checkUser = function(req, res , next) {
  if(req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}