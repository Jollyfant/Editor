var WorldTile = function(position) {

  this.position = position;
  this.objects = new Array();

  this.walkable = true;

}

WorldTile.prototype.Add = function(gameObject) {

  var stackPosition = this.objects.length;

  // Add a new object to a tile
  this.objects.push(
    new TileObject(gameObject, stackPosition)
  );

}

/*
 * Public Function WorldTitle.HasGroundObject
 * Returns index of ground tile or null
 */
WorldTile.prototype.HasGroundObject = function() {

  for(var i = 0; i < this.objects.length; i++) {
    if(this.objects[i].ground) {
      return i;
    }
  }

  return null;

}

WorldTile.prototype.SaveObject = function() {

  return {
    "position": this.position,
    "objects":   this.objects.map(function(tileObject) {
      return tileObject.SaveObject();
    }),
  }

}
