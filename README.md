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

## Methods

### browserify(options)
* options
  * __maskFilenames__
  * __requireAll__
  * __aliasMappings__
  * __filename__
  * __watch__
  * __footer__

## License
Available under the [MIT License](LICENSE.md).
