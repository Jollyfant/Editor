/*
 * Public Class Game
 */
var Editor = function() {

  this.APPLICATION_VERSION = "0.0.0";

  // World map settings
  this.WORLD_MAP_WIDTH = 32 * 10;
  this.WORLD_MAP_HEIGHT = 32 * 10;
  this.WORLD_MAP_DEPTH = 14;
  this.PADDING = 20;

  // Create new game world canvas
  this.canvas = new Canvas(
    "gameScreenCanvas",
    640 + this.PADDING,
    640 + this.PADDING
  );

  // Create a container for the inventory
  this.inventory = new Inventory("gameInventoryCanvas");
  
  this.information = document.getElementById("properties");

  // Keep impure application state
  this.state = {
    "viewport": new Position(0, 0, 0),
    "activePosition": null,
    "activeGameObject": null,
    "activeComponent": new Component(),
    "rectangleSelectStart": null, 
    "activeLayer": 0,
    "zoomLevel": 1,
    "mouseDown": false,
    "bufferedImageData": null
  }

  // The world map array is one-dimensional of length
  // width * height * depth.
  this.worldMapTiles = new Array(
    this.WORLD_MAP_WIDTH * this.WORLD_MAP_HEIGHT * this.WORLD_MAP_DEPTH
  );

  this.undoCommandMemory = new Array();
  this.undoCommandMemoryBuffer = new Array();

  // Initialize the application
  this.Init();

}

/* Game.InitAnimation
 * Initializes sprite animation
 */
Editor.prototype.InitAnimation = function() {

  // global frame number to keep track of
  this.frameNumber = 0;

  // Set the interval to update every N ms
  setInterval(
    this.IncrementAnimationFrame.bind(this),
    CONFIG.ANIMATION_INTERVAL_MS
  );

}

/* Game.IncrementAnimationFrame
 * Updates the running game frame bound between
 * 0 and 10
 */
Editor.prototype.IncrementAnimationFrame = function(x) {

  // Increment the current frame number
  this.frameNumber = (this.frameNumber + 1) % 100;

  // Only render at normal zoom level and while not selecting
  if(this.state.zoomLevel === 1 && this.state.rectangleSelectStart === null) {
    this.Render();
  }

}

/* Game.SetClickedInventoryObject
 * Returns the clicked object from inventory
 */
Editor.prototype.SetClickedInventoryObject = function(event) {

  // Only depends on the y-coordinates of the canvas
  var canvasCoordinates = this.GetInventoryCoordinates(event);
  var index = 10 * (Math.floor(canvasCoordinates.y / 32) + this.inventory.viewport.j) + Math.floor(canvasCoordinates.x / 32);

  this.state.activeGameObject = this.objectInventory[index] || null;
  console.log(this.state.activeGameObject);

}

/* Game.InitInventory
 * Initializes the inventory
 */
Editor.prototype.InitInventory = function() {

  // Add all objects to the inventory
  this.CreateInventory();

  // Render the inventory to screen
  this.RenderInventory();
  
}

/* Game.CreateInventory
 * Adds all objects to the internal inventory
 */
Editor.prototype.CreateInventory = function() {

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
Editor.prototype.GetInventoryObject = function(index) {

  return this.objectInventory[index];

}

/* Game.RenderInventoryContent
 * Draws the object inventory of the editor
 * that is corrected for the inventory viewport
 */
Editor.prototype.RenderInventoryContent = function() {

  const NUMBER_OF_SPRITES_IN_WINDOW = 20;

  var object, sprite;

  for(var i = 0; i < NUMBER_OF_SPRITES_IN_WINDOW; i++) {

    for(var j = 0; j < 10; j++) {

      // Get the object from the inventory
      // and correct for the inventory viewport
      object = this.GetInventoryObject(
        j + (10 * i) + this.inventory.viewport.j * 10
      );

      // Get the first sprite in case of animation or pattern
      sprite = object.sprites[0];
          
      // Draw the sprite to the inventory
      this.inventory.canvas.context.drawImage(
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
Editor.prototype.Init = function() {

  this.SetInfo("Initializing application ...");
  this.timeInitialized = new Date();

  // Load all resources to memory
  this.LoadResources();

  // Initialize sprite animations
  this.InitAnimation(); 

  // Render the scene
  this.Render();

}

Editor.prototype.SetInfo = function(str) {
  this.information.innerHTML = str;
}

// Encodes the worldMapObject to JSON
Editor.prototype.EncodeWorldMap = function() {

  return JSON.stringify(this.worldMapTiles.filter(function(x) {
    return x !== undefined;
  }).map(function(x) {
    return x.SaveObject();
  }));

}

/* Game.SaveWorldMap
 * Saves the world map to JSON
 */
Editor.prototype.SaveWorldMap = function() {

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
Editor.prototype.KeyEvent = function(event) {

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

    // Deselect any items
    case ESCAPE_KEY:
      this.state.activeGameObject = null;
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
      this.IncrementActiveLayer(1);
      break;

    // Zoom out
    case ZOOM_MINUS:
    case ZOOM_MINUS_OSX:
      this.IncrementActiveLayer(-1);
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

/* Game.IncrementAciveLayer
 * Increments the active layer up (+1) or down (-1)
 */
Editor.prototype.IncrementActiveLayer = function(direction) {

  this.state.activeLayer = (this.state.activeLayer + direction).Clamp(0, this.WORLD_MAP_DEPTH);

}

/* Game.IncrementViewport
 * Moves the viewport up, down, left or right
 */
Editor.prototype.IncrementViewport = function(i, j) {

  var maximumViewport = this.GetMaximumViewportIndex();

  // Clamp the position and correct for the zoom level
  this.state.viewport.SetPosition(
    (this.state.viewport.i + i).Clamp(0, maximumViewport.i),
    (this.state.viewport.j + j).Clamp(0, maximumViewport.j)
  );
  
}

/* Game.GetInventoryComponent
 * Returns the clicked part of the inventory
 */
Editor.prototype.GetInventoryComponent = function(canvasCoordinates) {

  if(canvasCoordinates.x > 320) {
    return new Component("inventoryHandleV");
  } else {
    return new Component("inventoryWindow");
  }
  
}

Editor.prototype.GetWorldComponent = function(canvasCoordinates) {
  
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
Editor.prototype.Undo = function() {

  // Get the previous buffer
  var commands = this.undoCommandMemory.pop();
 
  // No undo-to-do
  if(!commands) {
    return;
  }

  // Go over each command in the buffer
  commands.forEach(function(command) {

    if(command.type === "add") {
      this.GetWorldMapTile(command.position).PopTopObject();
    }

  }, this);
  
}

Editor.prototype.ZoomInvalid = function(zoomLevelCorrection) {
  return (zoomLevelCorrection > this.WORLD_MAP_WIDTH || zoomLevelCorrection > this.WORLD_MAP_HEIGHT);
}

/* Function Game.ZoomByFactor
 * Zoom with a particular zoom factor
 */
Editor.prototype.ZoomByFactor = function(factor) {

  // Limit zoom factors to integers
  if(factor !== 0.5 && factor !== 2) {
    throw("The passed zoom factor must be either 0.5 or 2.");
  }

  var zoomLevelCorrection = (1 / factor) * this.GetZoomLevelCorrection();
  
  if(this.ZoomInvalid()) {
    return;
  }
  
  // Calculate the new zoom level Clamped between 0.125 and 1.
  this.state.zoomLevel = (this.state.zoomLevel * factor).Clamp(0.125, 1);

  this.CenterViewport();

}

/* Game.GetZoomLevelCorrection
 * Returns the correction to be applied for the
 * current zoom level
 */
Editor.prototype.GetZoomLevelCorrection = function() {
  return (20 / this.state.zoomLevel);	
}

/* Function Game.CenterViewport
 * Centers the camera to the active tile
 */
Editor.prototype.CenterViewport = function() {

  // Correct the viewport width for the zoom level
  const HALF_VIEWPORT_WIDTH = 0.5 * this.GetZoomLevelCorrection();
  
  var maximumViewport = this.GetMaximumViewportIndex();
  
  this.state.viewport.SetPosition(
    (this.state.activePosition.i - HALF_VIEWPORT_WIDTH).Clamp(0, maximumViewport.i),
    (this.state.activePosition.j - HALF_VIEWPORT_WIDTH).Clamp(0, maximumViewport.j)
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
Editor.prototype.ChangePointer = function(type) {

  document.body.style.cursor = type;

}

/* Game.MoveInventory
 * Moves the visible inventory 
 */
Editor.prototype.MoveInventory = function(event) {

  // Width of the slider
  const SLIDER_WIDTH = 64;

  var sliderIncrement = ((this.objectInventory.length / 10) - 21) / (this.inventory.canvas.height - SLIDER_WIDTH);
  var coordinates = this.GetRelativeCoordinates(event);

  // Grab in middle of handle
  coordinates.y -= 0.5 * SLIDER_WIDTH;

  // Update the viewport
  this.inventory.viewport.SetPosition(
    null,
    Math.floor(coordinates.y * sliderIncrement).Clamp(0, (this.objectInventory.length  / 10) - 21)
  );

  // Render the inventory
  this.RenderInventory();

}

/* Game.MoveViewport
 * Moves the viewport through handle bar drag
 */
Editor.prototype.MoveViewport = function(event) {

  const SLIDER_WIDTH = 64;
  
  var sliderIncrement;
  
  // Correct for the zoom level
  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  // Propogate the event to get the canvas coordinates
  var coordinates = this.GetRelativeCoordinates(event);
  var maximumViewport = this.GetMaximumViewportIndex();

  var currentViewport = new Position(this.state.viewport.i, this.state.viewport.j, 0);

  if(this.state.activeComponent.id === "viewportHandleV") {

    sliderIncrement = (this.WORLD_MAP_HEIGHT - zoomLevelCorrection) / (640 - SLIDER_WIDTH);
  
    // Grab in the middle of the slider
    coordinates.y -= 0.5 * SLIDER_WIDTH;

    this.state.viewport.SetPosition(
      null,
      Math.floor(coordinates.y * sliderIncrement).Clamp(0, maximumViewport.j)
    );

  } else if(this.state.activeComponent.id === "viewportHandleH") {
	  
    sliderIncrement = (this.WORLD_MAP_WIDTH - zoomLevelCorrection) / (640 - SLIDER_WIDTH);

    // Handle is in the middle of the slider
    coordinates.x -= 0.5 * SLIDER_WIDTH;

    this.state.viewport.SetPosition(
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
Editor.prototype.GetMaximumViewportIndex = function() {

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
Editor.prototype.ClickEvent = function(event) {
  
  // Propogate click event to get the
  // clicked inventory object
  if(this.state.activeComponent.id === "inventoryWindow") {
    return this.SetClickedInventoryObject(event);
  }

  // Get the active index
  var index = this.GetPositionIndex(this.state.activePosition);

  this.AddTileObject(this.state.activePosition, this.state.activeGameObject);

  this.Render();

}


/* Game.WorldTileExists
 * Returns true|false for existence of world tile
 */
Editor.prototype.WorldTileExists = function(index) {

  return this.worldMapTiles[index] instanceof WorldTile;

}

/* Game.GetWorldMapTile
 * Returns and possibly creates a new world map tile
 */
Editor.prototype.GetWorldMapTile = function(position) {

  // Convert position to index
  var index = this.GetPositionIndex(position);

  // Create if it does not exist
  if(!this.WorldTileExists(index)) {

    this.worldMapTiles[index] = new WorldTile(position);

  }

  return this.worldMapTiles[index];

} 

/* Game.AddTileObject
 * Adds a tile object to the tile
 */
Editor.prototype.AddTileObject = function(position, gameObject) {

  // Push every item to the command buffer
  this.undoCommandMemoryBuffer.push(
    new Command(
      gameObject,
      position,
      "add"
    )
  );

  // Nothing selected
  if(gameObject === null) {
    return;
  }

  var worldMapTile = this.GetWorldMapTile(position);

  var groundTile = worldMapTile.HasGroundObject();

  // If the tile has a ground object replace it
  if(gameObject.ground && groundTile !== null) {
    worldMapTile.Replace(gameObject, groundTile); 
  } else {
    worldMapTile.Add(gameObject);
  }

  // Sort the objects on tile
  worldMapTile.SortObjects();

}

/* Game.MovementDeferred
 * Returns true if movement should not be deferred
 */
Editor.prototype.MovementDeferred = function(activePositionBuffer) {

  // No active position thus no defer
  if(this.state.activePosition === null) {
    return true;
  }

  // Buffered position must be different from current
  return this.GetPositionIndex(this.state.activePosition) !== this.GetPositionIndex(activePositionBuffer);

}

/* Game.SetMousePointerStyle
 * Updates the pointer style of the mouse based
 * on the provided component
 */
Editor.prototype.SetMousePointerStyle = function(componentType) {

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
Editor.prototype.DrawSelectionRectangle = function() {

  const SELECTION_COLOR = "green";
  const SELECTION_COLOR_EMPTY = "blue";

  // Get the bounds of the selection
  var bounds = this.GetSelectionBounds(
    this.state.rectangleSelectStart,
    this.state.activePosition
  )

  // Get the pixel positions of the bounds
  var pixelPositionMin = this.GetPixelPosition(new Position(bounds.iMinimum, bounds.jMinimum, 0));
  var pixelPositionMax = this.GetPixelPosition(new Position(bounds.iMaximum, bounds.jMaximum, 0));

  // Color is dependent on whether an item is selected
  this.canvas.context.fillStyle = this.state.activeGameObject ? SELECTION_COLOR : SELECTION_COLOR_EMPTY;
  
  this.canvas.context.globalAlpha = 0.5;
  
  this.canvas.context.fillRect(
    pixelPositionMin.x,
    pixelPositionMin.y,
    (32 * this.state.zoomLevel) + (pixelPositionMax.x - pixelPositionMin.x),
    (32 * this.state.zoomLevel) + (pixelPositionMax.y - pixelPositionMin.y)
  );
  
  this.canvas.context.globalAlpha = 1;
  
}

/* Function Game.MoveEvent
 * handles the mouse move event
 */
Editor.prototype.MoveEvent = function(event) {
  
  // Update the mouse pointer style
  this.SetMousePointerStyle(this.GetComponent(event).type);

  // Inventory handle is held down
  if(this.state.activeComponent.id === "inventoryHandleV") {
    return this.MoveInventory(event);
  }

  // Viewport handles are held down
  if(this.state.activeComponent.id === "viewportHandleH" || this.state.activeComponent.id === "viewportHandleV") {
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
  
  // Check if the action is deferred
  if(this.MovementDeferred(activePositionBuffer)) {

    // If not selecting
    if(this.state.rectangleSelectStart === null) {

      // Draw hover object on the new buffered position
      this.DrawHoverObject(activePositionBuffer);

      if(this.state.mouseDown && this.state.activeGameObject === null) {
        this.MoveObject(this.state.activePosition, activePositionBuffer);
      }

      // Set the active position to the buffer
      this.state.activePosition = activePositionBuffer;

      // Propagate movement to click event
      if(this.state.mouseDown) {
        this.ClickEvent(event);
      }

    } else {

      // Update the active position
      this.state.activePosition = activePositionBuffer;

      // Dump the entire snapshot of the scene
      // before the selection was started
      this.DumpImageBuffer(0, 0);
      this.DrawSelectionRectangle();
	  
    }

  }
 
}

/* Editor.MoveObject
 * Moves object from position to position
 */
Editor.prototype.MoveObject = function(from, to) {

  // Get the top object from the tile
  var topObject = this.GetWorldMapTile(from).PopTopObject();

  // Nothing to grab
  if(topObject === null) {
    return;
  }

  // Get the tile to move to
  var worldTile = this.GetWorldMapTile(to);

  worldTile.objects.push(topObject);
  worldTile.SortObjects();

}

/* Game.DumpImageBuffer
 * Puts image in buffer to x, y coordinates
 */
Editor.prototype.DumpImageBuffer = function(x, y) {
	
  this.canvas.context.putImageData(
    this.state.bufferedImageData,
    x,
    y
  );
  
}

Editor.prototype.GetTile = function(event) {

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
Editor.prototype.GetGameCoordinates = function(event) {

  // First get the canvas coordinates in (x, y)
  var canvasCoordinates = this.GetRelativeCoordinates(event);

  // Transform the canvas coordinates (x, y) to game coordinates (i, j)
  // correcting for the zoomLevel, viewport and sprite width
  return {
    "i": Math.floor((canvasCoordinates.x) / (32 * this.state.zoomLevel)) + this.state.viewport.i,
    "j": Math.floor((canvasCoordinates.y) / (32 * this.state.zoomLevel)) + this.state.viewport.j,
    "k": this.state.activeLayer
  }

}

/*
 * Function Game.GetRelativeCoordinates
 * Returns the x, y position in canvas coordinates
 */
Editor.prototype.GetInventoryCoordinates = function(event) {

  // Correct for the canvas position
  return {
    "x": event.pageX - this.inventory.canvas.bounds.left,
    "y": event.pageY - this.inventory.canvas.bounds.top
  }

}

/*
 * Function Game.GetRelativeCoordinates
 * Returns the x, y position in canvas coordinates
 */
Editor.prototype.GetRelativeCoordinates = function(event) {

  // Correct for the canvas position
  return {
    "x": event.pageX - this.canvas.bounds.left,
    "y": event.pageY - this.canvas.bounds.top
  }

}

/* Game.RenderSliderHandle
 * Renders the slider handles in the correct 
 * position as function of the viewport
 */
Editor.prototype.RenderSliderHandle = function() {

  // Correct for the zoom level
  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  const SLIDER_WIDTH = 64;
  var sliderIncrement;
  
  sliderIncrement = (640 - SLIDER_WIDTH) / (this.WORLD_MAP_WIDTH - zoomLevelCorrection);

  this.canvas.context.fillStyle = "grey";

  // Render the horizontal bar
  this.canvas.context.DrawHandle(
    this.state.viewport.i * sliderIncrement,
    642 + 0.5,
    SLIDER_WIDTH,
    this.PADDING - 4
  );

  sliderIncrement = (640 - SLIDER_WIDTH) / (this.WORLD_MAP_HEIGHT - zoomLevelCorrection);
	
  // Render the vertical bar
  this.canvas.context.DrawHandle(
    642 + 0.5,
    this.state.viewport.j * sliderIncrement,
    this.PADDING - 4,
    SLIDER_WIDTH
  );

}

/* Game.RenderInventory
 * Renders the visible part of the game inventory
 */
Editor.prototype.RenderInventory = function() {

  this.inventory.canvas.Clear();

  this.RenderInventoryInterface();

  this.RenderInventoryContent();

}

/* Game.RenderInventoryInterface
 * Renders the interface of the inventory
 */
Editor.prototype.RenderInventoryInterface = function() {

  const SLIDER_WIDTH = 64;

  this.inventory.canvas.context.strokeStyle = "black";

  this.inventory.canvas.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.inventory.canvas.context.rect(
    320 - 0.5,
    0 - 0.5,
    320,
    this.inventory.canvas.height + 1
  );

  this.inventory.canvas.context.stroke();

  var sliderIncrement = (this.inventory.canvas.height - SLIDER_WIDTH) / ((this.objectInventory.length / 10) - 21);

  this.inventory.canvas.context.DrawHandle(
    322,
    this.inventory.viewport.j * sliderIncrement,
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
Editor.prototype.RenderInterface = function() {

  this.canvas.context.strokeStyle = "black";

  this.canvas.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.canvas.context.rect(
    -0.5,
    0.5 + 640,
    641,
    this.PADDING
  );

  this.canvas.context.stroke();
  this.canvas.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.canvas.context.rect(
    640 + 0.5,
    -0.5,
    this.PADDING,
    641
  );

  this.canvas.context.stroke();

  // Render the slider handles
  this.RenderSliderHandle();

}

/* Game.LoadResources
 * Asynchronously loads the required resources
 */
Editor.prototype.LoadResources = function() {
  
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

/* Game.GetPositionIndex
 * Returns the position index of three dimensional world
 * represented in a single 1-dimensional array
 */
Editor.prototype.GetPositionIndex = function(position) {

  if(!position instanceof Position) {
    throw("Game.GetPositionIndex: position is not an instance of the Position class.")
  }

  return position.i + (position.j * this.WORLD_MAP_WIDTH) + (position.k * this.WORLD_MAP_WIDTH * this.WORLD_MAP_HEIGHT);

}

/* Game.RenderLayer
 * Renders a layer of the world
 */
Editor.prototype.RenderLayer = function(layer) {

  // Get the zoom level correction
  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  // Go over each tile in the layer
  for(var i = this.state.viewport.i; i < this.state.viewport.i + zoomLevelCorrection; i++) {
    for(var j = this.state.viewport.j; j < this.state.viewport.j + zoomLevelCorrection; j++) {

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
Editor.prototype.SetLayerTransparency = function() {

  // Transparency of lower layers
  const LAYER_TRANSPARENCY = 128;

  // Get the canvas bitmap
  var canvasBitmap = this.canvas.context.getImageData(
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
  this.canvas.context.putImageData(
    canvasBitmap,
    0,
    0
  );

}

/* Function Game.Render
 * Renders all objects in the viewport to screen
 */
Editor.prototype.Render = function() {

  // Clear image buffer
  this.state.bufferedImageData = null;
 
  // Clear all the sprites from the game screen 
  this.canvas.Clear();

  // Call render for the GUI
  this.RenderInterface();

  // Render all layers below the active layer
  for(var layer = 0; layer < this.state.activeLayer; layer++) {
    this.RenderLayer(layer);
  }

  // Set transparency of lower layers and render black background 
  this.SetLayerTransparency();

  this.canvas.RenderBackground();

  // Render the active layer
  this.RenderLayer(this.state.activeLayer);

  // Draw hover object on the new buffered position
  this.DrawHoverObject(this.state.activePosition);
  
}

/* Game.LoadResourcesCallback
 * Fires when all resources are loaded
 */
Editor.prototype.LoadResourcesCallback = function() {

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
Editor.prototype.DoubleClickEvent = function(event) {

  // Return if an item is selected
  if(this.state.activeGameObject !== null) {
    return;
  }

  var worldMapTile = this.GetWorldMapTile(this.state.activePosition);

  if(worldMapTile === undefined) {
    return;
  }

  // Get the object pointer from the top of the tile
  var object = worldMapTile.GetTopObject();

  // If cumulative prompt the item count
  if(object.gameObjectPointer.cumulative) {
    object.count = Number(prompt("Item count")) || 1;
  }

  this.Render();

}

/* Game.ScrollEvent
 * Handles scroll event 
 */
Editor.prototype.ScrollEvent = function(event) {

  // Disable default scrolling
  event.preventDefault();

  // Check movement delta for direction
  var scrollUp = event.deltaY < 0;

  switch(event.target) {

    // Scrolling in canvas
    case this.canvas.canvas:

      this.ZoomByFactor(scrollUp ? 2 : 0.5);
      
      this.Render();
      break;

    // Scrolling in inventory
    case this.inventory.canvas.canvas:

      // Update the inventory viewport
      this.inventory.viewport.SetPosition(
        null,
        (this.inventory.viewport.j + (scrollUp ? -1 : 1)).Clamp(0, (this.objectInventory.length / 10) - 21)
      );

      this.RenderInventory();
      break;

  }
  
}


/* Game.GetSelectionBounds
 * Returns (minimum, maximum) (i, j) for selection start
 * and current mouse position
 */
Editor.prototype.GetSelectionBounds = function(startPosition, endPosition) {

  return {
    "iMinimum": Math.min(this.state.rectangleSelectStart.i, this.state.activePosition.i),
    "jMinimum": Math.min(this.state.rectangleSelectStart.j, this.state.activePosition.j),
    "iMaximum": Math.max(this.state.rectangleSelectStart.i, this.state.activePosition.i),
    "jMaximum": Math.max(this.state.rectangleSelectStart.j, this.state.activePosition.j)
  }

}

/* Game.DrawTileRectangle
 * Adds all items in selection
 */
Editor.prototype.DrawTileRectangle = function() {

  // Get the bounds to draw
  var bounds = this.GetSelectionBounds(
    this.state.rectangleSelectStart,
    this.state.activePosition
  );
  
  this.undoCommandMemoryBuffer = new Array();

  // Go over the entire selection
  for(var i = bounds.iMinimum; i <= bounds.iMaximum; i++) {
    for(var j = bounds.jMinimum; j <= bounds.jMaximum; j++) {
  	  
      // Get the active index
      var position = new Position(i, j, this.state.activeLayer);
  	
      this.AddTileObject(position, this.state.activeGameObject);

    }
  }

  // Reset the rectangle select to NULL
  this.state.rectangleSelectStart = null;

  this.undoCommandMemory.push(this.undoCommandMemoryBuffer);

}

/* Game.MouseUpEvent
 * Handles mouse up state
 */
Editor.prototype.MouseUpEvent = function(event) {

  // Update the mouse state
  this.state.mouseDown = false;
  
  // If a rectangle has been selected
  if(this.state.rectangleSelectStart !== null) {

    // Empty the image buffer
    this.state.bufferedImageData = null;

    // Draw all objects in selection
    // and fully render the scene
    this.DrawTileRectangle();
	
    this.Render();

    return;

  }
  
  this.undoCommandMemory.push(this.undoCommandMemoryBuffer);

  // No component is active
  this.state.activeComponent = new Component(null);

}

/* Game.SetSelectionState
 * Initializes the selection state
 */
Editor.prototype.SetSelectionState = function() {

  // Create a position for the selection start
  this.state.rectangleSelectStart = new Position(
    this.state.activePosition.i,
    this.state.activePosition.j,
    this.state.activePosition.k
  );
  
  // Freeze and capture the full current scene
  this.state.bufferedImageData = this.canvas.context.getImageData(
    0,
    0,
    this.canvas.width - this.PADDING,
    this.canvas.height - this.PADDING
  );

}

/* Game.MouseDownEvent
 * Handles mouse down state
 */
Editor.prototype.MouseDownEvent = function(event) {

  // Shift key is pressed during mouse down
  if(event.shiftKey) {
    return this.SetSelectionState();
  }

  // Push and reset the command memory buffer
  this.undoCommandMemoryBuffer = new Array();

  // Set mouse down state
  this.state.mouseDown = true;
  
  this.state.activeComponent = this.GetComponent(event);
  
  // Propagate to the click event
  this.ClickEvent(event);
  
}

Editor.prototype.GetComponent = function(event) {

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
Editor.prototype.Draw = function(tileObject, worldTile, elevation) {

  var position = worldTile.position;

  // Default elevation of 0
  elevation = elevation || 0;
  var count = tileObject.count || 0;
  
  var object = tileObject.gameObjectPointer;

  if(object === null) {
    return;
  }
	
  var pixelPosition = this.GetPixelPosition(position);
  
  var spriteIndex = (position.i % object.pattern.width) + object.pattern.width * (position.j % object.pattern.height);

  // Play the animation
  if(object.animated) {
    spriteIndex = (spriteIndex + this.frameNumber) % (object.animationPhases - 1);  
  } else if(object.cumulative) {
    spriteIndex = object.GetCountIndex(count);
  }

  var sprite = object.sprites[spriteIndex];

  // Draw the image and correct for the zoom level,
  // sprite size, and object elevation
  this.canvas.context.drawImage(
    this.resources[sprite.resource],
    sprite.x,
    sprite.y,
    sprite.width,
    sprite.height,
    pixelPosition.x + (32 - sprite.width - elevation) * this.state.zoomLevel,
    pixelPosition.y + (32 - sprite.height - elevation) * this.state.zoomLevel,
    sprite.width * this.state.zoomLevel,
    sprite.height * this.state.zoomLevel
  );
  
}

/* Function Game.PositionInViewport
 * Returns Boolean whether a position is in the viewport
 */
Editor.prototype.PositionInViewport = function(position) {

  var zoomLevelCorrection = this.GetZoomLevelCorrection();

  // Apply correction for zoom level
  return (
    (position.i > -1) &&
    (position.j > -1) &&
    (position.i < (this.state.viewport.i + zoomLevelCorrection)) &&
    (position.j < (this.state.viewport.j + zoomLevelCorrection))
  );

}

/* Function Game.DrawHoverObject
 * Draws the bounding box and active object
 */
Editor.prototype.DrawHoverObject = function(position) {

  // Dump buffered image data if present
  if(this.state.bufferedImageData) {

    var pixels = this.GetPixelPosition(this.state.activePosition);

    if(pixels !== null) {

      this.DumpImageBuffer(
        pixels.x - (32 * this.state.zoomLevel),
        pixels.y - (32 * this.state.zoomLevel)
      );

    }

  }

  // Get the new data from the active position buffer
  var pixels = this.GetPixelPosition(position);

  if(pixels !== null) {

    this.state.bufferedImageData = this.canvas.context.getImageData(
      pixels.x - (32 * this.state.zoomLevel),
      pixels.y - (32 * this.state.zoomLevel),
      (64 * this.state.zoomLevel),
      (64 * this.state.zoomLevel)
    );

  }

  // Draw the selection tile on the position
  this.DrawSelectionTile(position);

}

/* Function Game.GetPixelPosition
 * Returns the pixel position of a position class in
 * world coordinates (i, j) corrected for the viewport 
 * and zoom level
 */
Editor.prototype.GetPixelPosition = function(position) {

  // If the position is not within
  // the viewport return null
  if(!this.PositionInViewport(position)) {
    return null;
  }

  return {
    "x": 32 * (position.i - this.state.viewport.i) * this.state.zoomLevel,
    "y": 32 * (position.j - this.state.viewport.j) * this.state.zoomLevel
  }

}

/* Function Game.DrawSelectionTile
 * Draws the selection rectangle around the passed position
 */
Editor.prototype.DrawSelectionTile = function(position) {

  // Draw the phantom hover object with transparency
  if(this.state.activeGameObject !== null) {
    this.DrawPhantomGameObject(position);
  }

  // Draw white selection box
  this.DrawSelectionBorder(position);

}

/* Game.DrawPhantomGameObject
 * Draws transparent placeholder object on hover
 */
Editor.prototype.DrawPhantomGameObject = function(position) {

  const HOVER_ALPHA_VALUE = 0.5;

  this.canvas.context.globalAlpha = HOVER_ALPHA_VALUE;

  this.Draw(
    new TileObject(this.state.activeGameObject),
    new WorldTile(position)
  );

  this.canvas.context.globalAlpha = 1.0;

}

/* Game.DrawSelectionBorder
 * Draws border around currently active tile
 */
Editor.prototype.DrawSelectionBorder = function(position) {

  var pixelPosition = this.GetPixelPosition(position);

  this.canvas.context.beginPath();

  // Use half pixels to prevent aliasing effects
  this.canvas.context.rect(
    0.5 + pixelPosition.x,
    0.5 + pixelPosition.y,
    Math.floor(31 * this.state.zoomLevel),
    Math.floor(31 * this.state.zoomLevel)
  );

  this.canvas.context.stroke();

}

/* Function Game.DrawWorldTiles
 * Draws a world tile with all objects
 */
Editor.prototype.DrawWorldTile = function(worldTile) {

  if(worldTile === null) {
    return;
  }

  var elevation = 0;

  // Draw all objects on the tile
  // and correct for tile elevation
  worldTile.objects.forEach(function(tileObject) {

    this.Draw(
      tileObject,
      worldTile,
      elevation
    );

    // Keep track of the tile elevation
    elevation = Math.min(
      elevation + tileObject.gameObjectPointer.elevation,
      CONFIG.MAXIMUM_ELEVATION
    );
	
  }, this);

}
