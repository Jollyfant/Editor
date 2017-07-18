var Sprite = function(sprite, index) {
	
  var xScale, yScale;
	
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

    // Set the x, y position on the sprite sheet
    // and record the sprite width & height
    this.x = 32 * xScale * (index % (12 / xScale));
    this.y = 32 * yScale * (Math.floor(index / (12 / yScale)));
    this.width = 32 * xScale;
    this.height = 32 * yScale;
	
}
