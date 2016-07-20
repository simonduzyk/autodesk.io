var express = require('express');
var socketIO = require('socket.io');
var data = require('./data');


function ApiRouter(server) {

    var map = new data.Map();


    var io = socketIO(server);

    var router = express.Router();
    io.on('connection', function (socket) {
        socket.emit('yourId', socket.id);        
        map.addPlayer(socket.id);
        io.emit('change', map);
        socket.on('moved', function (msg) {
            map.getPlayer(socket.id).move(msg.dx,msg.dy); 
            io.emit('change', map);
        });
        socket.on('disconnect', function(){
            map.removeItem(socket.id);
            
            io.emit('change', map);
        });
    });
    return router;
}


module.exports = ApiRouter;