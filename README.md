# wSlides
wSlides is a jquery slides plugin.


# Usage
	<!-- 需要依赖jquery  -->
	<script src="http://code.jquery.com/jquery-1.9.1.min.js"></script>
	<!-- 添加jquery.wslides.js的引用  -->
	<script src="../src/jquery.wslides.js"></script>
	<script type="text/javascript">
		$(function() {
			$('#slides').wslides({
				width: 940,
				height: 528,
				navigation: false,
				play: {
					active: false,
					pauseOnHover: true,
					swap: false
				}
			});
		});	
	</script>


# License

The MIT License (MIT)

Copyright (c) 2015 wzx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.