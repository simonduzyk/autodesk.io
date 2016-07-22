
var fs = require("fs");

var config = {
    mapWidth: 128 * 20,
    productsMaxCount: 10,
    productsOnStart: 10,

    playerAttributes: ["size", "shield", "velocity"],

    sizeDefault: 40,
    velocityDefault: 2,
    shieldDefault: 0,
    bulletRangeInterval: 10,
    bulletRangeTime: 3000,//for entire map width
    bulletDefaultRange: undefined, //calculated in map
    bulletVelocity: undefined,//calculated in map
    bulletsDefault: 5,
    bulletSize: 20,

    sizeDefaultStep: 1,
    velocityDefaultStep: 0.1,
    shieldDefaultStep: 1,
    bulletsDefaultStep: 1,
    sizeHitCount: 10,
    sizeMin: 20,

    sizeMaxValue: 100,
    velocityMaxValue: 5,
    shieldMaxValue: 5,
    bulletsMaxValue: 14,

    productInterval: 10000
}

function Map(callback) {
    this.data = {
        products: {},
        players: {},
        bullets: {},
        width: config.mapWidth,
        height: config.mapWidth
    };
    this.productAssets = fs.readFileSync("./public/assets/assets.json", "utf8");

    if (!this.productAssets) {
        this.productAssets = [
            {
                "name": "3DS MAX",
                "img": "3ds_Max_",
                "description": "Create amazing worlds in 3ds Max",
                "attribute": "bullets",
                "value": 10
            }
        ]
    } else {
        this.productAssets = JSON.parse(this.productAssets).products;
    }

    config.bulletDefaultRange = config.bulletRangeTime / config.bulletRangeInterval;
    config.bulletVelocity = config.mapWidth / config.bulletDefaultRange;

    this.productId = 0;
    this.bulletId = 0;

    for (var i = 0; i < config.productsOnStart; i++)
        this.generateProduct();

    setInterval(function () {
        this.generateProductInterval();
        this.validatePlayersAttributes();
    }.bind(this), config.productInterval);

    setInterval(function () {
        this.updateBullets();
        this.validateBullets();
    }.bind(this), config.bulletRangeInterval);
    this.callback = callback;
}
Map.prototype.addProduct = function (product) {
    this.data.products[product.id] = product;
}
Map.prototype.removeProduct = function (id) {
    delete this.data.products[id];
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
    this.validateMap(player);
    return player;
}
Map.prototype.removePlayer = function (id) {
    var player = this.data.players[id];
    delete this.data.players[id];
    this.notify("player-delete", player);
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

        this.validateCoords(player.coords);

        player.dx = dx;
        player.dy = dy;

        this.validatePlayerPosition(player);
        this.validateMap(player);
    }
}
Map.prototype.validateCoords = function (coords) {
    if (coords.x < 0)
        coords.x = this.data.width + coords.x;

    if (coords.x > this.data.width)
        coords.x = coords.x - this.data.width;

    if (coords.y < 0)
        coords.y = this.data.height + coords.y;

    if (coords.y > this.data.height)
        coords.y = coords.y - this.data.height;
}
Map.prototype.setPlayerPosition = function (id, x, y) {
    var player = this.getPlayer(id);
    if (player) {
        player.coords.x = x;
        player.coords.y = y;
        this.validatePlayerPosition(player);
        this.validateMap(player);
    }
}
Map.prototype.getProductsCount = function () {
    return Object.keys(this.data.products).length;
}
Map.prototype.generateProductInterval = function () {
    var count = 2;
    if (this.getProductsCount() < 5) {
        count = 3;
    }

    for (var i = 0; i < count; i++) {
        this.generateProduct();
    }
}
Map.prototype.generateProduct = function () {
    if (this.getProductsCount() < config.productsMaxCount) {
        var pt = this.generateRandomPosition();
        var assetId = Math.floor(Math.random() * this.productAssets.length);
        var product = new Product(this.productId++, pt.x, pt.y, assetId);
        this.addProduct(product);
        this.validateProducts();
        this.notify("new-product");
        return true;
    }
    return false;
}
Map.prototype.validateMap = function (player) {
    this.validateProducts(player);
    this.validatePlayers(player);
}

Map.prototype.playerVsPlayer = function (player1, player2) {
    if (player1 && player2 && player1.collision(player2) && player1.size !== player2.size) {
        var attacker = (player1.size > player2.size) ? player1 : player2;
        var prey = (player1.size > player2.size) ? player2 : player1;
        if (prey.shield === 0) {
            attacker.size += prey.size/2;
            if (attacker.size > config.sizeMaxValue)
                attacker.size = config.sizeMaxValue;
            this.removePlayer(prey.id);
        }
    }
}

Map.prototype.playerVsProduct = function (player, product) {
    if (player && product && player.collision(product)) {
        var asset = this.productAssets[product.assetId];

        if (asset) {
            player[asset.attribute] += asset.value * config[asset.attribute + "DefaultStep"];
            if (player[asset.attribute] > config[asset.attribute + "MaxValue"])
                player[asset.attribute] = config[asset.attribute + "MaxValue"];
            this.notify('product-eaten', { player: player.id, product: product.assetId });
            this.removeProduct(product.id);
        }
    }
}

Map.prototype.validatePlayers = function (player) {
    var keys = Object.keys(this.data.players);

    if (player) {
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] != player.id)
                this.playerVsPlayer(this.data.players[keys[i]], player);
        }
    } else {
        for (var i = 0; i < keys.length; i++) {
            for (var j = i + 1; j < keys.length; j++) {
                this.playerVsPlayer(this.data.players[keys[i]], this.data.players[keys[j]]);
            }
        }
    }
}

Map.prototype.validateProducts = function (player) {
    var playersKeys = player ? [player.id] : Object.keys(this.data.players);

    for (var i = 0; i < playersKeys.length; i++) {
        for (var productKey in this.data.products) {
            this.playerVsProduct(this.data.players[playersKeys[i]], this.data.products[productKey]);
        }
    }
}
Map.prototype.notify = function (msg, data) {
    if (this.callback)
        this.callback(msg, data);
}

Map.prototype.validatePlayersAttributes = function () {
    var sendNotify = false;
    for (var key in this.data.players) {
        var player = this.data.players[key];

        for (var i = 0; i < config.playerAttributes.length; i++) {
            if (this.decreasePlayerAttribute(player, config.playerAttributes[i]))
                sendNotify = true;
        }
    }
    if (sendNotify)
        this.notify("attributes-updated");
}

Map.prototype.decreasePlayerAttribute = function (player, att) {

    if (player[att] === config[att + "Default"])
        return false;

    player[att] -= config[att + "DefaultStep"];

    if (player[att] < config[att + "Default"]) {
        player[att] = config[att + "Default"];
    }
    return true;
}

Map.prototype.shoot = function (playerId, vx, vy) {
    var player = this.getPlayer(playerId);
    if (player && player.bullets > 0) {
        player.bullets--;
        var bullet = new Bullet(this.bulletId++, player.coords.x + player.size * vx, player.coords.y + player.size * vy, vx, vy, config.bulletDefaultRange, player.id);
        bullet.size = config.bulletSize;
        this.data.bullets[bullet.id] = bullet;
    }
}

Map.prototype.removeBullet = function (id) {
    delete this.data.bullets[id];
}

Map.prototype.updateBullets = function () {
    var sendNotify = false;
    for (var keyBull in this.data.bullets) {
        var bullet = this.data.bullets[keyBull];
        bullet.range--;

        if (bullet.range > 0) {
            sendNotify = true;
            bullet.coords.x += bullet.vx * config.bulletVelocity;
            bullet.coords.y += bullet.vy * config.bulletVelocity;
            this.validateCoords(bullet.coords);
        }
        else {
            this.removeBullet(bullet.id);
            sendNotify = true;
        }
    }
    if (sendNotify)
        this.notify("bullet-move");
}

Map.prototype.validateBullets = function (inputPlayer) {
    var playersKeys = inputPlayer ? [inputPlayer.id] : Object.keys(this.data.players);
    var sendNotify = false;
    for (var keyBull in this.data.bullets) {
        var bullet = this.data.bullets[keyBull];
        for (var i = 0; i < playersKeys.length; i++) {
            var key = playersKeys[i];
            var player = this.data.players[key];
            var prevPoint = new Point(bullet.coords.x - bullet.vx * config.bulletVelocity, bullet.coords.y - bullet.vy * config.bulletVelocity);
            if (player && bullet.playerId !== key && player.shield === 0 && (player.collision(bullet) || this.isOnLine(prevPoint, bullet.coords, player.coords, bullet.size + player.size))) {
                player.size -= config.sizeHitCount;

                if (player.size < config.sizeMin) {
                    this.removePlayer(player.id);
                }
                this.removeBullet(bullet.id);
            }
        }
    }
}

Map.prototype.isOnLine = function (pt1, pt2, pt, eps) {
    var len1 = pt1.distanceTo(pt);
    var len2 = pt2.distanceTo(pt);
    var len = pt1.distanceTo(pt2);

    return Math.abs(len1 + len2 - len) < eps;
}

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}
Point.prototype.equals = function (pt, eps) {
    return Math.abs(this.x - pt.x) < eps && Math.abs(this.y - pt.y) < eps;
}
Point.prototype.distanceTo = function (pt) {
    return Math.sqrt((pt.x - this.x) * (pt.x - this.x) + (pt.y - this.y) * (pt.y - this.y));
}

function Item(id, x, y) {
    this.coords = new Point(x, y);
    this.id = id;
    this.size = config.sizeDefault;
}
Item.prototype.move = function (dx, dy) {
    this.coords.x += dx;
    this.coords.y += dy;
}
Item.prototype.collision = function (item) {
    return this.coords.equals(item.coords, this.size + item.size);
}

function Player(id, x, y) {
    Item.call(this, id, x, y);
    this.dx = 0;
    this.dy = 0;
    this.name = id;

    for (var i = 0; i < config.playerAttributes.length; i++) {
        this[config.playerAttributes[i]] = config[config.playerAttributes[i] + "Default"];
    }
    this.bullets = config.bulletsDefault;

    var letters = '0123456789ABCDEF'.split('');
    this.color = '#';
    for (var i = 0; i < 6; i++) {
        this.color += letters[Math.floor(Math.random() * 16)];
    }
}

Player.prototype = Object.create(Item.prototype);
Player.prototype.constructor = Player;

function Product(id, x, y, assetId) {
    Item.call(this, id, x, y);
    this.assetId = assetId;
}

Product.prototype = Object.create(Item.prototype);
Product.prototype.constructor = Product;

function Bullet(id, x, y, vx, vy, range, playerId) {
    Item.call(this, id, x, y);
    this.playerId = playerId;
    this.vx = vx;
    this.vy = vy;
    this.range = range;
}

Bullet.prototype = Object.create(Item.prototype);
Bullet.prototype.constructor = Bullet;

module.exports = {
    Map: Map,
    Player: Player,
    Product: Product,
    Point: Point
}