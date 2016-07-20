
function Map() {
    this.items = {};
    this.width = 128 * 20;
    this.height = this.width;
}
Map.prototype.addItem = function (item) {
    this.items[item.id] = item;
}
Map.prototype.removeItem = function (id) {
    delete this.items[id];
}
Map.prototype.addPlayer = function (id) {
    var x = Math.floor(Math.random() * this.width);
    var y = Math.floor(Math.random() * this.height);

    var player = new Player(id, x, y);
    this.addItem(player);
    return player;
}
Map.prototype.getPlayer = function (id) {
    return this.items[id];
}
Map.prototype.movePlayer = function (id, dx, dy) {
    var player = this.getPlayer(id);
    if (player) {
        player.move(dx, dy);

        if (player.coords.x < 0)
            player.coords.x =  this.width + player.coords.x;

        if (player.coords.x > this.width)
            player.coords.x = player.coords.x - this.width;

        if (player.coords.y < 0)
            player.coords.y = this.height + player.coords.y;

        if (player.coords.y > this.height)
            player.coords.y = player.coords.y - this.height;

        if (player.coords.x < 0)
            player.coords.x =  this.width;

        if (player.coords.x > this.width)
            player.coords.x = 0;

        if (player.coords.y < 0)
            player.coords.y = this.height;

        if (player.coords.y > this.height)
            player.coords.y = 0;
    }
}

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

function Item(id, x, y) {
    this.coords = new Point(x, y);
    this.id = id;
}
Item.prototype.move = function (dx, dy) {
    this.coords.x += dx;
    this.coords.y += dy;
}

function Player(id, x, y) {
    Item.call(this, id, x, y);
}

Player.prototype = Object.create(Item.prototype);
Player.prototype.constructor = Player;

function Product(id, x, y) {
    Item.call(this, id, x, y);
}

Product.prototype = Object.create(Item.prototype);
Product.prototype.constructor = Product;


module.exports = {
    Map: Map,
    Player: Player,
    Product: Product,
    Point: Point
}