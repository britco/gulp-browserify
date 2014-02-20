var through = require('through'),
    path = require('path'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    chalk = require('chalk'),
    gutil = require('gulp-util'),
	PluginError = gutil.PluginError,
	File = gutil.File,
	_ = require('underscore'),
	source = require('vinyl-source-stream'),
	gulp = require('gulp'),
	endStreamFn;

// Log but with a prefix
function log() {
	// Combine arguments
	var args = [chalk.magenta('[gulp-browserify]')];
	var func_args = Array.prototype.slice.call(arguments);

	args.push.apply(args,func_args);

	return gutil.log.apply(this,args);
}

// Keep adding files until there are none left
function addFiles(file){
	if (file.isStream()) {
		return this.emit('error', new PluginError(
			'gulp-browserify',
			'Streaming not supported'
		));
	}

	if (!this._firstFile) this._firstFile = file;

	var files = this.files || [];

	files.push(file.path);
}

function endStream(files) {
	var me = this;

	console.log('files', files);

	if (files.length === 0) return this.emit('end');

	return endStreamFn();
}

function waitForStream(callback) {
	this.endStreamFn = callback;
}

// Main export function.. Call either using gulpBrowserify(app.js) or opts {
// filename: app.js }
// opts:
// filename: x
// maskFilenames: true
// .. any other browserify options
function __main(opts) {
	if (!opts) opts = {};

	// Accept single string format
	if(typeof(opts) !== 'object') {
		opts = {};
		opts.filename = filename;
	}

	// Default options..
	defaultFilename = 'bundle-';
	defaultFilename += Math.random().toString(36).substr(3,3);
	defaultFilename += String(new Date().getTime()).substr(4,3);
	defaultFilename += '.js';

	_.defaults(opts, {
		filename: defaultFilename,
		maskFilenames: true
	});

	var filename = opts.filename;

	var funcArgs = ['maskFilenames','filename','watch'];

	// Get an option list for browserify
	var browserifyOpts = {};
	Object.keys(opts).forEach(function(key) {
		value = opts[key];

		if(!_.contains(funcArgs,key)) {
			browserifyOpts[key] = value;
		}
	});

	var files = [];
	var firstFile = null;
	var browserifyFn;

	// Main browserify object
	if(!opts.watch) {
		browserifyFn = browserify;
	} else {
		browserifyFn = watchify;
	}

	var bundler = browserifyFn(browserifyOpts);

	// Error wrapping
	function newError(e) {
		return this.emit('error', e);
	}

	waitForStream(function() {
		console.log('test');
	});

	return through(addFiles, endStream);
}

module.exports = __main;