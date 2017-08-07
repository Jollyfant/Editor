var Canvas = function(id, width, height) {

  this.PADDING = 20;

  this.width = width;
  this.height = height;

  // Get the canvas from the document and
  // set width & height. Get context.
  this.canvas = document.getElementById(id);
  this.canvas.width = this.width;
  this.canvas.height = this.height;
  this.context = this.canvas.getContext("2d"); 

  this.bounds = this.canvas.getBoundingClientRect();

}

/* Canvas.Clear
 * Clears the entire canvas
 */
Canvas.prototype.Clear = function() {

  this.context.clearRect(
    0,
    0,
    this.width,
    this.height
  );

}

/* Canvas.RenderBackground
 * Renders black background
 */
Canvas.prototype.RenderBackground = function() {

  // Set the composite operation to destination over
  this.context.globalCompositeOperation = "destination-over";

  this.context.fillStyle = "black";

  this.context.fillRect(
    0,
    0,
    this.width - this.PADDING,
    this.height - this.PADDING
  );

  // Set the composite operation to source over
  this.context.globalCompositeOperation = "source-over";

}
