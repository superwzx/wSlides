/**
 * j@uery Slides Plugin
 * author: superwzx <wzx175@gmail.com>
 **/
(function($) {

	var pluginName = "wslides",

		defaults = {
			// 默认幻灯片的宽度
			width:  'auto',
			// 默认幻灯片的高度
			height: 'auto',
			// 默认第一个幻灯片开始
			start:  1,
			// 默认导航设置
			navigation: {
				active: true
			},
			// 默认分页设置
			pagination: {
				active: true
			},
			// 默认播放设置
			play: {
				active:       true,
				interval:     5000,
				auto:         false,
				swap:         false,
				restartDelay: 2500
			},
			currentEffect: 'slide',
			// 默认动画效果设置
			effectOptions: {
				slide: {
					speed: 500
				},
				fade: {
					speed:     300,
					crossfade: true
				}
			},
			// 默认回调
			callback: {
				loaded:   function() { },
				start:    function() { },
				complete: function() { }
			}
		};

	
	/*****************************************
	 ************** 插件构造函数 ***************
	 *****************************************/
	/**
	 * Plugin的构造函数
	 * @param element {dom-obj} 幻灯片容器
	 * @Param options {obj} 用户自定义设置
	 * @return this
	 **/
	function Plugin (el, options) {
		this.el = $(el);
		this.options = $.extend(true, {}, defaults, options);
		this._name = pluginName;
		this.init();
	}


	/*****************************************
	 *************** 插件方法 *****************
	 *****************************************/
	/**
	 * Plugin.vendorPrefix
	 * 检测浏览器，获取浏览器前缀
	 * @return ["Moz", "Webkit", "Khtml", "O", "ms"].[i]
	 **/
	Plugin.vendorPrefix = (function() {
		var body = document.body || document.documentElement,
			style = body.style,
			transition = "Transition",
			vendor = ["Moz", "Webkit", "Khtml", "O", "ms"];

		for (var i = 0, l = vendor.length; i < l; i++) {
			if (typeof style[vendor[i] + transition] === "string") {
				return vendor[i];
			}
		}
		return false;
	})();


	/**
	 * Plugin.hasTouch
	 * 检测当前浏览器是否支持触摸事件
	 * @return `true` or `false`
	 **/
	Plugin.hasTouch = (function () {
		if (typeof TouchEvent !== "undefined") {
			return true;
		}
	})();


	/*****************************************
	 *************** 原型方法 *****************
	 *****************************************/
	/**
	 * 幻灯片实例初始化函数
	 * 
	 **/
	Plugin.prototype.init = function() {
		var $el = this.el;
		// this.animating {Boolean}
		this.animating = false;
		// this.total {Number} 幻灯片的总数量
		this.total = $el.children().length;
		// this.current {Number} 当前显示的幻灯片的索引
		this.current = this.options.start - 1;
		$el.css('overflow', 'hidden');
		this.slides = $el.children()
			.addClass("wslides-slide")
			.css({
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				zIndex: 0,
				display: "none",
				webkitBackfaceVisibility: "hidden"
			})
			.wrapAll('<div class="wslides-control" />');

		this.slidesControl = this.slides.parent()
			.css({
				position: 'relative',
				left: 0
			})
			.wrap('<div class="wslides-container" />');

		this.slidesContainer = this.slidesControl.parent()
			.css({
				overflow: "hidden",
				position: "relative",
				height: '100%'
			});

		$el.show();

		// 初始化插件尺寸
		this.update();

		// 初始化触摸事件
		if (Plugin.hasTouch) {
			this.setupTouch();
			this.slidesControl.on('touchstart', $.proxy(this.touchStart, this));
			this.slidesControl.on('touchmove', $.proxy(this.touchMove, this));
			this.slidesControl.on('touchend', $.proxy(this.touchEnd, this));
		}

		// 初始化时，显示current图片，并设置zindex为10
		this.slidesControl.children(":eq(" + this.current + ")").eq(0)
			.fadeIn(0, function() {
				$(this).css('z-index', '10');
			});

		// 初始化导航
		if (this.options.navigation.active) {
			var prevBtn, nextBtn;

			// 添加prev-button及侦听其click事件
			prevBtn = $("<a>", {"class": "wslides-previous wslides-navigation", href: "#", title: "Previous", text: "Previous"})
				.appendTo(this.slidesContainer)
				.on('click', $.proxy(function (e) {
					this.stop(true);
					this.previous();
					e.preventDefault();
				}, this));

			// 添加next-button及侦听其click事件
			nextBtn = $("<a>", {"class": "wslides-next wslides-navigation", href: "#", title: "Next", text: "Next"})
				.appendTo(this.slidesContainer)
				.on('click', $.proxy(function (e) {
					this.stop(true);
					this.next();
					e.preventDefault();
				}, this));
		}

		// 初始化自动播放功能
		if (this.options.play.active) {
			// 添加play-button及侦听其click事件
			this.playBtn = $("<a>", {"class": "wslides-play wslides-navigation", href: "#", title: "Play", text: "Play"})
				.appendTo($el)
				.on('click', $.proxy(function (e) {
					this.play(true);
					e.preventDefault();
				}, this));

			// 添加stop-button及侦听其click事件
			this.stopBtn = $("<a>", {"class": "wslides-stop wslides-navigation", href: "#", title: "Stop", text: "Stop"})
				.appendTo($el)
				.on('click', $.proxy(function (e) {
					this.stop(true);
					e.preventDefault();
				}, this));

			if (this.options.play.swap) {
				stopBtn.css({
					display: "none"
				});
			}
		}

		// 初始化分页
		if (this.options.pagination.active) {
			this.pagination = $("<ul>", {"class": "wslides-pagination"})
				.appendTo($el);

			for (var i = 0, l = this.total; i < l; i++) {
				var paginationItem, paginationLink;

				paginationItem = $("<li>", {"class": "wslides-pagination-item"})
					.appendTo(this.pagination);

				paginationLink = $("<a>", {"href": "#", "wslides-item": i, html: i + 1})
					.appendTo(paginationItem)
					.on('click', $.proxy(function (e) {
						this.stop(true);
						this.goto(+e.currentTarget.getAttribute("wslides-item") + 1);
						e.preventDefault();
					}, this));
			}
			// 设置pagination active样式
			this.setPaginationActive();
		}

		// 注册window resize事件
		$(window).on("resize", $.proxy(function () {
			this.update();
		}, this));

		// 插件加载完毕后是否自动播放
		if (this.options.play.auto) {
			this.play();
		}

		// 插件加载完毕后执行loaded回调
		this.options.callback.loaded(this.options.start);
	};


	/**
	 * 设置导航的active样式
	 * @param num {Number}
	 **/
	Plugin.prototype.setPaginationActive = function (number) {
		var current = number > -1 ? number : this.current;
		$(".active", this.el).removeClass("active");
		this.pagination.find("li:eq(" + current + ") a").addClass("active");
	};


	/**
	 * 浏览器调整时，更新幻灯片的宽与高
	 **/
	Plugin.prototype.update = function() {
		var width  = this.el.width(),
			height = (this.options.height / this.options.width) * width;
		this.options.width = width;
		this.options.height = height;
		this.slidesContainer.css({
			width: width,
			height: height
		});
	};


	/**
	 * 查看下一张幻灯片
	 * @param effect {String}
	 **/
	Plugin.prototype.next = function () {
		this.direction = "next";
		this.options.currentEffect === "fade" ? this.fade() : this.slide();
	};


	/**
	 * 查看下一张幻灯片
	 * @param effect {String}
	 **/
	Plugin.prototype.previous = function () {
		this.direction = "previous";
		this.options.currentEffect === "fade" ? this.fade() : this.slide();
	};


	/**
	 * 查看某张幻灯片
	 * @param num {Number}
	 **/
	Plugin.prototype.goto = function (number) {
		if (number > this.total) {
			number = this.total;
		}
		if (number < 1) {
			number = 1;
		}
		this.options.currentEffect === "fade" ? this.fade(number) : this.slide(number);
	};


	/**
	 * 在支持触摸的设备中，安装触摸事件
	 *
	 **/
	Plugin.prototype.setupTouch = function () {
		var previous = this.current - 1,
			next = this.current + 1;
		// 循环播放图片
		if (previous < 0) {
			previous = this.total - 1;
		}
		if (next > this.total - 1) {
			next = 0;
		}
		this.slidesControl.children(":eq(" + next + ")").css({
			display: "block",
			left: this.options.width
		});
		this.slidesControl.children(":eq(" + previous + ")").css({
			display: "block",
			left: - this.options.width
		});
	};


	/**
	 * 定义touchStart事件
	 *
	 **/
	Plugin.prototype.touchStart = function (e) {
		this.setupTouch();
		var touches = e.originalEvent.touches[0];
		this.touchtimer = Number(new Date());
		this.touchstartx = touches.pageX;
		this.touchstarty = touches.pageY;
		e.stopPropagation();
	};


	/**
	 * 定义touchEnd事件
	 *
	 **/
	Plugin.prototype.touchEnd = function (e) {
		var touches = e.originalEvent.touches[0],
			left = this.slidesControl.position().left,
			width = this.options.width;

		if (left > width * 0.5 ||
			left > width * 0.1 &&
			(Number(new Date()) - this.touchtimer < 250)) {
			this.direction = "previous";
			this.slide();

		} else if (left < (-width * 0.5) ||
				   left < (-width * 0.1) &&
				   (Number(new Date()) - this.touchtimer < 250)) {
			this.direction = "next";
			this.slide();

		} else {
			var transform = Plugin.vendorPrefix + "Transform",
				duration  = Plugin.vendorPrefix + "TransitionDuration",
				timing    = Plugin.vendorPrefix + "TransitionTimingFunction";
			this.slidesControl[0].style[transform] = "translateX(0px)";
			this.slidesControl[0].style[duration]  = this.options.effectOptions.slide.speed * 0.85 + "ms";
			// 侦听transition end事件
			this.slidesControl.one("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
				this.slidesControl[0].style[transform] = "";
				this.slidesControl[0].style[duration]  = "";
				this.slidesControl[0].style[timing]    = "";
			});
		}
		e.stopPropagation();
	};


	/**
	 * 定义touchMove事件
	 *
	 **/
	Plugin.prototype.touchMove = function (e) {
		var	touches = e.originalEvent.touches[0],
			transform = Plugin.vendorPrefix + "Transform";
		this.scrolling = Math.abs(touches.pageX - this.touchstartx) < Math.abs(touches.pageY - this.touchstarty);
		if (!this.animating && !this.scrolling) {
			e.preventDefault();
			this.setupTouch();
			this.slidesControl[0].style[transform] = "translateX(" + (touches.pageX - this.touchstartx) + "px)";
		}
		e.stopPropagation();
	};


	/**
	 * play方法，点击play按钮调用
	 * 
	 **/
	Plugin.prototype.play = function () {
		if (this.playInterval) {
			// 注册自动循环播放事件
			this.playInterval = setInterval($.proxy(function() {
				this.direction = "next";
				this.options.currentEffect === 'fade' ? this.fade() : this.slide();
			}, this), this.options.play.interval);

			this.playing = true;

			this.playBtn.addClass("wslides-playing");

			if (this.options.play.swap) {
				$(".wslides-play").hide();
				$(".wslides-stop").show();
			}
		}
	};


	/**
	 * stop方法，点击stop按钮调用
	 * 
	 **/
	Plugin.prototype.stop = function (clicked) {
		clearInterval(this.playInterval);
		this.playInterval = null;
		this.playing = false;
		if (this.options.play.active) {
			this.playBtn.removeClass("wslides-playing");
		}
		if (this.options.play.swap) {
			$(".wslides-stop").hide();
			$(".wslides-play").show();
		}
	};


	/**
	 * 幻灯片滑动方法
	 * @param number {Number} 幻灯片的索引
	 **/
	Plugin.prototype.slide = function (number) {
		var currentSlide = this.current;
		// 如果幻灯片不在运动中（即animating状态为false时），
		// 且要移动的位置不是当前
		if (!this.animating && number !== currentSlide + 1) {
			var	width = this.options.width,
				vector,
				next,
				value;
			// 设置animating状态为true
			this.animating = true;
			// 如果定义了number，则向前或向后移动(number － 1)个单位
			if (number) {
				number = number - 1;
				value  = number > currentSlide ? 1 : -1;
				vector = number > currentSlide ? - width: width;
				next   = number;

			// 如果未定义number，则默认向前或向后移动一个单位
			} else {
				value  = this.direction === "next" ? 1 : -1;
				vector = this.direction === "next" ? - width : width;
				next   = currentSlide + value;
			}

			// 循环播放幻灯片
			if (next === -1) {
				next = this.total - 1;
			}
			if (next === this.total) {
				next = 0;
			}

			// 设置pagination的状态
			this.setPaginationActive(next);

			var slidesControl = this.slidesControl;
			// 设置要移动到视口幻灯片的样式
			slidesControl.children(":eq(" + next + ")")
				.css({
					display: "block",
					left: value * this.options.width,
					zIndex: 10
				});

			// 执行start回调
			this.options.callback.start(currentSlide + 1);

			// 如果设备支持transition属性，就是用css3 transition动画；
			if (Plugin.vendorPrefix) {
				var transform = Plugin.vendorPrefix + "Transform",
					duration = Plugin.vendorPrefix + "TransitionDuration";
				// 设置幻灯片的Transform和TransitionDuration
				// 设置transition动画属性
				slidesControl[0].style[transform] = "translateX(" + vector + "px)"; // @direction 为移动的距离
				slidesControl[0].style[duration] = this.options.effectOptions.slide.speed + "ms"; // @speed 为移动的速度
				// 侦听transition end事件，结束时销毁
				slidesControl.one("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", $.proxy(function() {
					// 重置Transform和TransitionDuration
					slidesControl[0].style[transform] = "";
					slidesControl[0].style[duration] = "";
					// 重置当前幻灯片的样式
					slidesControl.children(":eq(" + next + ")")
						.css({
							left: 0
						});
						// 重置非当前幻灯片的样式
					slidesControl.children(":not(:eq(" + next + "))")
						.css({
							display: "none",
							left: 0,
							zIndex: 0
						});
				}, this));

			// 否则使用jquery动画
			} else {
				slidesControl.stop().animate({
					left: direction
				}, this.options.effect.slide.speed, function() {
					// 动画结束时重置样式
					slidesControl.css({
						left: 0
					});
					slidesControl.children(":eq(" + next + ")").css({
						left: 0
					});
					slidesControl.children(":eq(" + currentSlide + ")").css({
						display: "none",
						left: 0,
						zIndex: 0
					});
				});
			}
			// 更新current属性
			this.current = next;
			// 更新animating为false
			this.animating = false;
			// 重置touch事件
			if (Plugin.hasTouch) {
				this.setupTouch();
			}
			// 执行slide结束回调
			this.options.callback.complete(next + 1);
		}
	};


	/**
	 * 幻灯片滑动方法
	 * @param number {Number} 幻灯片的索引
	 **/
	Plugin.prototype.fade = function (number) {
		// 如果幻灯片不在运动中（即animating状态为false时），
		// 且要移动的位置不是当前
		if (!this.animating && number !== this.current + 1) {

			var currentSlide = this.current,
				next,
				value;

			// 设置animating状态为true
			this.animating = true;

			// 如果定义了number，则向前或向后移动(number － 1)个单位
			if (number) {
				number = number - 1;
				value  = number > currentSlide ? 1 : -1;
				next   = number;

			// 如果未定义number，则默认向前或向后移动一个单位
			} else {
				value = this.direction === "next" ? 1 : -1;
				next  = currentSlide + value;
			}

			// 循环播放幻灯片
			if (next === -1) {
				next = this.total - 1;
			}
			if (next === this.total) {
				next = 0;
			}

			// 设置pagination的状态
			this.setPaginationActive(next);

			var slidesControl = this.slidesControl;
			// 设置要移动到视口幻灯片的样式
			slidesControl.children(":eq(" + next + ")")
				.css({
					display: "none",
					left: 0,
					zIndex: 10
				});

			// 执行start回调
			this.options.callback.start(currentSlide + 1);

			// 如果淡入淡出动画有过渡效果
			if (this.options.effectOptions.fade.crossfade) {
				// 执行过渡动画，fadeOut当前幻灯片
				slidesControl.children(":eq(" + this.current + ")")
					.stop()
					.fadeOut(this.options.effectOptions.fade.speed);

				// 执行过渡动画，fadeIn当前要呈现在视口的幻灯片
				slidesControl.children(":eq(" + next + ")")
					.stop()
					.fadeIn(this.options.effectOptions.fade.speed, $.proxy(function() {
						// 动画结束后
						slidesControl.children(":eq(" + next + ")").css('z-index', '0');
						// 设置this.animating为false
						this.animating = false;
						// 重置this.current属性
						this.current = next;
						// 执行完成回调
						this.options.callback.complete(next + 1);
					}, this));

			// 如果入淡出动画没有过渡效果
			} else {
				slidesControl.children(":eq(" + currentSlide + ")")
					.stop()
					.fadeOut(this.options.effectOptions.fade.speed, $.proxy(function() {
						slidesControl.children(":eq(" + next + ")")
							.stop()
							.fadeIn(this.options.effectOptions.fade.speed, function() {
								slidesControl.children(":eq(" + next + ")").css('z-index', '10');
							});
							this.animating = false;
							this.current = next;
							this.options.callback.complete(next + 1);
					}, this));
			}
		}
	};

	return $.fn[pluginName] = function(options) {
		return this.each(function() {
			if (!$.data(this, "plugin_" + pluginName)) {
				return $.data(this, "plugin_" + pluginName, new Plugin(this, options));
			}
		});
	};
	
})(jQuery);
