var through = require('through'),
    path = require('path');
    browserify = require('browserify');
    gutil = require('gulp-util');
	PluginError = gutil.PluginError;
	File = gutil.File;

// Main export function.. Call either using gulpBrowserify(app.js) or opts {
// filename: app.js }
function gulpBrowserify(opts) {
	if(typeof(opts) != 'object') {
		opts = {
			'filename': opts
		};
	}
	if (!opts) opts = {};
	if (!opts.newLine) opts.newLine = gutil.linefeed;

	// Default filename..
	if(!opts.filename){
		opts.filename = 'bundle-';
		opts.filename += Math.random().toString(36).substr(3,3);
		opts.filename += String(new Date().getTime()).substr(4,3);
		opts.filename += '.js';
	}

	var files = [];
	var firstFile = null;

	// Main browserify object
	var bundler = browserify(opts);

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
			bundler.require(file, {
				basedir: dirname,
				paths: [dirname]
			});
		});

		// Build the bundle now
		this.emit('prebundle', bundler);

		bundler.bundle(function(err, src) {
			// Check if there were any errors
			if(err) {
				return newError.call(me,err);
			}

			// Output the ending file
			filename = opts.filename;

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