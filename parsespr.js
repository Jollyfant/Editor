var Filesystem = require("fs");
var Path = require("path");
var LZMA = require("lzma");

function isLZMA(x) {
	return Path.extname(x) === ".lzma";
}

function getFilepath(x) {
	
	return {
		"name": x,
		"path": Path.join("assets", x),
		"outpath": Path.join("sprites", x + ".bmp")
	}
	
}

// Read the asset directory
Filesystem.readdir("./assets", function(error, items) {
	
	var dataBuffer;
	
	if(error) {
		return console.log("Could not read asset directory.");
	}
	
	// Filter LZMA decoded files
	// Synchronously read all files
	items.filter(isLZMA).map(getFilepath).forEach(function(file) {
	
		dataBuffer = Filesystem.readFileSync(file.path);
		
		// CIPs header is 6 bytes
		// [0x00 0x70 0x0a 0xfa 0x80 0x24]		
		// Minimum of two variable bytes after the header
		// The start of the LZMA compressed file starts at 0x5d
		var offset = 8;
		while(dataBuffer.readUInt8(offset) !== 0x5d) {
			offset++
		}

		console.log("Detected LMZA start at byte offset ", offset);
		
		// Slice the buffer to correct LZMA offset
		lmzaBuffer = dataBuffer.slice(offset);
		
		// Create a new buffer from the decompressed buffer
		bitmapBuffer = new Buffer(
			LZMA.decompress(lmzaBuffer),
			"base64"
		);
		
		// Write the bitmap
		Filesystem.writeFileSync(
			file.outpath,
			bitmapBuffer
		);
		
		console.log("Writing bitmap file ", file.name, "\n");
		
    });
	
});