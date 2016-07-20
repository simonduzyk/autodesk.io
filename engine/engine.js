var express = require('express');
var socketIO = require('socket.io');
var data = require('./data');

function ApiRouter(server) {

    var map = new data.Map();
    var io = socketIO(server);

    var router = express.Router();

    function emitChange() {
        io.emit('change', map.data);
    }
    io.on('connection', function (socket) {
        socket.emit('yourId', socket.id);
        map.addPlayer(socket.id);
        emitChange();
        socket.on('moved', function (msg) {
            map.movePlayer(socket.id, msg.dx, msg.dy);
            emitChange();
        });
        socket.on('disconnect', function () {
            map.removePlayer(socket.id);

            emitChange();
        });
    });

    setInterval(function(){
        if(map.generateProduct())
            emitChange();
    }, 1000);

    return router;
}


module.exports = ApiRouter;