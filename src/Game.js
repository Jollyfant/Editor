/*
 * Public Class Game
 */
var Game = function() {

  // World map settings
  this.WORLD_MAP_WIDTH = 1000;
  this.WORLD_MAP_HEIGHT = 1000;
  this.PADDING = 20;

  // Get the canvas and context
  this.canvas = document.getElementById("gameScreenCanvas");
  this.canvas.height = 640 + this.PADDING;
  this.canvas.width = 640 + this.PADDING;

  this.context = this.canvas.getContext("2d");

  // Get the inventory context
  this.inventoryCanvas = document.getElementById("gameInventoryCanvas");
  this.inventoryCanvas.height = 640;
  this.inventoryCanvas.width = 62;

  this.inventoryContext = this.inventoryCanvas.getContext("2d");  
  
  // Create the viewport
  this.viewport = new Position(0, 0);
  this.inventoryViewport = new Position(0, 0);
  this.activePosition = new Position(0, 0);
  
  this.activeTileId = null;

  this.bounds = this.canvas.getBoundingClientRect();
  this.inventoryBounds = this.inventoryCanvas.getBoundingClientRect();

  // The world map array is one-dimensional of length
  // width * height.
  this.worldMapTiles = new Array(
    this.WORLD_MAP_WIDTH * this.WORLD_MAP_HEIGHT
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

  this.Render();

}

/* Game.GetClickedInventoryObject
 * Returns the clicked object from inventory
 */
Game.prototype.GetClickedInventoryObject = function(event) {

  // Only depends on the y-coordinates of the canvas
  var canvasCoordinates = this.GetRelativeCoordinates(event);
  var index = Math.floor(canvasCoordinates.y / 32) + this.inventoryViewport.j;

  this.activeTileId = this.objectInventory[index] || null;
  
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

  var object, nSprites, inventoryPointer;
  
  // Create a pointer usable in the forEach scope
  this.objectInventory = inventoryPointer = new Array();
  
  // Add all resources to the object inventory
  this.resourceLoadChain.forEach(function(object) {

    // The number of sprites in the sheet
    nSprites = 1 + (object.lastspriteid - object.firstspriteid);

    // Add all the sprites in the sprite sheet to the inventory
    for(var i = 0; i < nSprites; i++) {

      // Create a new sprite
      // Make sure to pass the index in the sprite sheet
      inventoryPointer.push(
        new Sprite(object, i)
      )
		
    }
  
  });
  
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

  var object;

  // We draw 20 sprites
  for(var i = 0; i < NUMBER_OF_SPRITES_IN_WINDOW; i++) {

    // Get the object from the inventory
    // and correct for the inventory viewport
    object = this.GetInventoryObject(
      i + this.inventoryViewport.j
    );

    // Draw the sprite to the inventory
    this.inventoryContext.drawImage(
      this.resources[object.resource],
      object.x,
      object.y,
      32,
      32,
      0,
      32 * i,
      32,
      32
    );

  }
  
}

/* Game.Init
 * Initializes the application
 */
Game.prototype.Init = function() {

  // Load all resources to memory
  this.LoadResources();

  // Initialize sprite animations
  this.InitAnimation(); 

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

  // Move the world map around the viewport
  switch(event.keyCode) {

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
      this.ZoomByFactor(2);
      break;

    // Zoom out
    case ZOOM_MINUS:
    case ZOOM_MINUS_OSX:
      this.ZoomByFactor(0.5);
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

  if(canvasCoordinates.x > 42) {
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

/* Function Game.ZoomByFactor
 * Zoom with a particular zoom factor
 */
Game.prototype.ZoomByFactor = function(factor) {

  // Limit zoom factors to integers
  if(factor !== 0.5 && factor !== 2) {
    throw("The passed zoom factor must be either 0.5 or 2.");
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

  var sliderIncrement = (this.objectInventory.length - 21) / (this.inventoryCanvas.height - SLIDER_WIDTH);
  var coordinates = this.GetRelativeCoordinates(event);

  // Grab in middle of handle
  coordinates.y -= 0.5 * SLIDER_WIDTH;

  // Update the viewport
  this.inventoryViewport.SetPosition(
    null,
    Math.floor(coordinates.y * sliderIncrement).Clamp(0, this.objectInventory.length - 21)
  );

  // Render the inventory
  this.RenderInventory();

}

/* Game.MoveViewport
 * Moves the viewport through handle bar drag
 */
Game.prototype.MoveViewport = function(event) {

  const SLIDER_WIDTH = 64;

  // Correct for the zoom level
  var zoomLevelCorrection = this.GetZoomLevelCorrection();
  var sliderIncrement = (1000 - zoomLevelCorrection) / (640 - SLIDER_WIDTH);

  // Propogate the event to get the canvas coordinates
  var coordinates = this.GetRelativeCoordinates(event);
  var maximumViewport = this.GetMaximumViewportIndex();

  if(this.clickedComponent.id === "viewportHandleV") {

    // Grab in the middle of the slider
    coordinates.y -= 0.5 * SLIDER_WIDTH;

    this.viewport.SetPosition(
      null,
      Math.floor(coordinates.y * sliderIncrement).Clamp(0, maximumViewport.j)
    );

  } else if(this.clickedComponent.id === "viewportHandleH") {

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
  var index = this.activePosition.GetIndex();

  // Delete objects
  if(this.deleting) {

    if(this.worldMapTiles[index] !== undefined) {

      var id = this.worldMapTiles[index].objects.pop() || null;
	  
      if(id !== null) {

        this.undoCommandMemoryBuffer.push({
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

    // Push to the command buffer
    this.undoCommandMemoryBuffer.push(
      new Command(
        this.activeTileId,
        index,
        "place"
      )
    );
	
  }
  
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
  var activePositionBuffer = this.GetTile(event);

  if(this.MovementDeferred(activePositionBuffer)) {
	  
    if(this.mouseDown) {
      this.ClickEvent(event);
    }

    // Set the active position to the buffer
    // and render the screen
    this.activePosition = activePositionBuffer;
	
  }

  this.Render();

}


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

  // First get the canvas coordinates in (x, y)
  var canvasCoordinates = this.GetRelativeCoordinates(event);

  // Transform the canvas coordinates (x, y) to game coordinates (i, j)
  // correcting for the zoomLevel, viewport and sprite width
  return {
    "i": Math.floor((canvasCoordinates.x) / (32 * this.zoomLevel)) + this.viewport.i,
    "j": Math.floor((canvasCoordinates.y) / (32 * this.zoomLevel)) + this.viewport.j
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
  const sliderIncrement = (640 - SLIDER_WIDTH) / (1000 - zoomLevelCorrection);

  this.context.fillStyle = "grey";

  // Render the horizontal bar
  this.context.DrawHandle(
    this.viewport.i * sliderIncrement,
    642 + 0.5,
    SLIDER_WIDTH,
    this.PADDING - 4
  );

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
    42 - 0.5,
    0 - 0.5,
    42,
    this.inventoryCanvas.height + 1
  );

  this.inventoryContext.stroke();

  var sliderIncrement = (this.inventoryCanvas.height - SLIDER_WIDTH) / (this.objectInventory.length - 21);

  this.inventoryContext.DrawHandle(
    44,
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
  this.nResourcesLoaded = 0;

  // Determine the resource load chain

  this.resourceLoadChain = [
    CATALOG_CONTENT[1]
  ];

  var self = this;

  // Asynchronous but concurrent loading of resources
  for(var i = 0; i < this.resourceLoadChain.length; i++) {

    (function(resource) {

      var src = "./sprites/" + resource.file;
	
      var image = new Image();
      image.src = src;
      image.onload = function() {

        self.resources[resource.file] = image;

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

  this.DrawHoverObject(this.activePosition);

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

  this.RenderInterface();

  var zoomLevelCorrection = this.GetZoomLevelCorrection();
  
  // Render the visible part of the world map
  // In the 20x20 tiles visible screen area
  // and correct for the zoom level
  for(var i = this.viewport.i; i < this.viewport.i + zoomLevelCorrection; i++) {
    for(var j = this.viewport.j; j < this.viewport.j + zoomLevelCorrection; j++) {
		
      // Get the world index
      index = this.GetWorldIndex(i, j);
		
      worldTile = this.worldMapTiles[index] || null;

      this.DrawWorldTile(worldTile);

    }
  }

  // Draw the mouse object
  this.DrawHoverObject(this.activePosition);

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

  // Add handler for the inventory canvas
  this.InitInventory();
  
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
        (this.inventoryViewport.j + (scrollUp ? -1 : 1)).Clamp(0, this.objectInventory.length - 21)
      );

      this.RenderInventory();
      break;

  }
  
}

/* Game.MouseDownEvent
 * Handles mouse down state
 */
Game.prototype.MouseDownEvent = function(event) {

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

/* Game.MouseDownEvent
 * Handles mouse up state
 */
Game.prototype.MouseUpEvent = function(event) {

  this.undoCommandMemory.push(this.undoCommandMemoryBuffer);

  // Set mouse up state
  this.mouseDown = false;
  this.clickedComponent = new Component();

}

/* Function Game.Draw
 * Draws object to canvas
 */
Game.prototype.Draw = function(object, position) {

  if(object === null) {
    return;
  }

  var pixelPosition = this.GetPixelPosition(position);

  // Draw the image and correct for the zoom level
  this.context.drawImage(
    this.resources[object.resource],
    object.x + 32 * (this.frameNumber % 6),
    object.y,
    object.width,
    object.height,
    pixelPosition.x,
    pixelPosition.y,
    32 * this.zoomLevel,
    32 * this.zoomLevel
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

  this.DrawSelectionRectangle(position);

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

/* Function Game.DrawSelectionRectangle
 * Draws the selection rectangle around the active tile
 */
Game.prototype.DrawSelectionRectangle = function(position) {

  // Transparency value for hover
  const HOVER_ALPHA_VALUE = 0.5;

  var pixelPosition = this.GetPixelPosition(position);

  if(pixelPosition === null) {
    return;
  }

  // Draw the phantom hover object with transparency
  this.context.globalAlpha = HOVER_ALPHA_VALUE;
  this.Draw(this.activeTileId, position);
  this.context.globalAlpha = 1.0;

  var pixelPosition = this.GetPixelPosition(position);

  this.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.context.rect(
    0.5 + pixelPosition.x,
    0.5 + pixelPosition.y,
    32 * this.zoomLevel,
    32 * this.zoomLevel
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
