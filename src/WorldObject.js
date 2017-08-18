/* Public Class GameObject
 * Container for game objects
 */
var GameObject = function(object) {

  this.id = object.id;

  var spriteInfo = object.frameGroup[0].spriteInfo;
  
  // Set whether the sprite needs to be animated
  this.animated = Boolean(spriteInfo.animation);

  if(this.animated) {
    this.animationPhases = spriteInfo.animation.spritePhase.length;
  }
  
  // Save and respect the specified tile patterns
  this.pattern = {
    "width": spriteInfo.patternWidth,
    "height": spriteInfo.patternHeight
  }
  
  if(object.flags.cumulative) {
    this.cumulative = true;
  }
	
  if(object.flags.unsight) {
    this.unsight = true;
  }

  if(object.flags.bank && object.flags.bank.waypoints) {
    this.ground = true;
  }

  this.elevation = object.flags.height ? object.flags.height.elevation : 0;
  
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
  
  return CATALOG_CONTENT[CATALOG_CONTENT.length - 1];
	
}


GameObject.prototype.GetCountIndex = function(count) {

  if(count < 5) {
    return count - 1;
  } else if(count < 10) {
    return 4;
  } else if(count < 10) {
    return 5;
  } else if(count < 50) {
    return 6;
  } else {
    return this.sprites.length - 1;
  }

}
