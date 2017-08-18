var WorldTile = function(position) {

  this.position = position;
  this.objects = new Array();

  this.walkable = true;

}

WorldTile.prototype.PopTopObject = function() {
  
  if(this.objects.length === 0) {
    return null;
  }

  return this.objects.pop();

}

/* WorldTile.GetTopObject
 * Returns the top object of tile
 */
WorldTile.prototype.GetTopObject = function() {

  if(this.objects.length === 0) {
    return null;
  }

  return this.objects[this.objects.length - 1];

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

/* Game.SortWorldTile
 * Sorts the objects on a given world tile
 */
WorldTile.prototype.SortObjects = function() {

  // Sort by property stackPosition
  this.objects.sort(function(a, b) {
    return a.stackPosition - b.stackPosition;
  });

}

WorldTile.prototype.SaveObject = function() {

  return {
    "position": this.position,
    "objects":   this.objects.map(function(tileObject) {
      return tileObject.SaveObject();
    }),
  }

}
