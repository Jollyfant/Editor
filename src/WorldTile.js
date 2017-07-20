var WorldTile = function(position) {

  this.position = position;
  this.objects = new Array();

  this.walkable = true;

}

WorldTile.prototype.Add = function(gameObject) {

  // Add a new object to a tile
  this.objects.push(
    new TileObject(gameObject)
  );

}

WorldTile.prototype.Replace = function(gameObject, index) {

  this.objects[index] = new TileObject(gameObject);

}

/*
 * Public Function WorldTitle.HasGroundObject
 * Returns index of ground tile or null
 */
WorldTile.prototype.HasGroundObject = function() {

  // Ground tile has stackPosition 0
  for(var i = 0; i < this.objects.length; i++) {
    if(this.objects[i].stackPosition === 0) {
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
