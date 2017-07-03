var TileObject = function(id, stackPosition) {

  this.id = id;
  this.stackPosition = stackPosition;

  this.ground = false;

}

TileObject.prototype.SaveObject = function() {

  return {
    "id": this.id
  }

}
