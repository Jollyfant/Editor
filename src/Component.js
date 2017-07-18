var Component = function(id) {

  this.id = id || null;
  this.type = this.GetType(id);

}

/* Component.GetType
 * Returns the type of the component
 */
Component.prototype.GetType = function(id) {

  switch(id) {

    case "inventoryHandleV":
    case "viewportHandleH":
    case "viewportHandleV":
      return "handle";

    case "inventoryWindow":
    case "gameWorldWindow":
      return "window";

    default:
      return null;

  }

}
