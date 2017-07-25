/*
 * Public Class Game
 */
var Game = function() {

  this.APPLICATION_VERSION = "0.0.0";

  // World map settings
  this.WORLD_MAP_WIDTH = 32;
  this.WORLD_MAP_HEIGHT = 32;
  this.WORLD_MAP_DEPTH = 10;

  this.timeInitialized = new Date();

  this.information = document.getElementById("properties");

  this.PADDING = 20;

  // Get the canvas and context
  this.canvas = document.getElementById("gameScreenCanvas");
  this.canvas.height = 640 + this.PADDING;
  this.canvas.width = 640 + this.PADDING;

  this.context = this.canvas.getContext("2d");

  // Get the inventory context
  this.inventoryCanvas = document.getElementById("gameInventoryCanvas");
  this.inventoryCanvas.height = 640;
  this.inventoryCanvas.width = 320 + this.PADDING;

  this.inventoryContext = this.inventoryCanvas.getContext("2d");  
  
  // Create the viewport
  this.viewport = new Position(0, 0, 0);
  this.inventoryViewport = new Position(0, 0, 0);
  this.activePosition = new Position(0, 0, 0);
  
  this.activeLayer = 0;
  this.activeGameObject = null;
  this.rectangleSelectStart = null;

  this.bounds = this.canvas.getBoundingClientRect();
  this.inventoryBounds = this.inventoryCanvas.getBoundingClientRect();

  // The world map array is one-dimensional of length
  // width * height.
  this.worldMapTiles = new Array(
    this.WORLD_MAP_WIDTH * this.WORLD_MAP_HEIGHT * this.WORLD_MAP_DEPTH
  );

  this.zoomLevel = 1;

  this.moving = false;
  this.deleting = false;

  this.undoCommandMemory = new Array();
  this.undoCommandMemoryBuffer = new Array();

  this.mouseDown = false;
  this.clickedComponent = new Component();

  this.Init();

}

/* Game.InitAnimation
 * Initializes sprite animation
 */
Game.prototype.InitAnimation = function() {

  const ANIMATION_INTERVAL_MS = 333;

  // global frame number to keep track of
  this.frameNumber = 0;

  // Set the interval to update every N ms
  setInterval(
    this.IncrementAnimationFrame.bind(this),
    ANIMATION_INTERVAL_MS
  );

}

/* Game.IncrementAnimationFrame
 * Updates the running game frame bound between
 * 0 and 10
 */
Game.prototype.IncrementAnimationFrame = function(x) {

  // Increment the current frame number
  this.frameNumber = (this.frameNumber + 1) % 100;

  // Only render at normal zoom level
  if(this.zoomLevel === 1 && this.rectangleSelectStart === null) {
    //this.Render();
  }

}

/* Game.GetClickedInventoryObject
 * Returns the clicked object from inventory
 */
Game.prototype.GetClickedInventoryObject = function(event) {

  // Only depends on the y-coordinates of the canvas
  var canvasCoordinates = this.GetInventoryCoordinates(event);
  var index = 10 * (Math.floor(canvasCoordinates.y / 32) + this.inventoryViewport.j) + Math.floor(canvasCoordinates.x / 32);

  this.activeGameObject = this.objectInventory[index] || null;

}

/* Game.InitInventory
 * Initializes the inventory
 */
Game.prototype.InitInventory = function() {

  // Add all objects to the inventory
  this.CreateInventory();

  // Render the inventory to screen
  this.RenderInventory();
  
}

/* Game.CreateInventory
 * Adds all objects to the internal inventory
 */
Game.prototype.CreateInventory = function() {

  this.objectInventory = new Array();

  for(var i = 0; i < APPEARANCES.object.length; i++) {
    
    this.objectInventory.push(
      new GameObject(APPEARANCES.object[i])
    );
	
  }

  
}

/* Game.GetInventoryObject
 * Returns the inventory object at a given index
 */
Game.prototype.GetInventoryObject = function(index) {

  return this.objectInventory[index];

}

/* Game.RenderInventoryContent
 * Draws the object inventory of the editor
 * that is corrected for the inventory viewport
 */
Game.prototype.RenderInventoryContent = function() {

  const NUMBER_OF_SPRITES_IN_WINDOW = 20;

  var object, sprite;

  // We draw 20 sprites
  for(var i = 0; i < NUMBER_OF_SPRITES_IN_WINDOW; i++) {

    for(var j = 0; j < 10; j++) {

      // Get the object from the inventory
      // and correct for the inventory viewport
      object = this.GetInventoryObject(
        j + (10 * i) + this.inventoryViewport.j * 10
      );

      sprite = object.sprites[0];
          
      // Draw the sprite to the inventory
      this.inventoryContext.drawImage(
        this.resources[sprite.resource],
        sprite.x,
        sprite.y,
        sprite.width,
        sprite.height,
        32 * j,
        32 * i,
        32,
        32
      );

    }

  }
  
}

/* Game.Init
 * Initializes the application
 */
Game.prototype.Init = function() {

  this.SetInfo("Initializing application ...");

  // Load all resources to memory
  this.LoadResources();

  // Initialize sprite animations
  this.InitAnimation(); 

  // Render the scene
  this.Render();

}

Game.prototype.SetInfo = function(str) {
  this.information.innerHTML = str;
}

// Encodes the worldMapObject to JSON
Game.prototype.EncodeWorldMap = function() {

  return JSON.stringify(this.worldMapTiles.filter(function(x) {
    return x !== undefined;
  }).map(function(x) {
    return x.SaveObject();
  }));

}

/* Game.SaveWorldMap
 * Saves the world map to JSON
 */
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

/* Game.KeyEvent
 * Handles window key events
 */
Game.prototype.KeyEvent = function(event) {

  event.preventDefault();

  // Zoom event keys
  const ZOOM_PLUS = 107;
  const ZOOM_MINUS = 109;
  const ZOOM_PLUS_OSX = 187;
  const ZOOM_MINUS_OSX = 189;
  
  // Arrow key constants
  const ARROW_KEY_LEFT = 37;
  const ARROW_KEY_UP = 38;
  const ARROW_KEY_RIGHT = 39;
  const ARROW_KEY_DOWN = 40;

  // Other keys
  const LOWER_S_KEY = 83;
  const LOWER_M_KEY = 77;
  const LOWER_D_KEY = 68;
  const LOWER_Z_KEY = 90;
  const LOWER_R_KEY = 82;
  
  const SHIFT_KEY = 16;
  const ESCAPE_KEY = 27;

  // Move the world map around the viewport
  switch(event.keyCode) {

    // Automatically return when shift is fired
    case SHIFT_KEY:
      return;

    case ESCAPE_KEY:
      this.activeGameObject = null;
      break;
	  
    // Move viewport left
    case ARROW_KEY_LEFT:
      this.IncrementViewport(-1, 0);
      break;

    // Move viewport up
    case ARROW_KEY_UP:
      this.IncrementViewport(0, -1);
      break;

    // Move viewport right
    case ARROW_KEY_RIGHT:
      this.IncrementViewport(1, 0);
      break;

    // Move viewport down
    case ARROW_KEY_DOWN:
      this.IncrementViewport(0, 1);
      break;

    // Zoom in
    case ZOOM_PLUS:
    case ZOOM_PLUS_OSX:
      this.activeLayer = Math.min(this.activeLayer + 1, 10);
      break;

    // Zoom out
    case ZOOM_MINUS:
    case ZOOM_MINUS_OSX:
      this.activeLayer = Math.max(this.activeLayer - 1, 0);
      break;

  }

  if(event.keyCode === LOWER_Z_KEY) {
    this.Undo();  
  }
  
  // Encode and save the world map
  if(event.keyCode === LOWER_S_KEY) {
    this.SaveWorldMap();
  }

  // Toggle object deletion
  if(event.keyCode === LOWER_D_KEY) {
    this.ToggleDelete();
  }

  // Toggle object movement
  if(event.keyCode === LOWER_M_KEY) {
    this.ToggleMove();
  }

  this.Render();

}

/* Game.IncrementViewport
 * Moves the viewport up, down, left or right
 */
Game.prototype.IncrementViewport = function(i, j) {

  var maximumViewport = this.GetMaximumViewportIndex();

  // Clamp the position and correct for the zoom level
  this.viewport.SetPosition(
    (this.viewport.i + i).Clamp(0, maximumViewport.i),
    (this.viewport.j + j).Clamp(0, maximumViewport.j)
  );
  
}

/* Game.GetInventoryComponent
 * Returns the clicked part of the inventory
 */
Game.prototype.GetInventoryComponent = function(canvasCoordinates) {

  if(canvasCoordinates.x > 320) {
    return new Component("inventoryHandleV")
  } else {
    return new Component("inventoryWindow");
  }
  
}

Game.prototype.GetWorldComponent = function(canvasCoordinates) {
  
  if(canvasCoordinates.y > 640) {
    return new Component("viewportHandleH");
  } else if(canvasCoordinates.x > 640) {
    return new Component("viewportHandleV");
  } else {
    return new Component("gameWorldWindow");
  }
  

}

/* Function Game.Undo
 * Undoes the previous command (place & delete)
 */
Game.prototype.Undo = function() {

  // Get the previous buffer
  var commands = this.undoCommandMemory.pop();
 
  // No undo-to-do
  if(!commands) {
    return;
  }

  // Create a pointer for scoping forEach
  var worldMapTilesPointer = this.worldMapTiles;

  // Go over each command in the buffer
  commands.forEach(function(command) {

    if(command.type === "place") {
      worldMapTilesPointer[command.tile].objects.pop();
    }

  });
  
}

Game.prototype.ToggleMove = function() {

  this.moving = !this.moving;

  if(this.moving) {
    this.activeGameObject = null;
    this.ChangePointer("move");
  } else {
    this.ChangePointer("default");
  }

}

Game.prototype.ToggleDelete = function() {

  this.deleting = !this.deleting;

  if(this.deleting) {
    this.activeGameObject = null;
    this.ChangePointer("not-allowed");
  } else {
    this.ChangePointer("default");
  }

}

/* Function Game.ZoomByFactor
 * Zoom with a particular zoom factor
 */
Game.prototype.ZoomByFactor = function(factor) {

  // Limit zoom factors to integers
  if(factor !== 0.5 && factor !== 2) {
    throw("The passed zoom factor must be either 0.5 or 2.");
  }

  var zoomLevelCorrection = this.GetZoomLevelCorrection() / factor;
  
  if(zoomLevelCorrection > this.WORLD_MAP_WIDTH || zoomLevelCorrection > this.WORLD_MAP_HEIGHT) {
	return;  
  }
  
  // Calculate the new zoom level Clamped between 0.125 and 1.
  this.zoomLevel = (this.zoomLevel * factor).Clamp(0.125, 1);

  this.CenterViewport();

}

/* Game.GetZoomLevelCorrection
 * Returns the correction to be applied for the
 * current zoom level
 */
Game.prototype.GetZoomLevelCorrection = function() {
  return (20 / this.zoomLevel);	
}

/* Function Game.CenterViewport
 * Centers the camera to the active tile
 */
Game.prototype.CenterViewport = function() {

  // Correct the viewport width for the zoom level
  const HALF_VIEWPORT_WIDTH = 0.5 * this.GetZoomLevelCorrection();
  
  var maximumViewport = this.GetMaximumViewportIndex();
  
  this.viewport.SetPosition(
    (this.activePosition.i - HALF_VIEWPORT_WIDTH).Clamp(0, maximumViewport.i),
    (this.activePosition.j - HALF_VIEWPORT_WIDTH).Clamp(0, maximumViewport.j)
  );

}

/* Number.Clamp
 * Clamps a number between [min, max]
 */
Number.prototype.Clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
}

/* Game.ChangePointer
 * Changes the pointer style to specified type
 */
Game.prototype.ChangePointer = function(type) {
  document.body.style.cursor = type;
}

/* Game.MoveInventory
 * Moves the visible inventory 
 */
Game.prototype.MoveInventory = function(event) {

  // Width of the slider
  const SLIDER_WIDTH = 64;

  var sliderIncrement = ((this.objectInventory.length / 10) - 21) / (this.inventoryCanvas.height - SLIDER_WIDTH);
  var coordinates = this.GetRelativeCoordinates(event);

  // Grab in middle of handle
  coordinates.y -= 0.5 * SLIDER_WIDTH;

  // Update the viewport
  this.inventoryViewport.SetPosition(
    null,
    Math.floor(coordinates.y * sliderIncrement).Clamp(0, (this.objectInventory.length  / 10) - 21)
  );

  // Render the inventory
  this.RenderInventory();

}

/* Game.MoveViewport
 * Moves the viewport through handle bar drag
 */
Game.prototype.MoveViewport = function(event) {

  const SLIDER_WIDTH = 64;
  
  var sliderIncrement;
  
  // Correct for the zoom level
  var zoomLevelCorrection = this.GetZoomLevelCorrection();
  

  // Propogate the event to get the canvas coordinates
  var coordinates = this.GetRelativeCoordinates(event);
  var maximumViewport = this.GetMaximumViewportIndex();

  if(this.clickedComponent.id === "viewportHandleV") {

    sliderIncrement = (this.WORLD_MAP_HEIGHT - zoomLevelCorrection) / (640 - SLIDER_WIDTH);
  
    // Grab in the middle of the slider
    coordinates.y -= 0.5 * SLIDER_WIDTH;

    this.viewport.SetPosition(
      null,
      Math.floor(coordinates.y * sliderIncrement).Clamp(0, maximumViewport.j)
    );

  } else if(this.clickedComponent.id === "viewportHandleH") {
	  
    sliderIncrement = (this.WORLD_MAP_WIDTH - zoomLevelCorrection) / (640 - SLIDER_WIDTH);

    // Handle is in the middle of the slider
    coordinates.x -= 0.5 * SLIDER_WIDTH;

    this.viewport.SetPosition(
      Math.floor(coordinates.x * sliderIncrement).Clamp(0, maximumViewport.i),
      null
    );

  }

  // Render the viewport
  this.Render();

}

/* Function Game.GetMaximumViewportIndex
 * Returns the maximum allowed value for the viewport
 * corrected for the zoom level in (i, j)
 */
Game.prototype.GetMaximumViewportIndex = function() {

  // Correct for the zoom level
  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  return {
    "i": this.WORLD_MAP_WIDTH - zoomLevelCorrection,
    "j": this.WORLD_MAP_HEIGHT - zoomLevelCorrection
  }

}

/* Public Function Game.ClickEvent
 * Handles mouse click events
 */
Game.prototype.ClickEvent = function(event) {
  
  var coordinates = this.GetRelativeCoordinates(event);

  // Propogate click event to get the
  // clicked inventory object
  if(this.clickedComponent.id === "inventoryWindow") {
    return this.GetClickedInventoryObject(event);
  }

  // Get the active index
  var index = this.GetPositionIndex(this.activePosition);

  // Delete objects
  if(this.worldMapTiles[index] === undefined) {
    this.worldMapTiles[index] = new WorldTile(this.activePosition);
  }

  this.AddTileObject(index, this.activeGameObject);

  // Push to the command buffer
  this.undoCommandMemoryBuffer.push(
    new Command(
      this.activeGameObject,
      index,
      "place"
    )
  );

  this.Render();

}

var Command = function(id, tile, type) {

  this.id = id;
  this.tile = tile;
  this.type = type;

}

/* Game.AddTileObject
 * Adds a tile object to the tile
 */
Game.prototype.AddTileObject = function(index, gameObject) {

  if(gameObject === null) return;
  var worldMapTile = this.worldMapTiles[index];

  var groundTile = worldMapTile.HasGroundObject();

  // If the tile has a ground object replace it
  if(gameObject.ground && groundTile !== null) {
    worldMapTile.Replace(gameObject, groundTile); 
  } else {
    worldMapTile.Add(gameObject);
  }

  // Sort by the stack position
  // Ground tiles always go below objects
  this.worldMapTiles[index].objects.sort(function(a, b) {
    return a.stackPosition - b.stackPosition;
  });

}

Game.prototype.MovementDeferred = function(activePositionBuffer) {

  if(this.activePosition === null) {
    return true;
  }

  return this.GetPositionIndex(this.activePosition) !== this.GetPositionIndex(activePositionBuffer);

}

/* Game.SetMousePointerStyle
 * Updates the pointer style of the mouse based
 * on the provided component
 */
Game.prototype.SetMousePointerStyle = function(componentType) {

  if(componentType === "handle") {
    this.ChangePointer("move")
  } else if(componentType === "window") {
    this.ChangePointer("pointer");
  } else {
    this.ChangePointer("default");
  }

}

/* Game.DrawSelectionRectangle
 * Draws a rectangle for selection
 */
Game.prototype.DrawSelectionRectangle = function() {

  var iMinimum = Math.min(this.rectangleSelectStart.i, this.activePosition.i);
  var jMinimum = Math.min(this.rectangleSelectStart.j, this.activePosition.j);
  
  var iMaximum = Math.max(this.rectangleSelectStart.i, this.activePosition.i);
  var jMaximum = Math.max(this.rectangleSelectStart.j, this.activePosition.j);
  
  var pixelPositionMin = this.GetPixelPosition(new Position(iMinimum, jMinimum, 0));
  var pixelPositionMax = this.GetPixelPosition(new Position(iMaximum, jMaximum, 0));


  this.context.fillStyle = "green";
  
  this.context.globalAlpha = 0.5;
  
  this.context.fillRect(
    pixelPositionMin.x,
    pixelPositionMin.y,
    32 + pixelPositionMax.x - pixelPositionMin.x,
    32 + pixelPositionMax.y - pixelPositionMin.y
  );
  
  this.context.globalAlpha = 1;
  
}

/* Function Game.MoveEvent
 * handles the mouse move event
 */
Game.prototype.MoveEvent = function(event) {
  
  // Update the mouse pointer style
  this.SetMousePointerStyle(this.GetComponent(event).type);

  // Inventory handle is held down
  if(this.clickedComponent.id === "inventoryHandleV") {
    return this.MoveInventory(event);
  }

  // Viewport handles are held down
  if(this.clickedComponent.id === "viewportHandleH" || this.clickedComponent.id === "viewportHandleV") {
    return this.MoveViewport(event);
  }
 
  // Movement inside the game world window
  // Check if we are moving on a new tile
  // First get the buffered new position
  var activePositionBuffer = this.GetTile(event);

  // Position not in viewport
  if(!this.PositionInViewport(activePositionBuffer)) {
    return;
  }
  
  if(this.MovementDeferred(activePositionBuffer)) {

    // When selecting
    if(this.rectangleSelectStart !== null) {
		
      this.activePosition = activePositionBuffer;
	  this.DumpImageBuffer(0, 0);
      this.DrawSelectionRectangle();
	  
	  return;

    }
	
    if(this.bufferedImageData) {

      var pixels = this.GetPixelPosition(this.activePosition);
	
      if(pixels !== null) {

	    this.DumpImageBuffer(
          pixels.x - (32 * this.zoomLevel),
          pixels.y - (32 * this.zoomLevel)		
		);

      }
	
	}
	
     // Get the new data from the active position buffer
     var pixels = this.GetPixelPosition(activePositionBuffer);

	 if(pixels !== null) {

       this.bufferedImageData = this.context.getImageData(
         pixels.x - (32 * this.zoomLevel),
         pixels.y - (32 * this.zoomLevel),
         (64 * this.zoomLevel),
         (64 * this.zoomLevel)
       );

	 }
	 
     // Draw hover object on the new buffered position
     this.DrawHoverObject(activePositionBuffer);
	 
	    // Set the active position to the buffer
      this.activePosition = activePositionBuffer;	
	
      if(this.mouseDown) {
        this.ClickEvent(event);
      }


  }
 
}

Game.prototype.DumpImageBuffer = function(x, y) {
	
  this.context.putImageData(
    this.bufferedImageData,
    x,
    y
  );
  
}

Game.prototype.GetTile = function(event) {

  // Get the canvas coordinates
  var coordinates = this.GetGameCoordinates(event);

  return new Position(
    coordinates.i,
    coordinates.j,
    coordinates.k
  );

}

/*
 * Function Game.GetGameCoordinates
 * Returns the i, j position of the active tile
 */
Game.prototype.GetGameCoordinates = function(event) {

  // First get the canvas coordinates in (x, y)
  var canvasCoordinates = this.GetRelativeCoordinates(event);

  // Transform the canvas coordinates (x, y) to game coordinates (i, j)
  // correcting for the zoomLevel, viewport and sprite width
  return {
    "i": Math.floor((canvasCoordinates.x) / (32 * this.zoomLevel)) + this.viewport.i,
    "j": Math.floor((canvasCoordinates.y) / (32 * this.zoomLevel)) + this.viewport.j,
    "k": this.activeLayer
  }

}

/*
 * Function Game.GetRelativeCoordinates
 * Returns the x, y position in canvas coordinates
 */
Game.prototype.GetInventoryCoordinates = function(event) {

  // Correct for the canvas position
  return {
    "x": event.pageX - this.inventoryBounds.left,
    "y": event.pageY - this.inventoryBounds.top
  }

}

/*
 * Function Game.GetRelativeCoordinates
 * Returns the x, y position in canvas coordinates
 */
Game.prototype.GetRelativeCoordinates = function(event) {

  // Correct for the canvas position
  return {
    "x": event.pageX - this.bounds.left,
    "y": event.pageY - this.bounds.top
  }

}

/* Game.RenderSliderHandle
 * Renders the slider handles in the correct 
 * position as function of the viewport
 */
Game.prototype.RenderSliderHandle = function() {

  // Correct for the zoom level
  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  const SLIDER_WIDTH = 64;
  var sliderIncrement;
  
  sliderIncrement = (640 - SLIDER_WIDTH) / (this.WORLD_MAP_WIDTH - zoomLevelCorrection);

  this.context.fillStyle = "grey";

  // Render the horizontal bar
  this.context.DrawHandle(
    this.viewport.i * sliderIncrement,
    642 + 0.5,
    SLIDER_WIDTH,
    this.PADDING - 4
  );

  sliderIncrement = (640 - SLIDER_WIDTH) / (this.WORLD_MAP_HEIGHT - zoomLevelCorrection);
	
  // Render the vertical bar
  this.context.DrawHandle(
    642 + 0.5,
    this.viewport.j * sliderIncrement,
    this.PADDING - 4,
    SLIDER_WIDTH
  );

}

Game.prototype.ClearInventory = function() {

  this.inventoryContext.clearRect(
    0,
    0,
    this.inventoryCanvas.width,
    this.inventoryCanvas.height
  );

}

/* Game.RenderInventory
 * Renders the visible part of the game inventory
 */
Game.prototype.RenderInventory = function() {

  this.ClearInventory();

  this.RenderInventoryInterface();

  this.RenderInventoryContent();

}

/* Game.RenderInventoryInterface
 * Renders the interface of the inventory
 */
Game.prototype.RenderInventoryInterface = function() {

  const SLIDER_WIDTH = 64;

  this.inventoryContext.strokeStyle = "black";

  this.inventoryContext.beginPath();

  // Use half pixels to prevent aliasing effects
  this.inventoryContext.rect(
    320 - 0.5,
    0 - 0.5,
    320,
    this.inventoryCanvas.height + 1
  );

  this.inventoryContext.stroke();

  var sliderIncrement = (this.inventoryCanvas.height - SLIDER_WIDTH) / ((this.objectInventory.length / 10) - 21);

  this.inventoryContext.DrawHandle(
    322,
    this.inventoryViewport.j * sliderIncrement,
    16,
    SLIDER_WIDTH
  );

}

/* CanvasRenderingContext2D.DrawHandle
 * Draws a grabbable handle
 */
CanvasRenderingContext2D.prototype.DrawHandle = function(x, y, width, height) {

  const RADIUS = 6;
  const HANDLE_MIDDLE_WIDTH = 6;

  this.fillStyle = "grey";

  this.beginPath();
  this.moveTo(x + RADIUS , y);
  this.arcTo(x + width, y, x + width, y + height, RADIUS);
  this.arcTo(x + width, y + height, x, y + height, RADIUS);
  this.arcTo(x, y + height, x, y, RADIUS);
  this.arcTo(x, y, x + width, y, RADIUS);
  this.closePath();

  this.fill();

  // Draw white handle stripes in the middle
  this.beginPath();
  this.strokeStyle = "white";

  // Vertical or horizontal stripes
  if(height < width) {
    this.moveTo(x + 0.5 * width - HANDLE_MIDDLE_WIDTH, y + 0.5 * height);
    this.lineTo(x + 0.5 * width + HANDLE_MIDDLE_WIDTH, y + 0.5 * height);
    this.moveTo(x + 0.5 * width - HANDLE_MIDDLE_WIDTH, y + 0.3 * height);
    this.lineTo(x + 0.5 * width + HANDLE_MIDDLE_WIDTH, y + 0.3 * height);
    this.moveTo(x + 0.5 * width - HANDLE_MIDDLE_WIDTH, y + 0.7 * height);
    this.lineTo(x + 0.5 * width + HANDLE_MIDDLE_WIDTH, y + 0.7 * height);
  } else {
    this.moveTo(x + 0.3 * width, y + 0.5 * height - HANDLE_MIDDLE_WIDTH);
    this.lineTo(x + 0.3 * width, y + 0.5 * height + HANDLE_MIDDLE_WIDTH);
    this.moveTo(x + 0.5 * width, y + 0.5 * height - HANDLE_MIDDLE_WIDTH);
    this.lineTo(x + 0.5 * width, y + 0.5 * height + HANDLE_MIDDLE_WIDTH);
    this.moveTo(x + 0.7 * width, y + 0.5 * height - HANDLE_MIDDLE_WIDTH);
    this.lineTo(x + 0.7 * width, y + 0.5 * height + HANDLE_MIDDLE_WIDTH);
  }

  this.closePath();
  this.stroke();

}

/* Game.RenderInterface
 * Renders the graphical user interface
 */
Game.prototype.RenderInterface = function() {

  this.context.strokeStyle = "black";

  this.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.context.rect(
    -0.5,
    0.5 + 640,
    641,
    this.PADDING
  );

  this.context.stroke();
  this.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.context.rect(
    640 + 0.5,
    -0.5,
    this.PADDING,
    641
  );

  this.context.stroke();

  // Render the slider handles
  this.RenderSliderHandle();

}

/* Game.LoadResources
 * Asynchronously loads the required resources
 */
Game.prototype.LoadResources = function() {
  
  this.resources = new Object();
  nResourcesLoaded = 1;

  // Determine the resource load chain
  this.resourceLoadChain = CATALOG_CONTENT;
  
  var self = this;
  var fn;

  // Asynchronous but concurrent loading of resources
  (fn = function() {

    self.SetInfo("Loading sprite resources ... " + (100 * nResourcesLoaded / (self.resourceLoadChain.length - 1)).toFixed(0) + "%");

    var resource = self.resourceLoadChain[nResourcesLoaded];

    // Create a new image
    var image = new Image();
    image.src = "./sprites/" + resource.file + ".lzma.png";

    // Image load callback
    image.onload = function() {

      self.resources[resource.file] = image;

      if(++nResourcesLoaded >= self.resourceLoadChain.length - 1) {
        self.LoadResourcesCallback();
      } else {
        fn();
      }

    }

  })();

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

Game.prototype.GetPositionIndex = function(position) {

  return position.i + (position.j * this.WORLD_MAP_WIDTH) + (position.k * this.WORLD_MAP_WIDTH * this.WORLD_MAP_HEIGHT);

}

/* Game.RenderLayer
 * Renders a layer of the world
 */
Game.prototype.RenderLayer = function(layer) {

  // Get the zoom level correction
  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  // Go over each tile in the layer
  for(var i = this.viewport.i; i < this.viewport.i + zoomLevelCorrection; i++) {

    for(var j = this.viewport.j; j < this.viewport.j + zoomLevelCorrection; j++) {

      // Get the world index for the layer and tile
      index = this.GetPositionIndex(new Position(i, j, layer));

      worldTile = this.worldMapTiles[index] || null;

      this.DrawWorldTile(worldTile);

    }

  }

}

/* Game.SetLayerTransparency
 * Sets the transparency of all lower layers
 */
Game.prototype.SetLayerTransparency = function() {

  // Transparency of lower layers
  const LAYER_TRANSPARENCY = 128;

  // Get the canvas bitmap
  var canvasBitmap = this.context.getImageData(
    0,
    0,
    this.canvas.width - this.PADDING,
    this.canvas.height - this.PADDING
  );
  
  // Modify transparency of bitmap
  // hit each fourth element (RGBA)
  for(var i = 0; i < canvasBitmap.data.length; i += 4) {
    canvasBitmap.data[i + 3] = LAYER_TRANSPARENCY;
  }

  // Write back to canvas
  this.context.putImageData(
    canvasBitmap,
    0,
    0
  );

}

/* Game.RenderWindowBackground
 * Renders black background
 */
Game.prototype.RenderWindowBackground = function() {

  // Set the composite operation to destination over
  this.context.globalCompositeOperation = "destination-over";

  this.context.fillStyle = "black";

  this.context.fillRect(
    0,
    0,
    this.canvas.width - this.PADDING,
    this.canvas.height - this.PADDING
  );

  // Set the composite operation to source over
  this.context.globalCompositeOperation = "source-over";

}

/* Function Game.Render
 * Renders all objects in the viewport to screen
 */
Game.prototype.Render = function() {

  // Clear image buffer
  this.bufferedImageData = null;
 
  // Clear all the sprites from the game screen 
  this.ClearGameScreen();

  // Call render for the GUI
  this.RenderInterface();

  // Render all layers below the active layer
  for(var layer = 0; layer < this.activeLayer; layer++) {
    this.RenderLayer(layer);
  }

  // Set transparency of lower layers and render black background 
  this.SetLayerTransparency();

  this.RenderWindowBackground();

  // Render the active layer
  this.RenderLayer(this.activeLayer);
  
}

/* Game.LoadResourcesCallback
 * Fires when all resources are loaded
 */
Game.prototype.LoadResourcesCallback = function() {

  // Add the keyboard handler
  window.addEventListener("keydown", this.KeyEvent.bind(this));

  // Add the mouse handlers
  window.addEventListener("mousemove", this.MoveEvent.bind(this));
  window.addEventListener("mousedown", this.MouseDownEvent.bind(this));
  window.addEventListener("mouseup", this.MouseUpEvent.bind(this));
  window.addEventListener("wheel", this.ScrollEvent.bind(this));

  window.addEventListener("dblclick", this.DoubleClickEvent.bind(this));

  // Add handler for the inventory canvas
  this.InitInventory();

  this.SetInfo("Map editor initialized in " + (Date.now() - this.timeInitialized) + "ms.");
  
}

/* Game.DoubleClickEvent
 * Handles double click events
 */
Game.prototype.DoubleClickEvent = function(event) {

  // Return if an item is selected
  if(this.activeGameObject !== null) {
    return;
  }

  // Get the active index
  var index = this.GetPositionIndex(this.activePosition);

  if(this.worldMapTiles[index] !== undefined) {
    var object = this.worldMapTiles[index].objects[0];
  }

  // If cumulative prompt the item count
  if(object.gameObjectPointer.cumulative) {
    object.count = Number(prompt("Item count"));
  }

  this.Render();

}

/* Game.ScrollEvent
 * Handles scroll event 
 */
Game.prototype.ScrollEvent = function(event) {

  // Disable default scrolling
  event.preventDefault();

  // Check movement delta for direction
  var scrollUp = event.deltaY < 0;

  switch(event.target) {

    // Scrolling in canvas
    case this.canvas:

      this.ZoomByFactor(scrollUp ? 2 : 0.5);
      
      this.Render();
      break;

    // Scrolling in inventory
    case this.inventoryCanvas:

      // Update the inventory viewport
      this.inventoryViewport.SetPosition(
        null,
        (this.inventoryViewport.j + (scrollUp ? -1 : 1)).Clamp(0, (this.objectInventory.length / 10) - 21)
      );

      this.RenderInventory();
      break;

  }
  
}

Game.prototype.DrawTileRectangle = function() {
	
  var iMinimum = Math.min(this.rectangleSelectStart.i, this.activePosition.i);
  var jMinimum = Math.min(this.rectangleSelectStart.j, this.activePosition.j);
  
  var iMaximum = Math.max(this.rectangleSelectStart.i, this.activePosition.i);
  var jMaximum = Math.max(this.rectangleSelectStart.j, this.activePosition.j);
  
  for(var i = iMinimum; i <= iMaximum; i++) {
    for(var j = jMinimum; j <= jMaximum; j++) {
  	  
      // Get the active index
  	  var position = new Position(i, j, this.activeLayer);
  	
      var index = this.GetPositionIndex(position);
      
      // Delete objects
      if(this.worldMapTiles[index] === undefined) {
        this.worldMapTiles[index] = new WorldTile(position);
      }
      
      this.AddTileObject(index, this.activeGameObject);
  	
    }
  }
  
  this.rectangleSelectStart = null;
	
}

/* Game.MouseUpEvent
 * Handles mouse up state
 */
Game.prototype.MouseUpEvent = function(event) {

  // Update the mouse state
  this.mouseDown = false;
  
  // If a rectangle has been selected
  if(this.rectangleSelectStart !== null) {

    // Empty the image buffer
    this.bufferedImageData = null;

    // Draw all objects in selection
    // and fully render the scene
    this.DrawTileRectangle();
	
    this.Render();

    return;

  }
  
  this.undoCommandMemory.push(this.undoCommandMemoryBuffer);

  this.clickedComponent = new Component();

}

/* Game.MouseDownEvent
 * Handles mouse down state
 */
Game.prototype.MouseDownEvent = function(event) {

  // Shift key is pressed during mouse down
  if(event.shiftKey) {

    // Create a position for the selection start
    this.rectangleSelectStart = new Position(
      this.activePosition.i,
      this.activePosition.j,
      this.activePosition.k
    );

    // Freeze and capture the full current scene
    this.bufferedImageData = this.context.getImageData(
      0,
      0,
      this.canvas.width - this.PADDING,
      this.canvas.height - this.PADDING
    );

    return;
	
  }

  // Push and reset the command memory buffer
  this.undoCommandMemoryBuffer = new Array();

  // Set mouse down state
  this.mouseDown = true;
  
  this.clickedComponent = this.GetComponent(event);
  
  // Propagate to the click event
  this.ClickEvent(event);
  
}

Game.prototype.GetComponent = function(event) {

  // Get the clicked component in the interface
  switch(event.target.id) {

    case "gameScreenCanvas":
      return this.GetWorldComponent(this.GetRelativeCoordinates(event));

    case "gameInventoryCanvas":
      return this.GetInventoryComponent(this.GetInventoryCoordinates(event));

    default:
      return new Component();

  }

}



/* Function Game.Draw
 * Draws object to canvas
 */
Game.prototype.Draw = function(object, position, elevation, count) {
	
  // Default elevation of 0
  elevation = elevation || 0;
  count = count || 0;
  
  if(object === null) {
    return;
  }
	
  var pixelPosition = this.GetPixelPosition(position);
  
  var spriteIndex = (position.i % object.pattern.width) + object.pattern.width * (position.j % object.pattern.height);

  // Player the animation
  if(object.animated) {
    spriteIndex = (spriteIndex + this.frameNumber) % (object.sprites.length - 1);  
  } else if(object.cumulative) {
    spriteIndex = object.GetCountIndex(count);
  }

  var sprite = object.sprites[spriteIndex];

  // Draw the image and correct for the zoom level,
  // sprite size, and object elevation
  this.context.drawImage(
    this.resources[sprite.resource],
    sprite.x,
    sprite.y,
    sprite.width,
    sprite.height,
    pixelPosition.x + (32 - sprite.width - elevation) * this.zoomLevel,
    pixelPosition.y + (32 - sprite.height - elevation) * this.zoomLevel,
    sprite.width * this.zoomLevel,
    sprite.height * this.zoomLevel
  );
  
}

/* Function Game.PositionInViewport
 * Returns Boolean whether a position is in the viewport
 */
Game.prototype.PositionInViewport = function(position) {

  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  // Apply correction for zoom level
  return (
    (position.i > -1) &&
    (position.j > -1) &&
    (position.i < (this.viewport.i + zoomLevelCorrection)) &&
    (position.j < (this.viewport.j + zoomLevelCorrection))
  );

}

/* Function Game.DrawHoverObject
 * Draws the bounding box and active object
 */
Game.prototype.DrawHoverObject = function(position) {

  this.DrawSelectionTile(position);

}

/* Function Game.GetPixelPosition
 * Returns the pixel position of a position class in
 * world coordinates (i, j) corrected for the viewport 
 * and zoom level
 */
Game.prototype.GetPixelPosition = function(position) {

  // If the position is not within
  // the viewport return null
  if(!this.PositionInViewport(position)) {
    return null;
  }

  return {
    "x": 32 * (position.i - this.viewport.i) * this.zoomLevel,
    "y": 32 * (position.j - this.viewport.j) * this.zoomLevel
  }

}

/* Function Game.DrawSelectionTile
 * Draws the selection rectangle around the active tile
 */
Game.prototype.DrawSelectionTile = function(position) {

  // Transparency value for hover
  const HOVER_ALPHA_VALUE = 0.5;

  var pixelPosition = this.GetPixelPosition(position);

  if(pixelPosition === null) {
    return;
  }

  // Draw the phantom hover object with transparency
  this.context.globalAlpha = HOVER_ALPHA_VALUE;
  this.Draw(this.activeGameObject, position);
  this.context.globalAlpha = 1.0;

  var pixelPosition = this.GetPixelPosition(position);

  this.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.context.rect(
    0.5 + pixelPosition.x,
    0.5 + pixelPosition.y,
    Math.floor(31 * this.zoomLevel),
    Math.floor(31 * this.zoomLevel)
  );

  this.context.stroke();

}

/* Function Game.DrawWorldTiles
 * Draws a world tile with all objects
 */
Game.prototype.DrawWorldTile = function(worldTile) {

  const MAXIMUM_ELEVATION = 24;
  
  if(worldTile === null) {
    return;
  }

  // Draw all objects on the tile
  // and correct for item elevations
  var elevation = 0;
  
  worldTile.objects.forEach(function(tileObject) {

    this.Draw(
	  tileObject.gameObjectPointer,
	  worldTile.position,
	  elevation,
      tileObject.count
	);

	// Keep track of the tile elevation
	elevation = Math.min(
	  elevation + tileObject.gameObjectPointer.elevation,
	  MAXIMUM_ELEVATION
	);
	
  }, this);

}
