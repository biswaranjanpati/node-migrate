module.exports = (grunt) ->

  grunt.initConfig
    mochaTest:
      test:
        options:
          ui: 'bdd'
          reporter: 'spec'
          require: ['coffee-script', './test/support/globals.js']
          slow: '1ms'

        src: ['test/unit/**/*.coffee']

    watch:
      tests:
        files: ['test/**/*.coffee', 'lib/**/*.coffee']
        tasks: ['test']


  grunt.loadNpmTasks('grunt-mocha-test')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('test', ['mochaTest'])
  grunt.registerTask('default', ['test', 'watch'])

