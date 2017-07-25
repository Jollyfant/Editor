/* Public Class TileObject
 * Container for an object on a tile
 *
 * Tile objects point to game object
 * and have some additional metadata
 */
var TileObject = function(gameObject) {

  // Point to a particular game object
  this.gameObjectPointer = gameObject;
  
  if(gameObject.cumulative) {
    this.count = 1;
  }

  // Set the stack position of the object
  if(gameObject.ground) {
    this.stackPosition = 0;
  } else if(gameObject.unsight) {
    this.stackPosition = 0;
  } else {
    this.stackPosition = 1;
  }

}

TileObject.prototype.SaveObject = function() {

  return {
    "id": this.id
  }

}
