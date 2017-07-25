var Sprite = function(sprite, spriteId) {
	
  var xScale, yScale;

  var spriteIndex = spriteId - sprite.firstspriteid;
	
  this.resource = sprite.file;
	
  // The sprite type determines the size
  // of a sprite.
  switch(sprite.spritetype) {
    
    // 32x32 sprite
    case 0x00:
      xScale = 1;
      yScale = 1;
      break;
    	
    // 32x64 sprite
    case 0x01:
      xScale = 1;
      yScale = 2;
      break;
    	
    // 64x32 sprite		
    case 0x02:
      xScale = 2;
      yScale = 1;
      break;
    	
    // 64x64 sprite				
    case 0x03:
      xScale = 2;
      yScale = 2;
      break;
    
    }

    // Number of sprites in a row
    var spritesInRow = (12 / xScale);

    // Set the x, y position on the sprite sheet
    // and record the sprite width & height	
    this.x = 32 * xScale * (spriteIndex % spritesInRow);
    this.y = 32 * yScale * (Math.floor(spriteIndex / spritesInRow));
    this.width = 32 * xScale;
    this.height = 32 * yScale;
	
}
