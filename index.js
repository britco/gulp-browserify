var through = require('through'),
    path = require('path');
    browserify = require('browserify');
    gutil = require('gulp-util');
	PluginError = gutil.PluginError;
	File = gutil.File;
	_ = require('underscore');

// Main export function.. Call either using gulpBrowserify(app.js) or opts {
// filename: app.js }
// opts:
// filename: x
// maskFilenames: true
// .. any other browserify options
function gulpBrowserify(opts) {
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

	filename = opts.filename;

	var funcArgs = ['maskFilenames','filename'];

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

	// Main browserify object
	var bundler = browserify(browserifyOpts);

	// Error wrapping
	function newError(e) {
		return this.emit('error', e);
	}

	// Keep adding files until there are none left
	function addFiles(file){
		if (file.isStream()) {
			return this.emit('error', new PluginError(
				'gulp-browserify',
				'Streaming not supported'
			));
		}

		if (!firstFile) firstFile = file;

		files.push(file.path);
	}

    // Run the bundling at the end
	function endStream() {
		var me = this;

		if (files.length === 0) return this.emit('end');

		bundler.on('error', newError);

		// Require each file
		files.forEach(function(file,index) {
			var dirname = path.dirname(file);

			var requireOpts = {};

			// Mask the actual filename
			// if(opts.maskFilenames) {
			// 	requireOpts.expose = Math.random().toString(36).substr(3,3);
			// }

			bundler.add(file, requireOpts);
		});

		// Build the bundle now
		this.emit('prebundle', bundler);

		bundler.bundle(function(err, src) {
			// Check if there were any errors
			if(err) {
				return newError.call(me,err);
			}

			// Output the ending file
			var fileopts = {
				cwd: __dirname,
				base: __dirname,
				path: path.join(__dirname, filename),
				contents: new Buffer(src)
			};

			var outputFile = new File(fileopts);

			me.emit('postbundle', bundler);
			me.emit('data', outputFile);
		});
	}

	return through(addFiles, endStream);
}

module.exports = gulpBrowserify;