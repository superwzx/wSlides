module.exports = function (grunt) {

	grunt.initConfig({
		uglify: {
			my_target: {
				files: {
					'dist/jquery.wslides.min.js': 'src/jquery.wslides.js'
				}
			}
		},
		jshint: {
			foo: {
				src: ['src/jquery.wslides.js']
			}
		}
	})

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
}