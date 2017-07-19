/* Public Class TileObject
 * Container for an object on a tile
 *
 * Tile objects point to game object
 * and have some additional metadata
 */
var TileObject = function(gameObject, stackPosition) {

  // Point to a particular game object
  this.gameObjectPointer = gameObject;
  
  // Stack position of object
  this.stackPosition = stackPosition;

}

TileObject.prototype.SaveObject = function() {

  return {
    "id": this.id
  }

}
