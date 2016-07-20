
var fs = require("fs");

var config = {
    mapWidth: 128 * 20,
    itemsMaxCount: 20,
    defaultSize: 20
}

function Map(callback) {
    this.data = {
        items: {},
        players: {},
        width: config.mapWidth,
        height: config.mapWidth
    };
    this.products = fs.readFileSync("./public/assets/assets.json", "utf8");

    if (!this.products) {
        this.products = [
            {
                "name": "3DS MAX",
                "img": "3ds_Max_",
                "description": "Create amazing worlds in 3ds Max"
            }
        ]
    } else {
        this.products = JSON.parse(this.products).products;
    }

    this.itemId = 0;
    this.callback = callback;
}
Map.prototype.addItem = function (item) {
    this.data.items[item.id] = item;
}
Map.prototype.removeItem = function (id) {
    delete this.data.items[id];
}
Map.prototype.generateRandomPosition = function () {
    var x = Math.floor(Math.random() * this.data.width);
    var y = Math.floor(Math.random() * this.data.height);

    return { x, y };
}
Map.prototype.addPlayer = function (id) {
    var pt = this.generateRandomPosition();
    var player = new Player(id, pt.x, pt.y);
    this.data.players[id] = player;
    this.validateMap();
    return player;
}
Map.prototype.removePlayer = function (id) {
    delete this.data.players[id];
    if (this.callback) {
        this.callback("player-delete", id);
    }
}
Map.prototype.getPlayer = function (id) {
    return this.data.players[id];
}
Map.prototype.validatePlayerPosition = function (player) {
    if (player.coords.x < 0)
        player.coords.x = this.data.width;

    if (player.coords.x > this.data.width)
        player.coords.x = 0;

    if (player.coords.y < 0)
        player.coords.y = this.data.height;

    if (player.coords.y > this.data.height)
        player.coords.y = 0;
}
Map.prototype.movePlayer = function (id, dx, dy) {
    var player = this.getPlayer(id);
    if (player) {
        player.move(dx, dy);

        if (player.coords.x < 0)
            player.coords.x = this.data.width + player.coords.x;

        if (player.coords.x > this.data.width)
            player.coords.x = player.coords.x - this.data.width;

        if (player.coords.y < 0)
            player.coords.y = this.data.height + player.coords.y;

        if (player.coords.y > this.data.height)
            player.coords.y = player.coords.y - this.data.height;

        this.validatePlayerPosition(player);
        this.validateMap();
    }
}
Map.prototype.setPlayerPosition = function (id, x, y) {
    var player = this.getPlayer(id);
    if (player) {
        player.coords.x = x;
        player.coords.y = y;
        this.validatePlayerPosition(player);
        this.validateMap();
    }
}
Map.prototype.getItemsCount = function () {
    return Object.keys(this.data.items).length;
}
Map.prototype.generateProduct = function () {
    if (this.getItemsCount() < config.itemsMaxCount) {
        var pt = this.generateRandomPosition();
        var assetId = Math.floor(Math.random() * this.products.length);
        var product = new Product(this.itemId++, pt.x, pt.y, assetId);
        this.addItem(product);
        this.validateMap();
        return true;
    }
    return false;
}
Map.prototype.validateMap = function () {
    this.validateItems();
    this.validatePlayers();
}
Map.prototype.validatePlayers = function () {
    var keys = Object.keys(this.data.players);

    for (var i = 0; i < keys.length; i++) {
        for (var j = i + 1; j < keys.length; j++) {
            var obj1 = this.data.players[keys[i]];
            var obj2 = this.data.players[keys[j]];

            if (obj1 && obj2 && obj1.coords.equals(obj2.coords, obj1.size + obj2.size)) {
                if (obj1.size >= obj2.size) {
                    obj1.size += obj2.size;
                    this.removePlayer(obj2.id);
                }
                else if (obj1.size < obj2.size) {
                    obj2.size += obj1.size;
                    this.removePlayer(obj1.id);
                }
            }
        }
    }
}

Map.prototype.validateItems = function () {
    var keys = Object.keys(this.data.players);
    var keysItems = Object.keys(this.data.items);

    for (var i = 0; i < keys.length; i++) {
        for (var j = 0; j < keysItems.length; j++) {
            var obj1 = this.data.players[keys[i]];
            var obj2 = this.data.items[keysItems[j]];

            if (obj1 && obj2 && obj1.coords.equals(obj2.coords, obj1.size + obj2.size)) {
                obj1.size += obj2.size;
                this.removeItem(obj2.id);
            }
        }
    }

}

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}
Point.prototype.equals = function (pt, eps) {
    return Math.abs(this.x - pt.x) < eps && Math.abs(this.y - pt.y) < eps;
}

function Item(id, x, y) {
    this.coords = new Point(x, y);
    this.id = id;
    this.size = config.defaultSize;
}
Item.prototype.move = function (dx, dy) {
    this.coords.x += dx;
    this.coords.y += dy;
}

function Player(id, x, y) {
    Item.call(this, id, x, y);
    this.velocity = 1;
}

Player.prototype = Object.create(Item.prototype);
Player.prototype.constructor = Player;

function Product(id, x, y, assetId) {
    Item.call(this, id, x, y);
    this.assetId = assetId;
}

Product.prototype = Object.create(Item.prototype);
Product.prototype.constructor = Product;


module.exports = {
    Map: Map,
    Player: Player,
    Product: Product,
    Point: Point
}