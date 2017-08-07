var Inventory = function(id) {

  this.PADDING = 20;

  this.viewport = new Position(0, 0, 0);

  this.canvas = new Canvas(
    id,
    320 + this.PADDING,
    640
  );

}
