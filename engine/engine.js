var express = require('express');
var socketIO = require('socket.io');
var data = require('./data');

function ApiRouter(server) {

    var io = socketIO(server);
    var clients = {};
    var map = new data.Map(function (event, data) {
        if (event === "player-delete") {
            if (clients[data])
                clients[data].emit("game-over")
        }
    });

    var router = express.Router();

    function emitChange() {
        console.log(Object.keys(map.data.players));
        io.emit('change', map.data);
    }
    io.on('connection', function (socket) {
        clients[socket.id] = socket;
        socket.emit('yourId', socket.id);
        socket.emit('assets', map.productAssets);
        map.addPlayer(socket.id);
        emitChange();
        socket.on('moved', function (msg) {
            map.movePlayer(socket.id, msg.dx, msg.dy);
            emitChange();
        });
        socket.on('position', function (msg) {
            map.setPlayerPosition(socket.id, msg.x, msg.y);
            emitChange();
        });
        socket.on('disconnect', function () {
            map.removePlayer(socket.id);
            delete clients[socket.id];
            emitChange();
        });
        socket.on('getAssets', function () {
            socket.emit('assets', map.productAssets);
        });
        socket.on('getMap', function () {
            socket.emit('map', map.data);
        });
        socket.on('getId', function () {
            socket.emit('yourId', socket.id);
        });
        socket.on('restart', function(){
            map.removePlayer(socket.id);
            map.addPlayer(socket.id);
            emitChange();
        })
    });
    map.generateProduct();
    emitChange();
    setInterval(function () {
        if (map.generateProduct())
            emitChange();
    }, 10000);

    return router;
}


module.exports = ApiRouter;