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
  * __requireAll__: makes all exported modules available under require(filename). Default: `true`.
  * __aliasMappings__: Similar to grunt-browserify option. Specify custom export names for modules. For example, to make   node_modules available from require(react), you would have `aliasMappings: react: node_modules/react`.
  * __filename__: The compiled Javascript file containing all modules.
  * __watch__: Whether to use watchify or normal browserify. Default: `true`.
  * __footer__: Content to put at the end of the compiled Javascript file.

## License
Available under the [MIT License](LICENSE.md).
