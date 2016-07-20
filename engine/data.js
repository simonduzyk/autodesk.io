
var config = {
    mapWidth: 128*20,
    itemsMaxCount: 20
}

function Map() {
    this.data = {
        items : {},
        players : {},
        width : config.mapWidth,
        height : config.mapWidth
    };
    this.itemId = 0;
}
Map.prototype.addItem = function (item) {
    this.data.items[item.id] = item;
}
Map.prototype.removeItem = function (id) {
    delete this.data.items[id];
}
Map.prototype.generateRandomPosition = function(){
    var x = Math.floor(Math.random() * this.data.width);
    var y = Math.floor(Math.random() * this.data.height);

    return {x,y};
}
Map.prototype.addPlayer = function (id) { 
    var pt = this.generateRandomPosition();
    var player = new Player(id, pt.x, pt.y);
    this.data.players[id] = player;
    return player;
}
Map.prototype.removePlayer = function (id) {
    delete this.data.players[id];
}
Map.prototype.getPlayer = function (id) {
    return this.data.players[id];
}
Map.prototype.movePlayer = function (id, dx, dy) {
    var player = this.getPlayer(id);
    if (player) {
        player.move(dx, dy);

        if (player.coords.x < 0)
            player.coords.x =  this.data.width + player.coords.x;

        if (player.coords.x > this.data.width)
            player.coords.x = player.coords.x - this.data.width;

        if (player.coords.y < 0)
            player.coords.y = this.data.height + player.coords.y;

        if (player.coords.y > this.data.height)
            player.coords.y = player.coords.y - this.data.height;

        if (player.coords.x < 0)
            player.coords.x =  this.data.width;

        if (player.coords.x > this.data.width)
            player.coords.x = 0;

        if (player.coords.y < 0)
            player.coords.y = this.data.height;

        if (player.coords.y > this.data.height)
            player.coords.y = 0;
    }
}
Map.prototype.getItemsCount = function(){
    return Object.keys(this.data.items).length;
}
Map.prototype.generateProduct = function(){
    if(this.getItemsCount() < config.itemsMaxCount){
        var pt = this.generateRandomPosition();
        var product = new Product(this.itemId++, pt.x, pt.y);
        this.addItem(product);
        return true;
    }
    return false;
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

function Product(id,x, y) {
    Item.call(this, id, x, y);
    this.name = "Revit";
}

Product.prototype = Object.create(Item.prototype);
Product.prototype.constructor = Product;


module.exports = {
    Map: Map,
    Player: Player,
    Product: Product,
    Point: Point
}