// Class for positions on grid
var Position = function(i, j) {

  // Input must be integers
  if(i % 1 !== 0 || j % 1 !== 0) {
    throw("Input must be given as integers.");
  }

  // Save the position
  this.i = i;
  this.j = j;

}

// Return the index
Position.prototype.GetIndex = function() {

  return this.i + this.j * 1000;

}

Position.prototype.SetPosition = function(i, j) {

  this.i = i;
  this.j = j;

}

// Increment the position
Position.prototype.Increment = function(i, j) {

  this.i = this.i + i;
  this.j = this.j + j;

  if(this.i < 0) this.i = 0;
  if(this.j < 0) this.j = 0;

  if(this.i > 1000) this.i = 1000;
  if(this.j > 1000) this.j = 1000;

}