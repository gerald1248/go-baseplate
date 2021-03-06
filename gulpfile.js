var gulp  = require('gulp'),
  util = require('gulp-util'),
  concat = require('gulp-concat'),
  zip = require('gulp-zip'),
  runSequence = require('run-sequence'),
  del = require('del'),
  argv = require('yargs').argv,
  exec = require('child_process').exec,
  sourcemaps = require('gulp-sourcemaps'),
  cleancss = require('gulp-clean-css'),
  htmlmin = require('gulp-htmlmin'),
  minify = require('gulp-minify'),
  jsonminify = require('gulp-jsonminify'),
  os = require('os'),
  getos = require('getos'),
  md5 = require('gulp-md5');

var pkg = require('./package.json');
var platform = os.platform()
if (platform === "linux") {
  var obj = getos(function(e, os) {
    if (!e) {
      platform = os.dist + '-' + os.release;
      platform = platform.replace(/ /g, '_').toLowerCase();
    }
  });
}
var arch = os.arch()
var race = false;
var raceSwitch = (race) ? " -race" : "";
var xbuildtarget = "";
var appName = pkg.name;
var appVersion = pkg.version;

gulp.task('default', ['build', 'watch']);

gulp.task('build', function(callback) {
	xbuildtarget = 'default';
	runSequence(
		'build-any',
		callback);
});	

gulp.task('build-all', function(callback) {
	runSequence(
		'clean-dist',
		'build-win32',
		'build-linux',
		'build-darwin',
		callback);
});

gulp.task('build-js', function() {
  return gulp.src(['./src/js/jquery.min.js', './src/js/bootstrap.min.js', './src/js/main.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('bundle.js'))
    .pipe(minify().on('error', util.log))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./static/js'));
});

gulp.task('build-css', function() {
  return gulp.src(['./src/css/*.css'])
    .pipe(sourcemaps.init())
    .pipe(cleancss())
    .pipe(gulp.dest('./static/css'))
});

gulp.task('build-html', function() {
  return gulp.src(['./src/index.html'])
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('./static'));
});

gulp.task('copy-fonts', function() {
  return gulp.src(['./src/fonts/*'])
    .pipe(gulp.dest('./static/fonts'))
});

gulp.task('build-go', function(callback) {
  exec('go build' + raceSwitch + ' -o ' + appName, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('build-go-darwin', function(callback) {
	platform = "darwin"
	arch = "amd64"
	exec('GOOS=darwin GOARCH=amd64 go build' + raceSwitch + ' -o ' + appName, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('build-go-win32', function(callback) {
	platform = "win32"
	arch = "386"
	exec('GOOS=windows GOARCH=386 go build' + raceSwitch + ' -o ' + appName + '.exe', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('build-go-linux-x64', function(callback) {
	platform = "linux"
	arch = "x64"
	exec('GOOS=linux GOARCH=amd64 go build' + raceSwitch + ' -o ' + appName, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('package-binary', function() {
  return gulp.src(['./' + appName, './' + appName + '.exe'], { base: '.' })
    .pipe(gulp.dest('package'))
});

gulp.task('dist', function() {
  return gulp.src('./package/**/*', { base: './package' })
    .pipe(zip(appName + '-' + pkg.version + '-' + platform + '-' + arch + '.zip'))
    .pipe(md5())
    .pipe(gulp.dest('./dist'));
});

gulp.task('test', function(callback) {
  exec('go test -v', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('fmt', function(callback) {
  //clumsily listing files so bindata.go is ignored
  exec('gofmt -d main.go server.go process.go', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('vet', function(callback) {
  exec('go vet', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('clean-dist', function() {
	return del.sync(['./dist/*.zip'], { force: true });
});

gulp.task('clean-home', function() {
  return del.sync(['./' + appName, './' + appName + '.exe'], { force: true });
});

gulp.task('clean-build', function() {
  return del.sync([
    './dist/' + appName + '-*-' + platform + '_*.zip',
    './dist/' + appName + '-*-' + platform + '-' + arch + '_*.zip',
    './package/**/*',
    './static/**/*'
  ], { force: true });
});

gulp.task('clean-package', function() {
  return del.sync(['./package/*'], { force: true });
});

gulp.task('build-bindata', function(callback) {
  exec('go-bindata static/...', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('build-win32', function(callback) {
  xbuildtarget = 'win32';
  runSequence(
    'build-any',
    callback);
});
		
gulp.task('build-linux', function(callback) {
  xbuildtarget = 'linux-x64';
  runSequence(
    'build-any',
    callback);
});
		
gulp.task('build-darwin', function(callback) {
  xbuildtarget = 'darwin';
  runSequence(
    'build-any',
    callback);
});

gulp.task('build-go-default', function(callback) {
  exec('go build' + raceSwitch, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
});

gulp.task('build-any', function(callback) {
  runSequence(
		//skip clean-build to retain dist
    'fmt',
    'vet',
    'copy-fonts',
    'build-js',
    'build-css',
    'build-html',
    'build-bindata',
    'build-go-' + xbuildtarget,
    'clean-package',
    'package-binary',
    'dist',
    'clean-home',
    'test',
    callback);
});

gulp.task('build-docker', function(callback) {
  runSequence(
    'build-linux',
    'build-image',
    'run-image',
    callback
  );
});

gulp.task('build-image', function(callback) {
    exec(
      'docker build -t ' +
      appName +
      ':v' +
      appVersion +
      ' .' +
      ' && echo \"Run as follows:\n$ docker run --read-only -p 8443:8443 -t ' +
      appName +
      ':v' +
      appVersion +
      '\"', function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      callback(err);
    });
});

gulp.task('run-image', function(callback) {
  exec(
    'docker run --read-only -p 8443:8443 -t ' +
    appName +
    ':v' +
    appVersion +
    ' --help',
    function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  })
});

gulp.task('watch', function() {
  gulp.watch(['./*.go', './src/**'], [
    'build'
  ]);
});
