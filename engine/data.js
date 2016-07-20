
function Map(){
    this.items = {};
    this.width = 600;
    this.height = 600;
}
Map.prototype.addItem = function(item){
    this.items[item.id] = item;
}
Map.prototype.removeItem = function(id){
    delete this.items[id];
}
Map.prototype.addPlayer = function(id){
    var player = new Player(id);
    this.addItem(player);
    return player;
}
Map.prototype.getPlayer = function (id) {
    return this.items[id];
}

function Point(x, y){
    this.x  = x || 0;
    this.y = y || 0;
}

function Item(id){
    this.coords = new Point();
    this.id = id;
}
Item.prototype.move = function (dx,dy) {
    this.coords.x += dx;
    this.coords.y += dy;
}

function Player(id){
    Item.call(this,id);    
}

Player.prototype = Object.create(Item.prototype);
Player.prototype.constructor = Player;

function Product(id){
    Item.call(this,id);
}

Product.prototype = Object.create(Item.prototype);
Product.prototype.constructor = Product;


module.exports = {
    Map: Map,
    Player: Player,
    Product: Product,
    Point: Point
}