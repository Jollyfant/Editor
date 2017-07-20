// Class for positions on grid
var Position = function(i, j, k) {

  // Input must be integers
  if(i % 1 !== 0 || j % 1 !== 0 || k % 1 !== 0) {
    throw("Input must be given as integers.");
  }

  // Save the position
  this.i = i;
  this.j = j;
  this.k = k;

}

// Return the index
Position.prototype.GetIndex = function() {

  return this.i + (this.j * 1000) + (this.k * 1000 * 1000);

}

Position.prototype.SetPosition = function(i, j, k) {

  this.i = i === null ? this.i : i;
  this.j = j === null ? this.j : j;
  this.k = k === null ? this.k : k;

}
