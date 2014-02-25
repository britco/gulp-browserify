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
	streamify = require('gulp-streamify'),
	endStreamFn,
	lastExecTime,
	lastExecData;

// Log with a prefix
function log() {
	var args = Array.prototype.slice.call(arguments);
	var prefix = [chalk.magenta('[gulp-browserify]')];
	args[0] = prefix + ' ' + args[0];

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
	var stream = this;
	var data = this._data;
	var cwd = data.firstFile.cwd;

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
		aliasMappings: true,
		verbose: false
	});

	var filename = opts.filename;

	var funcArgs = [
		'maskFilenames',
		'aliasMappings',
		'filename',
		'watch'
	];

	// Get an option list for browserify
	var browserifyOpts = {};
	Object.keys(opts).forEach(function(key) {
		value = opts[key];

		if(!_.contains(funcArgs,key)) {
			browserifyOpts[key] = value;
		}
	});

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

		// get relative pathname
		var relative = path.relative(cwd,file);

		// strip extension
		var expose = relative.replace(/\.[^/.]+$/, "");

		if(opts.verbose === true) {
			log('adding file: ' + expose);
		}

		if(opts.aliasMappings === true) {
			bundler.require(file, { expose: expose });
		} else {
			bundler.add(file);
		}
	});

	// Compile new bundle.js every time one of the files changes
	function rebundle(ids) {
		stream.emit('prebundle', bundler);

		if(opts && opts.verbose && lastExecTime) {
			var lastExec = (Date.now() - lastExecTime);

			if(lastExec > 0) {
				log('time since last execution: ' +
					chalk.cyan(lastExec + 'ms'));
			}
		}
		lastExecTime = Date.now();

		var start_time = Date.now();

		var bundle = bundler.bundle(opts);

		// Use a vinyl source stream to convert the whole bundle to
		// one compiled file.
		var browserifystream = bundle.pipe(source(filename));

		// Once the bundle is complete, fire a callback so that gulp knows
		// when to proceed to the next step.
		browserifystream.on('data',function(data) {
			stream.emit('data', data);

			stream.emit('postbundle', bundler);

			// Log execution time
			var end_time = Date.now();
			if(end_time-start_time > 0) {
				var exec_time = chalk.cyan((end_time-start_time) + 'ms');
				log('compiled in ' + exec_time);
			}
		});

		return bundle;
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