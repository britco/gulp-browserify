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

	this._data = this._data || {};

	if (!this._data.firstFile) this._data.firstFile = file;

	if(!_.has(this._data,'files')) this._data.files = [];

	this._data.files.push(file.path);
}

function endStream(files) {
    files = this._data.files;
	if (files.length === 0) return this.emit('end');

	return endStreamFn.apply(this);
}

// Function that is called once endStream is called
function waitForStream(callback) {
	endStreamFn = callback;
}

// Build function, called from __main
function build(opts) {
	// Stream data
	var data = this._data;

	if (!opts) opts = {};

	// Accept single string format
	if(typeof(opts) !== 'object') {
		opts = {};
		opts.filename = filename;
	}

	// Default options..
	defaultFilename = 'bundle.js';

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

	function newError(e) {
		return this.emit('error', e);
	}

	// Bubble up errors to stream
	bundler.on('error', newError);

	// Require each file that was found in the stream
	data.files.forEach(function(file,index) {
		var dirname = path.dirname(file);

		var requireOpts = {};

		bundler.add(file, requireOpts);
	});

	this.emit('prebundle', bundler);

	// Compile new bundle on change
	function rebundle(ids) {
		var start = new Date().getMilliseconds();

		var _return = bundler.bundle()
		.pipe(source(filename))
		.pipe(gulp.dest('/Users/pauldufour/Repositories/brit-frontend/public/js'));

		var end = new Date().getMilliseconds();
		var time = chalk.cyan((end-start) + 'ms');
		log('compiled in ' + time);

		return _return;
	}

	bundler.on('update', rebundle);

	return rebundle();

}

function __main(opts) {
	// Wait till all the files are there
	waitForStream(function() {
		build.call(this,opts);
	});

	return through(addFiles, endStream);
}

module.exports = __main;