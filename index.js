var through = require('through'),
	fs = require('fs'),
	through2 = require('through2'),
  path = require('path'),
  browserify = require('browserify'),
  watchify = require('watchify'),
  chalk = require('chalk'),
  gutil = require('gulp-util'),
  shim = require('browserify-shim'),
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

// Create a single Vinyl FS stream.
function createSourceStream(filename,opts) {
	var ins = through2();
	var out = false;

	if (filename) {
		filename = path.resolve(filename);
	}

	var file = new File(filename ? {
		path: filename,
		contents: ins
	} : {
		contents: ins
	});

	return through2({
		objectMode: true
	}, function(chunk, enc, next) {
	if (!out) {
		this.push(file);
		out = true;
	}

	ins.push(chunk);
	next();
	}, function() {
		// Optionally add a "footer" to the output.
		if(typeof(opts.footer) !== 'undefined') {
			ins.push(opts.footer);
		}
		ins.push(null);
		this.push(null);
	});
}

// Build function, called from __main
function build(opts) {
	// Stream data
	var stream = this;
	var data = this._data;
	var cwd = data.firstFile.cwd;
	var root = path.dirname(module.parent.filename);

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
		aliasMappings: {},
		requireAll: true,
		verbose: false,
		watch: true,
		noBowerParse: true
	});

	var filename = opts.filename;

	var funcArgs = [
		'maskFilenames',
		'requireAll',
		'aliasMappings',
		'filename',
		'watch',
		'footer',
		'parseBower'
	];

	// Get an option list for browserify
	var browserifyOpts = {};
	Object.keys(opts).forEach(function(key) {
		value = opts[key];

		if(!_.contains(funcArgs,key)) {
			browserifyOpts[key] = value;
		}
	});

	// Default browserify options
	browserifyOpts = _.defaults(browserifyOpts, {noParse: []});

	// Don't parse any bower_components files
	if(opts.noBowerParse === true) {
		var bower_path = path.resolve(root,'bower_components');
		var dirs = fs.readdirSync(bower_path);
		dirs.forEach(function(dir) {
			if(dir !== '.DS_Store') {
				var pkg_path = path.join(bower_path,dir);

				if(fs.existsSync(path.join(pkg_path,'bower.json'))) {
					var main_paths = require(path.join(pkg_path,'bower.json')).main;
					if(!_.isArray(main_paths)) {
						main_paths = [main_paths];
					}

					main_paths.forEach(function(main_path) {
						var abs_path = path.resolve(pkg_path,main_path);
						browserifyOpts.noParse.push(abs_path);
						browserifyOpts.noParse.push(path.relative(root,abs_path));
						browserifyOpts.noParse.push(path.relative(opts.basedir,abs_path));
					});
				}
			}
		});
	}

	var browserifyFn;

	// Main browserify object
	if(!opts.watch) {
		browserifyFn = browserify;
	} else {
		browserifyFn = watchify;
	}

	var bundler = browserifyFn(browserifyOpts);

	function newError(e) {
		throw e;
	}

	// Bubble up errors to stream
	bundler.on('error', newError);

	// Require each file that was found in the stream
	data.files.forEach(function(file,index) {
		var dirname = path.dirname(file);

		// Get relative pathname
		var relative = path.relative(cwd,file);

		// Strip the basedir from the filename.. So if basedir is
		// /assets/coffee/app, and /assets/coffee is the basedir, the exposed path
		// will be just "app".
		relative = path.relative(opts.basedir,file);

		// Strip extension
		var expose = relative.replace(/\.[^/.]+$/, "");

		var require_file = false;
		if (opts.requireAll === true) {
			require_file = true;
		}

		// Handle aliasMappings. These are mappings of require path to file.
		// So if I put aliasMappings: { react: 'node_modules/react' } it will
		// be available as require('react') in the browser.
		Object.keys(opts.aliasMappings).forEach(function(aliasKey) {
			var aliasFilename = opts.aliasMappings[aliasKey];

			// Resolve filenames
			aliasFilename = path.resolve(opts.basedir,aliasFilename);
			var relativeFilename = path.resolve(opts.basedir,relative);

			if(aliasFilename === relativeFilename) {
				// Key matches, use relativeFilename as the key
				require_file = true;
				expose = aliasKey;
			}
		});

		if(opts.verbose === true) {
			log('adding file: ' + expose);
		}

		if(require_file === true) {
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
		// TODO: Should be able to use vinyl-source-stream for this
		var browserifystream = bundle.pipe(createSourceStream(filename,opts));

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