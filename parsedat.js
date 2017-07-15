const ProtoBuf = require("protobufjs");
const Filesystem = require("fs");
const Path = require("path");

"use strict"

const INPUT_FILE = Path.join("assets", "appearances-78056cd6e620b4bc89628c45e4802307a920c2996ee9f5937af6e7bcc0ad6690.dat");

const OUTPUT_FILE = "appearances.json";
const PROTOBUFFER_FILE = "appearences.proto";
const MESSAGE_NAME = "Appearances";

console.log("Reading appearances file from", INPUT_FILE);

Filesystem.readFile(INPUT_FILE, function(error, dataBuffer) {
	
	if(error) {
		return console.log("Unable to read input file from", INPUT_FILE);
	}

	console.log("Loading the protobuffer definitions ...");
	
	ProtoBuf.load(PROTOBUFFER_FILE, function(error, protoDatFile) {
		
		if(error) {
			return console.log("Unable to read protobuffer definition", OUTPUT_FILE);			
		}
		
		console.log("Decoding the protobuffer ...");
	
		const JSONData = JSON.stringify(
			protoDatFile.lookup(MESSAGE_NAME).decode(
				dataBuffer
			), null, 4
		);
		
		Filesystem.writeFile(OUTPUT_FILE, JSONData, function(error) {
			
			if(error) {
				return console.log("Unable to write file", OUTPUT_FILE);			
			}
			
			console.log("Decoded appearances file has been written to", OUTPUT_FILE);			
			
		});
		
	});
	
});
