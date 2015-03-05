
(function($) {

	var pluginName = "wSlides",

		defaults = {
			// 默认幻灯片的宽度
			width:  'auto',
			// 默认幻灯片的高度
			height: 'auto',
			// 默认第一个幻灯片开始
			start:  1,
			// 默认导航设置
			navigation: {
				active: true,
				effect: "slide"
			},
			// 默认分页设置
			pagination: {
				active: true,
				effect: "slide"
			},
			// 默认播放设置
			play: {
				active:       true,
				effect:       "slide",
				interval:     5000,
				auto:         false,
				swap:         false,
				// pauseOnHover: false,
				restartDelay: 2500
			},
			// 默认动画效果设置
			effect: {
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
	};


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
		this.total = $el.children().not(".slidesjs-navigation").length;
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
				position: "relative"
			});

		$el.show();

		// 初始化插件尺寸
		this.update();

		// 初始化触摸事件
		if (Plugin.hasTouch) {
			this.setuptouch();
			this.slidesControl.on('touchstart', this.touchstart);
			this.slidesControl.on('touchmove', this.touchstart);
			this.slidesControl.on('touchend', this.touchstart);
		}

		// 初始化时，显示current图片，并设置zindex为10
		this.slidesControl.children(":eq(" + this.data.current + ")").eq(0)
			.fadeIn(0, function() {
				$(this).css('z-index',10);
			});

		// 初始化导航
		if (this.options.navigation.active) {
			var prevBtn, nextBtn;

			// 添加prev-button及侦听其click事件
			prevBtn = $("<a>", {"class": "wslides-previous wslides-navigation", href: "#", title: "Previous", text: "Previous"})
				.appendTo($el)
				.on('click', $.proxy(function (e) {
					this.stop(true);
					this.previous(this.options.navigation.effect);
					e.preventDefault();
				}, this));

			// 添加next-button及侦听其click事件
			nextBtn = $("<a>", {"class": "wslides-next wslides-navigation", href: "#", title: "Next", text: "Next"})
				.appendTo($el)
				.on('click', $.proxy(function (e) {
					this.stop(true);
					this.next(this.options.navigation.effect);
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
				.appendTo($element);

			for (var i = 0, l = this.data.total; i < l; i++) {
				var paginationItem, paginationLink;

				paginationItem = $("<li>", {"class": "wslides-pagination-item"})
					.appendTo(pagination);

				paginationLink = $("<a>", {"href": "#", "wslides-item": i, html: i + 1})
					.appendTo(paginationItem)
					.on('click', $.proxy(function (e) {
						this.stop(true);
						this.goto($(e.currentTarget).attr("wlides-item") * 1 + 1);
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
	Plugin.prototype.setPaginationActive = function (num) {
		var current = num > -1 ? num : this.data.current;
		$(".active").removeClass("active");
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
	Plugin.prototype.next = function (effect) {
		this.direction = "next";
		effect === "fade" ? this.fade() : this.slide();
	};

	/**
	 * 查看下一张幻灯片
	 * @param effect {String}
	 **/
	Plugin.prototype.previous = function (effect) {
		this.direction = "previous";
		effect === "fade" ? this.fade() : this.slide();
	};

	/**
	 * 查看某张幻灯片
	 * @param num {Number}
	 **/
	Plugin.prototype.goto = function (num) {
		if (num > this.data.total) {
			num = this.data.total;
		}
		if (num < 1) {
			num = 1;
		}
		effect === "fade" ? this.fade() : this.slide();
	};


	/**
	 *
	 *
	 **/
	Plugin.prototype.setuptouch = function () {
		var previous = this.data.current - 1,
			next = this.data.current + 1;
		// 循环播放图片
		if (previous < 0) {
			previous = this.data.total - 1;
		}
		if (next > this.data.total - 1) {
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
	 *
	 *
	 **/
	Plugin.prototype.touchstart = function (e) {
		this.setuptouch();
		var touches = e.originalEvent.touches[0];
		this.touchtimer = Number(new Date());
		this.touchstartx = touches.pageX;
		this.touchstarty = touches.pageY;
		e.stopPropagation();
	};

	/**
	 *
	 *
	 **/
	Plugin.prototype.touchend = function (e) {
		var touches = e.originalEvent.touches[0],
			left = this.slidesControl.position().left,
			width = this.options.width;

		if (left > width * 0.5 ||
			left > width * 0.1 &&
			(Number(new Date()) - this.data.touchtimer < 250)) {
			this.direction = "previous";
			this.slide();

		} else if (left < (- width * 0.5) ||
				   left < (- width * 0.1) &&
				   (Number(new Date()) - this.data.touchtimer < 250)) {
			this.direction = "next";
			this.slide();

		} else {
			var transform = Plugin.vendorPrefix + "Transform",
				duration  = Plugin.vendorPrefix + "TransitionDuration",
				timing    = Plugin.vendorPrefix + "TransitionTimingFunction";
			this.slidesControl[0].style[transform] = "translateX(0px)";
			this.slidesControl[0].style[duration]  = this.options.effect.slide.speed * 0.85 + "ms";
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
	 *
	 *
	 **/
	Plugin.prototype.touchmove = function (e) {
		var	touches = e.originalEvent.touches[0],
			transform = Plugin.vendorPrefix + "Transform";
		this.scrolling = Math.abs(touches.pageX - this.touchstartx) < Math.abs(touches.pageY - this.touchstarty);
		if (!this.data.animating && !this.scrolling) {
			e.preventDefault();
			this.setuptouch();
			this.slidesControl[0].style[transform] = "translateX(" + (touches.pageX - this.touchstartx) + "px)";
		}
		e.stopPropagation();
	};


	/**
	 *
	 * @todo setTimeout中this的指向
	 **/
	Plugin.prototype.play = function (next) {
		if (this.playInterval) {
			var 
			if (next) {
				// var currentSlide = this.current;
				this.direction = "next";
				this.options.play.effect === "fade" ? this.fade() : this.silde();
			}
			this.playInterval = setInterval($.proxy(function() {
				// var currentSlide = this.current;
				this.direction = "next";
				this.slide();
			}, this), this.options.play.interval);

			this.playing = true;

			this.playBtn.addClass("wslides-playing");

			if (this.options.play.swap) {
				$(".slidesjs-play").hide();
				$(".slidesjs-stop").show();
			}
		}
	};


	/**
	 *
	 * @todo setTimeout中this的指向
	 **/
	Plugin.prototype.stop = function (clicked) {
		clearInterval(this.playInterval);
		this.playInterval = null;
		this.playing = false;
		this.playBtn.removeClass("wslides-playing");
		if (this.options.play.swap) {
			$(".slidesjs-stop").hide();
			$(".slidesjs-play").show();
		}
	};


	/**
	 * number 幻灯片的索引
	 **/
	Plugin.prototype.slide = function (number) {

		var vector, next, value,

		var currentSlide = this.current,
			width = this.options.width;

		// 如果幻灯片不在运动中，且导航不是当前
		if (!this.animating && number !== currentSlide + 1) {
			this.animating = true;
			if (number > -1) {
				number = number - 1;
				value = (number > currentSlide) ? 1 : -1;
				vertor = (number > currentSlide) ? - width: width;
				next = number;
			} else {
				value = this.direction === "next" ? 1 : -1;
				vector = this.direction === "next" ? - width : width;
				next = currentSlide + value;
			}

			// Loop from first to last slide
			if (next === -1) {
				next = this.total - 1;
			}
			// Loop from last to first slide
			if (next === this.total) {
				next = 0;
			}

			this.setPaginationActive(next);

			var slidesControl = this.slidesControl;

			slidesControl.children(":eq(" + next + ")")
				.css({
					display: "block",
					left: value * this.options.width,
					zIndex: 10
				});

			this.options.callback.start(currentSlide + 1);

			// 如果浏览器支持css3的transition属性
			// 就是用css3动画
			// 否则使用jquery动画
			if (Plugin.vendorPrefix) {
				// 缓存样式前缀
				var transform = Plugin.vendorPrefix + "Transform",
					duration = Plugin.vendorPrefix + "TransitionDuration";
				// 设置幻灯片的Transform和TransitionDuration
				// 制造动画效果
				slidesControl[0].style[transform] = "translateX(" + direction + "px)"; // @direction 为移动的距离
				slidesControl[0].style[duration] = this.options.effect.slide.speed + "ms"; // @speed 为移动的速度
				// 侦听transition end事件一次
				slidesControl.one("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
					// 过渡动画结束时，
					// 重置Transform和TransitionDuration
					slidesControl[0].style[transform] = "";
					slidesControl[0].style[duration] = "";
					// 重置幻灯片的样式
					slidesControl.children(":eq(" + next + ")")
						.css({
							left: 0
						});
					slidesControl.children(":not(:eq(" + next + "))")
						.css({
							display: "none",
							left: 0,
							zIndex: 0
						});

					$.data(_this, "current", next);
					$.data(_this, "animating", false);
					
					if (_this.data.touch) {
						_this._setuptouch();
					}
					return _this.options.callback.complete(next + 1);
				});

			} else {

				slidesControl.stop().animate({
					left: direction
				}, this.options.effect.slide.speed, (function() {
					slidesControl.css({
						left: 0
					});
					slidesControl.children(":eq(" + next + ")").css({
						left: 0
					});
					return slidesControl.children(":eq(" + currentSlide + ")").css({
						display: "none",
						left: 0,
						zIndex: 0
					}, $.data(_this, "current", next), $.data(_this, "animating", false), _this.options.callback.complete(next + 1));
				}));

			}
		}
	};

	Plugin.prototype.fade = function(i) {
		var _this = this;
		if (!this.data.animating && number !== this.data.current + 1) {
			$.data(this, "animating", true);
			var currentSlide = this.data.current;
			var next;
			var value;

			if (i) {
				i = i - 1;
				value = i > currentSlide ? 1 : -1;
				next = i;
			} else {
				value = this.data.direction === "next" ? 1 : -1;
				next = currentSlide + value;
			}

			if (next === -1) {
				next = this.data.total - 1;
			}
			if (next === this.data.total) {
				next = 0;
			}

			this.setPaginationActive(next);

			var slidesControl = $(".slidesjs-control");

			slidesControl.children(":eq(" + next + ")")
				.css({
					display: "none",
					left: 0,
					zIndex: 10
				});

			this.options.callback.start(currentSlide + 1);

			if (this.options.effect.fade.crossfade) {

				slidesControl.children(":eq(" + this.data.current + ")")
					.stop()
					.fadeOut(this.options.effect.fade.speed);

				slidesControl.children(":eq(" + next + ")")
					.stop()
					.fadeIn(this.options.effect.fade.speed, function() {
						slidesControl.children(":eq(" + next + ")").css({
							zIndex: 0
						});
						$.data(_this, "animating", false);
						$.data(_this, "current", next);
						_this.options.callback.complete(next + 1);
					});

			} else {

				slidesControl.children(":eq(" + currentSlide + ")")
					.stop()
					.fadeOut(this.options.effect.fade.speed, function() {
					slidesControl.children(":eq(" + next + ")")
						.stop()
						.fadeIn(_this.options.effect.fade.speed, function() {
							return slidesControl.children(":eq(" + next + ")").css({
								zIndex: 10
							});
						});
						$.data(_this, "animating", false);
						$.data(_this, "current", next);
						_this.options.callback.complete(next + 1);
					});
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
