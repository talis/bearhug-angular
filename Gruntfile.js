module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    ngAnnotate: {
      options: {},
      dist: {
        files: {
          'dist/<%= pkg.name %>.js': ['dist/<%= pkg.name %>.js']
        }
      }
    },

    uglify: {
      concat: {          
        options: {
          beautify: true,
          compress: false,
          mangle: false,
          enclose: {
            angular: 'angular' 
          }
        },
        src: [
          'src/**.module.js',
          'src/**.js',
          '!src/**.spec.js',
        ],
        dest: 'dist/<%= pkg.name %>.js'
      },
      min: {
        options: {
          compress: {},
          mangle: true
        },
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ng-annotate');

  // Default task(s).
  grunt.registerTask('default', ['uglify:concat', 'ngAnnotate', 'uglify:min']);

};