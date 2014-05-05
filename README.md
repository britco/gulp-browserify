gulp-watchify
==============
Gulp plugin for watchify, an incremental browserify builder.

## Example
````
browserify = require('gulp-browserify')
stream = gulp.src(files)
.pipe(browserify(
	basedir: './'
))
````

## Functions

## browserify(options)
* options
  * __maskFilenames__
  * requireAll
  * aliasMappings
  * filename
  * watch
  * footer

## License
Available under the [MIT License](LICENSE.md).
