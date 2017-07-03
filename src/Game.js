/*
 * Public Class Game
 */
var Game = function() {

  this.WORLD_MAP_WIDTH = 1000;
  this.WORLD_MAP_HEIGHT = 1000;

  // Get the canvas & context
  this.canvas = document.getElementById("gameScreenCanvas");
  this.canvas.height = 640;
  this.canvas.width = 640;
  this.context = this.canvas.getContext("2d");

  // Create the viewport
  this.viewport = new Position(0, 0);
  this.activePosition = new Position(0, 0);
  
  this.activeTileId = null;

  this.bounds = this.canvas.getBoundingClientRect();

  // The world map array is one-dimensional of length
  // width * height.
  this.worldMapTiles = new Array(
    this.WORLD_MAP_WIDTH * this.WORLD_MAP_HEIGHT
  );

  this.zoomLevel = 1;

  this.moving = false;
  this.deleting = false;

  this.undoCommandMemory = new Array();
  this.redoCommandMemory = new Array();
  
  this.mouseDown = 0;

  this.Init();

}

Game.prototype.Init = function() {

  // Load all resources in to memory
  this.LoadResources();

}

// Encodes the worldMapObject to JSON
Game.prototype.EncodeWorldMap = function() {

  return JSON.stringify(this.worldMapTiles.filter(function(x) {
    return x !== undefined;
  }).map(function(x) {
    return x.SaveObject();
  }));

}

Game.prototype.SaveWorldMap = function() {

  const WORLD_MAP_ENCODING = "application/json";

  var temporaryLink = document.createElement("a");
  var encodedWorldMap = this.EncodeWorldMap();

  var file = new Blob(
    [encodedWorldMap],
	{"type": WORLD_MAP_ENCODING}
  );

  temporaryLink.href = URL.createObjectURL(file);
  temporaryLink.target = "_blank";
  
  temporaryLink.click();
  temporaryLink.remove();

}

Game.prototype.KeyEvent = function(event) {

  event.preventDefault();

  // Zoom event keys
  const ZOOM_PLUS = 107;
  const ZOOM_MINUS = 109;

  // Key constants
  const ARROW_KEY_LEFT = 37;
  const ARROW_KEY_UP = 38;
  const ARROW_KEY_RIGHT = 39;
  const ARROW_KEY_DOWN = 40;

  const LOWER_S_KEY = 83;
  const LOWER_M_KEY = 77;
  const LOWER_D_KEY = 68;
  const LOWER_Z_KEY = 90;
  const LOWER_R_KEY = 82;

  // Move the world map around the viewport
  if(event.keyCode === ARROW_KEY_LEFT) {
    this.viewport.Increment(-1, 0);
  } else if(event.keyCode === ARROW_KEY_UP) {
    this.viewport.Increment(0, -1);
  } else if(event.keyCode === ARROW_KEY_RIGHT) {
    this.viewport.Increment(1, 0);
  } else if(event.keyCode === ARROW_KEY_DOWN) {
    this.viewport.Increment(0, 1);
  }

  if(event.keyCode === ZOOM_PLUS) {
    this.Zoom(2);
  } else if(event.keyCode === ZOOM_MINUS) {
    this.Zoom(0.5);
  }

  if(event.keyCode === LOWER_R_KEY) {
    this.Redo();  
  }
  
  if(event.keyCode === LOWER_Z_KEY) {
    this.Undo();  
  }
  
  // Encode and save the world map
  if(event.keyCode === LOWER_S_KEY) {
    this.SaveWorldMap();
  }

  if(event.keyCode === LOWER_D_KEY) {
    this.ToggleDelete();
  }

  // Toggle object movement
  if(event.keyCode === LOWER_M_KEY) {
    this.ToggleMove();
  }

  this.Render();

}

/* Function Game.Redo
 * Redoes the previous command (place & delete)
 */
Game.prototype.Redo = function() {

  var command = this.redoCommandMemory.pop();
  
  if(!command) {
    return;
  }
  
  if(command.type === "delete") {
    this.worldMapTiles[command.index].objects.pop();
  } else if(command.type === "place") {
	this.AddTileObject(command.index, command.id);
  }
 
  this.undoCommandMemory.push(command);
  
}

/* Function Game.Undo
 * Undoes the previous command (place & delete)
 */
Game.prototype.Undo = function() {
	
  var command = this.undoCommandMemory.pop();
  
  if(!command) {
    return;  
  }
  
  if(command.type === "place") {
    this.worldMapTiles[command.index].objects.pop();
  } else if(command.type === "delete") {
	this.AddTileObject(command.index, command.id);
  }
  
  this.redoCommandMemory.push(command);
  
}

Game.prototype.ToggleMove = function() {

  this.moving = !this.moving;

  if(this.moving) {
    this.activeTileId = null;
    this.ChangePointer("move");
  } else {
    this.ChangePointer("default");
  }

}

Game.prototype.ToggleDelete = function() {

  this.deleting = !this.deleting;

  if(this.deleting) {
    this.activeTileId = null;
    this.ChangePointer("not-allowed");
  } else {
    this.ChangePointer("default");
  }

}

/* Function Game.Zoom
 * Zoom with a particular zoom factor
 */
Game.prototype.Zoom = function(factor) {

  // Limit zoom factors
  if(factor !== 0.5 && factor !== 2) {
    throw("The passed zoom factor must be either 0.5 or 2.");
  }

  // Calculate the new zoom level clamped between 0.125 and 2.
  this.zoomLevel = (this.zoomLevel * factor).clamp(0.125, 2);

  this.CenterCamera();

}

/* Function Game.CenterCamera
 * Centers the camera to the active tile
 */
Game.prototype.CenterCamera = function() {

  // Correct the viewport width for the zoom level
  const HALF_VIEWPORT_WIDTH = (10 / this.zoomLevel);
  
  this.viewport.SetPosition(
    (this.activePosition.i - HALF_VIEWPORT_WIDTH).clamp(0, this.WORLD_MAP_WIDTH),
    (this.activePosition.j - HALF_VIEWPORT_WIDTH).clamp(0, this.WORLD_MAP_HEIGHT)
  );
	
}

/* Number.clamp
 * Clamps a number between [min, max]
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
}

Game.prototype.ChangePointer = function(type) {
  this.canvas.style.cursor = type;
}

/* Public Function Game.ClickEvent
 * Handles mouse click events
 */
Game.prototype.ClickEvent = function() {
  
  // Get the active index
  var index = this.activePosition.GetIndex();
  
  // Delete objects
  if(this.deleting) {

    if(this.worldMapTiles[index] !== undefined) {

	  var id = this.worldMapTiles[index].objects.pop() || null;
	  
	  if(id !== null) {
		  
	    this.undoCommandMemory.push({
          "type": "delete",
          "id": id,
          "index": index
        });
		
	  }
	  
    }
	
  } else if(this.moving) {

    if(this.worldMapTiles[index] !== undefined) {
      this.activeTileId = this.worldMapTiles[index].objects.pop().id;
      this.moving = !this.moving;
    }

  } else {
	
    if(this.worldMapTiles[index] === undefined) {
      this.worldMapTiles[index] = new WorldTile(this.activePosition);
    }

    this.AddTileObject(index, this.activeTileId);

	this.undoCommandMemory.push({
      "type": "place",
	  "id": this.activeTileId,
	  "index": index
    });
	
  }
  
  this.Render();

}

Game.prototype.AddTileObject = function(index, id) {

  var worldMapTile = this.worldMapTiles[index];

  var groundTileIndex = worldMapTile.HasGroundObject();

  // Only add ground tile if it does not exist
  if(groundTileIndex === null) {
    worldMapTile.Add(id);
  }

  // Sort by the stack position
  // Ground tiles always go below objects
  this.worldMapTiles[index].objects.sort(function(a, b) {
    return a.stackPosition - b.stackPosition;
  });

}

Game.prototype.MovementDeferred = function(activePositionBuffer) {
  return this.activePosition.GetIndex() !== activePositionBuffer.GetIndex();
}

/* Function Game.MoveEvent
 * handles the mouse move event
 */
Game.prototype.MoveEvent = function(event) {

  var activePositionBuffer = this.GetTile(event);

  // If the mouse button is down
  // and a new tile is touched
  if(this.MovementDeferred(activePositionBuffer)) {
	  
    if(this.mouseDown) {
      this.ClickEvent();
    }
	
	// Set the active position to the buffer
    // and render the screen
    this.activePosition = activePositionBuffer;

	this.Render();
	
  }

}


// Return tile for clicked event
Game.prototype.GetTile = function(event) {

  // Get the canvas coordinates
  var coordinates = this.GetGameCoordinates(event);

  return new Position(
    coordinates.i,
    coordinates.j
  );

}

/*
 * Function Game.GetGameCoordinates
 * Returns the i, j position of the active tile
 */
Game.prototype.GetGameCoordinates = function(event) {

  // First get the canvas coordinates (x, y)
  var canvasCoordinates = this.GetCanvasCoordinates(event);

  // Transform the canvas coordinates (x, y) to game coordinates (i, j)
  // correcting for the zoomLevel, viewport and sprite width
  return {
    "i": Math.floor(canvasCoordinates.x / (32 * this.zoomLevel)) + this.viewport.i,
    "j": Math.floor(canvasCoordinates.y / (32 * this.zoomLevel)) + this.viewport.j
  }

}

/*
 * Function Game.GetCanvasCoordinates
 * Returns the x, y position in canvas coordinates
 */
Game.prototype.GetCanvasCoordinates = function(event) {

  return {
    "x": event.pageX - this.bounds.left,
    "y": event.pageY - this.bounds.top
  }

}

/* Game.LoadResources
 * Asynchronously loads the required resources
 */
Game.prototype.LoadResources = function() {

  this.resources = new Object();
  this.nResourcesLoaded = 0;

  // Determine the resource load chain
  this.resourceLoadChain = [{
    "id": "tileset",
    "src": "tileset.png",
    "type": "image"
  }];

  var self = this;

  // Asynchronous but concurrent loading of resources
  for(var i = 0; i < this.resourceLoadChain.length; i++) {

    (function(resource) {

      var src = "./resources/" + resource.src;

      var image = new Image();
      image.src = src;

      image.onload = function() {

        self.resources[resource.id] = image;

        if(++self.nResourcesLoaded >= self.resourceLoadChain.length) {
          self.LoadResourcesCallback();
        }
      }

    })(this.resourceLoadChain[i]);

  }
  

}

/*
 * Game.prototype.ClearGameScreen
 * Renders an entire blank game screen
 */
Game.prototype.ClearGameScreen = function() {

  this.context.clearRect(
    0,
    0,
    this.canvas.width,
    this.canvas.height
  );

}

/* Function Game.PartialRender
 * Renders a part of the viewport
 */
Game.prototype.PartialRender = function() {

  const RENDER_WIDTH = 3;

  var position = this.GetPixelPosition(this.activePosition);
  var index = this.activePosition.GetIndex();

  this.context.clearRect(
    position.x - (32 * RENDER_WIDTH),
    position.y - (32 * RENDER_WIDTH),
    32 * (2 * RENDER_WIDTH),
    32 * (2 * RENDER_WIDTH)
  );

  var position;

  for(var i = -RENDER_WIDTH; i < (RENDER_WIDTH + 1); i++) {
    for(var j = -RENDER_WIDTH; j < (RENDER_WIDTH + 1); j++) {

      var k = index + i + (j * this.WORLD_MAP_WIDTH);

      worldTile = this.worldMapTiles[k];

      // If the worldTile is defined
      if(worldTile !== undefined) {
        this.DrawWorldTile(worldTile);
      }

    }
  }

  this.DrawHoverObject();

}

/* Function Game.GetWorldIndex
 * Returns the world index as a 1D
 * representation of a 2D world (i, j)
 */
Game.prototype.GetWorldIndex = function(i, j) {

  return i + (j * this.WORLD_MAP_WIDTH);

}

/* Function Game.Render
 * Renders all objects in the viewport to screen
 */
Game.prototype.Render = function() {

  var index,
      worldTile;

  // Clear all the sprites from the game screen 
  this.ClearGameScreen();

  // Render the visible part of the world map
  // In the 20x20 tiles visible screen area
  // and correct for the zoom level
  for(var i = this.viewport.i; i < this.viewport.i + (20 / this.zoomLevel); i++) {
    for(var j = this.viewport.j; j < this.viewport.j + (20 / this.zoomLevel); j++) {
		
      // Get the world index
      index = this.GetWorldIndex(i, j);
		
      worldTile = this.worldMapTiles[index] || null;

      this.DrawWorldTile(worldTile);

    }
  }

  // Draw the mouse object
  this.DrawHoverObject();

}

Game.prototype.TilesetClick = function(event) {

  var img = document.getElementById("tileset-image");

  var x = Math.floor((event.pageX - img.offsetLeft) / 32);
  var y = Math.floor((event.pageY - img.offsetTop) / 32);
   
  this.activeTileId = x + (y * 32);
  
}

Game.prototype.LoadResourcesCallback = function() {

  document.body.onmousedown = function() { 
  	this.mouseDown = true;
  }.bind(this);
  
  document.body.onmouseup = function() {
  	this.mouseDown = false;
  }.bind(this);

  document.getElementById("tileset-image").addEventListener("click", this.TilesetClick.bind(this));

  // Add the keyboard handler
  window.addEventListener("keydown", this.KeyEvent.bind(this));

  // Add the mouse handlers
  this.canvas.addEventListener("mousemove", this.MoveEvent.bind(this));
  this.canvas.addEventListener("click", this.ClickEvent.bind(this));

}

/* Function Game.Draw
 * Draws object to canvas
 */
Game.prototype.Draw = function(id, position) {

  if(id === null) {
    return;
  }

  var pixelPosition = this.GetPixelPosition(position);

  var xSprite = (id % 32) * 32;
  var ySprite = Math.floor(id / 32) * 32;

  // Draw the image and correct for the zoom level
  this.context.drawImage(
    this.resources.tileset,
    xSprite,
    ySprite,
    32,
    32,
    pixelPosition.x,
    pixelPosition.y,
    32 * this.zoomLevel,
    32 * this.zoomLevel
  );
  
}

/* Function Game.DrawHoverObject
 * Draws the bounding box and active object
 */
Game.prototype.DrawHoverObject = function() {

  this.Draw(this.activeTileId, this.activePosition);
  this.DrawSelectionRectangle(this.activePosition);

}

/* Function Game.GetPixelPosition
 * Returns the pixel position of a position class
 * corrected for the viewport and zoom level
 */
Game.prototype.GetPixelPosition = function(position) {

  return {
    "x": 32 * (position.i - this.viewport.i) * this.zoomLevel,
    "y": 32 * (position.j - this.viewport.j) * this.zoomLevel
  }

}

/* Function Game.DrawSelectionRectangle
 * Draws the selection rectangle around the active tile
 */
Game.prototype.DrawSelectionRectangle = function(position) {

  var pixelPosition = this.GetPixelPosition(position);

  this.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.context.rect(
    0.5 + pixelPosition.x,
    0.5 + pixelPosition.y,
    31 * this.zoomLevel,
    31 * this.zoomLevel
  );

  this.context.stroke();

}

/* Function Game.DrawWorldTiles
 * Draws a world tile with all objects
 */
Game.prototype.DrawWorldTile = function(worldTile) {

  if(worldTile === null) {
    return;
  }

  // Draw all objects on the tile
  worldTile.objects.forEach(function(tileObject) {
    this.Draw(tileObject.id, worldTile.position);
  }, this);

}
