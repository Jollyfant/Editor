/* Public Class GameObject
 * Container for game objects
 */
var GameObject = function(object) {

  this.id = object.id;

  var spriteInfo = object.frameGroup[0].spriteInfo;
  
  // Set whether the sprite needs to be animated
  this.animated = Boolean(spriteInfo.animation);
  
  // Save and respect the specified tile patterns
  this.pattern = {
    "width": spriteInfo.patternWidth,
	"height": spriteInfo.patternHeight
  }
  
  this.sprites = new Array();
  
  var sprites = object.frameGroup[0].spriteInfo.spriteId;
  var catalogueEntry, offset;
  
  var spriteId;
  
  for(var i = 0; i < spriteInfo.spriteId.length; i++) {

    spriteId = spriteInfo.spriteId[i];
	 
	catalogueEntry = this.GetCatalogueEntry(spriteId);

    this.sprites.push(
	  new Sprite(catalogueEntry, spriteId)
	);
	
  }

}

/* GameObject.GetCatalogueEntry
 * Returns the catalogue entry beloning to
 * the requested object id
 */
GameObject.prototype.GetCatalogueEntry = function(objectId) {

  var catalogueEntry;
  
  for(var i = 0; i < CATALOG_CONTENT.length; i++) {
	  
    catalogueEntry = CATALOG_CONTENT[i];
	
	// Return the previous content
    if(catalogueEntry.firstspriteid > objectId) {
	  return CATALOG_CONTENT[i - 1];
	}
	
  }
	
}