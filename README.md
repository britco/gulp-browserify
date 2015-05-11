gulp-watchify
==============
Gulp plugin for watchify, an incremental browserify builder.

## Example
````
browserify = require('gulp-watchify')
stream = gulp.src(files)
.pipe(browserify(
	basedir: './'
	filename: 'app.js'
))
````

## Options:

The following options are available on the gulp plugin. You can also pass in any of the default Browserify options: [https://github.com/substack/node-browserify#browserifyfiles--opts](https://github.com/substack/node-browserify#browserifyfiles--opts).

### filename
The name of the compiled Javascript file.

### watch
Whether to watch for changes or just build a single time;

__Default__: `true`

## License
Available under the [MIT License](LICENSE.md).
