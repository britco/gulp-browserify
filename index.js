var eventStream = require('event-stream'),
gutil           = require('gulp-util'),
source          = require('vinyl-source-stream');

// Require browserify and watchify from the parent so that their versions are
// not tied to gulp-watchify
try {
  var browserify = module.parent.require('browserify'),
      watchify = module.parent.require('watchify');
} catch(e) {
  var parentFile = module.parent.id
  throw new Error([
    gutil.colors.red('Local browserify or watchify not found in ' + parentFile),
    gutil.colors.red('Try running: ' + 'npm install browserify watchify')
  ].join("\n"))
}

function log() {
  var args = Array.prototype.slice.call(arguments)
  var prefix = [gutil.colors.magenta('[gulp-watchify]')]
  args[0] = prefix + ' ' + args[0]
  return gutil.log.apply(this,args);
}

function rebundle(opts) {
  var _  = require('underscore')

  var stream = opts.stream,
      bundler = opts.bundler;

  bundler.compiles = bundler.compiles || 0
  bundler.compiles++

  if (typeof bundler.start_time !== "undefined" && bundler.start_time !== null) {
    log('time since last execution: ' + gutil.colors.cyan(Date.now() - bundler.start_time + 'ms'))
  }
  bundler.start_time = Date.now()

  // Form bundle
  bundle = bundler.bundle()

  // Catch errors
  bundle.on('error', (function(_this) {
    return function(err) {
      gutil.log(gutil.colors.red("" + (err.annotated || err.message)))
      return stream.emit('end')
    }
  })(this))

  var browserifyStream = bundle.pipe(source(opts.filename))
  browserifyStream.on('data', (function(_this) {
    return function(data) {
      // Forward data returned to opts.stream
      stream.emit('data', data)

      // Log compilation time
      var start_time = bundler.start_time
      var end_time = Date.now()

      if (end_time - start_time > 0) {
        log('compiled in ' + gutil.colors.cyan((end_time - start_time) + 'ms'))
      }

      if (bundler.compiles >= 1 && opts.watch === false) {
        // Close stream if not in watch mode
        stream.emit('end')
        return bundler.close()
      }
    }
  })(this))
  return bundle;
}

module.exports = function(opts) {
  var _       = require('underscore'),
  eventStream = require('event-stream');

  var ctx = {rebundle: rebundle}

  stream = eventStream.writeArray(function(err, files) {
    var entries = _.pluck(files, 'path')

    opts = _.extend(opts, {
      cache: {},
      packageCache: {},
      entries: entries,
    })

    bundler = watchify(browserify(opts))
    stream.emit('prebundle', bundler)

		// Compile files once, as well as whenever the bundle changes
    var rebundle = this.rebundle.bind(null, _.extend(
      opts, {
        stream: stream,
        bundler: bundler
      }
    ))
    bundler.on('update', rebundle)
    return rebundle();
  }.bind(ctx))

  return stream;
};
