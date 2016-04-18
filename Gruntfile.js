module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        beautify: true,
        compress: false,
        mangle: false,
        enclose: {}
      },
      build: {
        src: [
          'src/**.module.js',
          'src/**.js',
          '!src/**.spec.js',
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};