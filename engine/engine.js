var express = require('express');
var socketIO = require('socket.io');
var data = require('./data');

function ApiRouter(server) {

    var io = socketIO(server);
    var clients = {};
    var map = new data.Map(function (event, data) {
        if (event === "player-delete") {
            if (clients[data])
                clients[data].emit("game-over");
        }
        else if (event === "product-eaten") {
            if (clients[data])
                clients[data].emit(event, data);
        } else {
            emitChange();
        }
    });

    var router = express.Router();

    function emitChange() {
        if (map) {
            io.emit('change', map.data);
        }
    }
    io.on('connection', function (socket) {
        clients[socket.id] = socket;
        socket.emit('yourId', socket.id);
        socket.emit('assets', map.productAssets);

        socket.on('moved', function (msg) {
            map.movePlayer(socket.id, msg.dx, msg.dy);
            emitChange();
        });
        socket.on('shoot', function (msg) {
            map.shoot(socket.id, msg.vx, msg.vy);
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
        socket.on('restart', function () {
            map.addPlayer(socket.id);
            emitChange();
        })
    });

    return router;
}


module.exports = ApiRouter;