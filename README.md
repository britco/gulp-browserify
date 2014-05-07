gulp-watchify
==============
Gulp plugin for watchify, an incremental browserify builder.

## Example
````
browserify = require('gulp-browserify')
stream = gulp.src(files)
.pipe(browserify(
	basedir: './'
	filename: 'app.js'
))
````

## Options:

The following options are available on the gulp plugin. You can also pass in any of the default Browserify options: [https://github.com/substack/node-browserify#var-b--browserifyfiles-or-opts](https://github.com/substack/node-browserify#var-b--browserifyfiles-or-opts).

### maskFilenames

### noBowerParse

Don't parse any bower_component files in browserify.

__Default__: `true`

### requireAll

Makes all exported modules available under require(filename).

__Default__: `true`

### aliasMappings

Similar to grunt-browserify option. Specify custom export names for modules. For example, to make   `node_modules/react` available from `require(react)`, you would have `aliasMappings: react: node_modules/react`.

### filename
The name of the compiled Javascript file.

### watch
Whether to use watchify or normal browserify.

__Default__: `true`

### footer
Content to put at the end of the compiled Javascript file.

## License
Available under the [MIT License](LICENSE.md).
