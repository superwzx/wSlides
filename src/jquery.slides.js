
(function($, window, document) {

	var pluginName = "wzxSlides",

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
				swap:         true,
				pauseOnHover: false,
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

	function Plugin (element, options) {
		this.element = element;
		this.options = $.extend(true, {}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	};

	/**
	 * 幻灯片实例初始化函数
	 *
	 **/
	Plugin.prototype.init = function() {
		var nextButton, pagination, playButton, prevButton, stopButton, _this = this;
		// $element 指slide容器
		var $element = $(this.element);
		this.data = $.data(this);
		$.data(this, "animating", false);
		// this.total = 幻灯片的数量
		$.data(this, "total", $element.children().not(".slidesjs-navigation", $element).length);
		$.data(this, "current", this.options.start - 1);
		// 监测浏览器核心
		$.data(this, "vendorPrefix", this._getVendorPrefix());

		// 先将容器隐藏
		$element.css({
			overflow: "hidden"
		});

		// $element
		// 	.wrapInner('<div class="slidesjs-control" style="position: relative; left: 0;">')
		// 	.wrapInner('<div class="slidesjs-container" style="overflow: hidden; position: relative; border: 1px solid red;" />')

		$element
			.children().not('.slidesjs-navigation')
				.addClass("slidesjs-slide")
				.css({
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					zIndex: 0,
					display: "none",
					webkitBackfaceVisibility: "hidden"
				})
				.wrapAll('<div class="slidesjs-container">')
				.parent()
					.css({
						overflow: "hidden",
						position: "relative"
					})
					.wrapInner('<div class="slidesjs-control" style="position: relative; left: 0;">');
			

		$.each($(".slidesjs-control").children(), function(i) {
			return $(this).attr("slidesjs-index", i);
		});

		// 检测设备是否支持触摸事件
		if (typeof TouchEvent !== "undefined") {
			$.data(this, "touch", true);
			this.options.effect.slide.speed = this.options.effect.slide.speed / 2;
		}

		$element.fadeIn(0);

		// 调整宽高
		this.update();

		// 触摸事件
		if (this.data.touch) {
			$(".slidesjs-control").on("touchstart", function(e) {
				return _this._touchstart(e);
			});
			$(".slidesjs-control").on("touchmove", function(e) {
				return _this._touchmove(e);
			});
			$(".slidesjs-control").on("touchend", function(e) {
				return _this._touchend(e);
			});
			this._setuptouch();
		}

		// 初始化时，显示current图片，并设置zindex为10
		$(".slidesjs-control").children(":eq(" + this.data.current + ")").eq(0).fadeIn(0, function() {
			return $(this).css({
				zIndex: 10
			});
		});

		// 导航为true的话，构造分页
		if (this.options.navigation.active) {
			prevButton = $("<a>", {
				"class": "slidesjs-previous slidesjs-navigation",
				href: "#",
				title: "Previous",
				text: "Previous"
			}).appendTo($element);
			nextButton = $("<a>", {
				"class": "slidesjs-next slidesjs-navigation",
				href: "#",
				title: "Next",
				text: "Next"
			}).appendTo($element);
		}

		// 注册“next”事件
		$(".slidesjs-next").click(function(e) {
			e.preventDefault();
			_this.stop(true);
			return _this.next(_this.options.navigation.effect);
		});

		// 注册“prev”事件
		$(".slidesjs-previous").click(function(e) {
			e.preventDefault();
			_this.stop(true);
			return _this.previous(_this.options.navigation.effect);
		});

		// 是否自动播放
		if (this.options.play.active) {
			playButton = $("<a>", {
				"class": "slidesjs-play slidesjs-navigation",
				href: "#",
				title: "Play",
				text: "Play"
			}).appendTo($element);
			stopButton = $("<a>", {
				"class": "slidesjs-stop slidesjs-navigation",
				href: "#",
				title: "Stop",
				text: "Stop"
			}).appendTo($element);
			playButton.click(function(e) {
				e.preventDefault();
				return _this.play(true);
			});
			stopButton.click(function(e) {
				e.preventDefault();
				return _this.stop(true);
			});
			if (this.options.play.swap) {
				stopButton.css({
					display: "none"
				});
			}
		}

		// 是否加载分页
		if (this.options.pagination.active) {
			pagination = $("<ul>", {
				"class": "slidesjs-pagination"
			}).appendTo($element);
			$.each(new Array(this.data.total), function(i) {
				var paginationItem, paginationLink;
				paginationItem = $("<li>", {
					"class": "slidesjs-pagination-item"
				}).appendTo(pagination);
				paginationLink = $("<a>", {
					href: "#",
					"data-slidesjs-item": i,
					html: i + 1
				}).appendTo(paginationItem);
				return paginationLink.click(function(e) {
					e.preventDefault();
					_this.stop(true);
					return _this.goto(($(e.currentTarget).attr("data-slidesjs-item") * 1) + 1);
				});
			});
		}

		// 注册window resize事件
		$(window).bind("resize", function() {
			return _this.update();
		});

		this._setActive();

		// 是否加载后就自动播放
		if (this.options.play.auto) {
			this.play();
		}

		// 执行load callback
		this.options.callback.loaded(this.options.start);
	};

	// 设置导航的active样式
	Plugin.prototype._setActive = function(number) {
		var $element = $(this.element),
			current = number > -1 ? number : this.data.current;
		$(".active").removeClass("active");
		$(".slidesjs-pagination li:eq(" + current + ") a").addClass("active");
	};

	// 更新宽高
	Plugin.prototype.update = function() {
		var $element = $(this.element),
			width = $element.width(),
			height = (this.options.height / this.options.width) * width;

		$(".slidesjs-control").children(":not(:eq(" + this.data.current + "))")
			.css({
				display: "none",
				left: 0,
				zIndex: 0
			});

		this.options.width = width;
		this.options.height = height;
		$(".slidesjs-control, .slidesjs-container").css({
			width: width,
			height: height
		});
	};

	// 下一张图片
	Plugin.prototype.next = function(effect) {
		var $element = $(this.element);
		$.data(this, "direction", "next");
		if (effect === void 0) {
			effect = this.options.navigation.effect;
		}
		if (effect === "fade") {
			return this._fade();
		} else {
			return this._slide();
		}
	};

	// 上一张图片
	Plugin.prototype.previous = function(effect) {
		var $element = $(this.element);
		$.data(this, "direction", "previous");
		if (effect === void 0) {
			effect = this.options.navigation.effect;
		}
		if (effect === "fade") {
			return this._fade();
		} else {
			return this._slide();
		}
	};

	// 跳转到指定幻灯片
	Plugin.prototype.goto = function(number) {
		var $element = $(this.element),
			effect;

		if (effect === void 0) {
			effect = this.options.pagination.effect;
		}

		if (number > this.data.total) {
			number = this.data.total;
		} else if (number < 1) {
			number = 1;
		}

		if (typeof number === "number") {
			if (effect === "fade") {
				return this._fade(number);
			} else {
				return this._slide(number);
			}
		} else if (typeof number === "string") {
			if (number === "first") {
				if (effect === "fade") {
					return this._fade(0);
				} else {
					return this._slide(0);
				}
			} else if (number === "last") {
				if (effect === "fade") {
					return this._fade(this.data.total);
				} else {
					return this._slide(this.data.total);
				}
			}
		}
	};

	// touch设置
	Plugin.prototype._setuptouch = function() {
		var $element, next, previous, slidesControl;
		$element = $(this.element);
		this.data = $.data(this);
		slidesControl = $(".slidesjs-control", $element);
		next = this.data.current + 1;
		previous = this.data.current - 1;
		if (previous < 0) {
			previous = this.data.total - 1;
		}
		if (next > this.data.total - 1) {
			next = 0;
		}
		slidesControl.children(":eq(" + next + ")").css({
			display: "block",
			left: this.options.width
		});
		return slidesControl.children(":eq(" + previous + ")").css({
			display: "block",
			left: -this.options.width
		});
	};

	// touch开始
	Plugin.prototype._touchstart = function(e) {
		var $element, touches;
		$element = $(this.element);
		this.data = $.data(this);
		touches = e.originalEvent.touches[0];
		this._setuptouch();
		$.data(this, "touchtimer", Number(new Date()));
		$.data(this, "touchstartx", touches.pageX);
		$.data(this, "touchstarty", touches.pageY);
		return e.stopPropagation();
	};

	// 
	Plugin.prototype._touchend = function(e) {
		var $element, duration, prefix, slidesControl, timing, touches, transform,
			_this = this;
		$element = $(this.element);
		this.data = $.data(this);
		touches = e.originalEvent.touches[0];
		slidesControl = $(".slidesjs-control", $element);
		if (slidesControl.position().left > this.options.width * 0.5 || slidesControl.position().left > this.options.width * 0.1 && (Number(new Date()) - this.data.touchtimer < 250)) {
			$.data(this, "direction", "previous");
			this._slide();
		} else if (slidesControl.position().left < -(this.options.width * 0.5) || slidesControl.position().left < -(this.options.width * 0.1) && (Number(new Date()) - this.data.touchtimer < 250)) {
			$.data(this, "direction", "next");
			this._slide();
		} else {
			prefix = this.data.vendorPrefix;
			transform = prefix + "Transform";
			duration = prefix + "TransitionDuration";
			timing = prefix + "TransitionTimingFunction";
			slidesControl[0].style[transform] = "translateX(0px)";
			slidesControl[0].style[duration] = this.options.effect.slide.speed * 0.85 + "ms";
		}
		slidesControl.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
			prefix = _this.data.vendorPrefix;
			transform = prefix + "Transform";
			duration = prefix + "TransitionDuration";
			timing = prefix + "TransitionTimingFunction";
			slidesControl[0].style[transform] = "";
			slidesControl[0].style[duration] = "";
			return slidesControl[0].style[timing] = "";
		});
		return e.stopPropagation();
	};

	Plugin.prototype._touchmove = function(e) {
		var $element, prefix, slidesControl, touches, transform;
		$element = $(this.element);
		this.data = $.data(this);
		touches = e.originalEvent.touches[0];
		prefix = this.data.vendorPrefix;
		slidesControl = $(".slidesjs-control", $element);
		transform = prefix + "Transform";
		$.data(this, "scrolling", Math.abs(touches.pageX - this.data.touchstartx) < Math.abs(touches.pageY - this.data.touchstarty));
		if (!this.data.animating && !this.data.scrolling) {
			e.preventDefault();
			this._setuptouch();
			slidesControl[0].style[transform] = "translateX(" + (touches.pageX - this.data.touchstartx) + "px)";
		}
		return e.stopPropagation();
	};

	Plugin.prototype.play = function(next) {
		var $element = $(this.element),
			_this = this,
			currentSlide,
			slidesContainer;

		if (!this.data.playInterval) {
			if (next) {
				currentSlide = this.data.current;
				this.data.direction = "next";
				if (this.options.play.effect === "fade") {
					this._fade();
				} else {
					this._slide();
				}
			}
			$.data(this, "playInterval", setInterval((function() {
				currentSlide = _this.data.current;
				_this.data.direction = "next";
				if (_this.options.play.effect === "fade") {
					return _this._fade();
				} else {
					return _this._slide();
				}
			}), this.options.play.interval));
			slidesContainer = $(".slidesjs-container", $element);
			if (this.options.play.pauseOnHover) {
				slidesContainer.unbind();
				slidesContainer.bind("mouseenter", function() {
					return _this.stop();
				});
				slidesContainer.bind("mouseleave", function() {
					if (_this.options.play.restartDelay) {
						return $.data(_this, "restartDelay", setTimeout((function() {
							return _this.play(true);
						}), _this.options.play.restartDelay));
					} else {
						return _this.play();
					}
				});
			}
			$.data(this, "playing", true);
			$(".slidesjs-play", $element).addClass("slidesjs-playing");
			if (this.options.play.swap) {
				$(".slidesjs-play", $element).hide();
				return $(".slidesjs-stop", $element).show();
			}
		}
	};


	Plugin.prototype.stop = function(clicked) {
		var $element;
		$element = $(this.element);
		this.data = $.data(this);
		clearInterval(this.data.playInterval);
		if (this.options.play.pauseOnHover && clicked) {
			$(".slidesjs-container", $element).unbind();
		}
		$.data(this, "playInterval", null);
		$.data(this, "playing", false);
		$(".slidesjs-play", $element).removeClass("slidesjs-playing");
		if (this.options.play.swap) {
			$(".slidesjs-stop", $element).hide();
			return $(".slidesjs-play", $element).show();
		}
	};

	/**
	 * number 幻灯片的索引
	 **/
	Plugin.prototype._slide = function(number) {

		var direction, next, value,
			_this = this;
		var $element = $(this.element);
		var currentSlide = this.data.current;

		// 如果幻灯片不在运动中，且导航不是当前
		if (!this.data.animating && number !== currentSlide + 1) {
			$.data(this, "animating", true);
			
			if (number > -1) {
				number = number - 1;
				value = (number > currentSlide) ? 1 : -1;
				direction = (number > currentSlide) ? -this.options.width : this.options.width;
				next = number;
			} else {
				value = this.data.direction === "next" ? 1 : -1;
				direction = this.data.direction === "next" ? -this.options.width : this.options.width;
				next = currentSlide + value;
			}

			// Loop from first to last slide
			if (next === -1) {
				next = this.data.total - 1;
			}
			// Loop from last to first slide
			if (next === this.data.total) {
				next = 0;
			}

			this._setActive(next);

			var slidesControl = $(".slidesjs-control");

			slidesControl.children(":eq(" + next + ")").css({
				display: "block",
				left: value * this.options.width,
				zIndex: 10
			});

			// this.options.callback.start(currentSlide + 1);

			if (this.data.vendorPrefix) {
				// 获取浏览器前缀和css前缀
				var prefix = this.data.vendorPrefix;
				var transform = prefix + "Transform";
				var duration = prefix + "TransitionDuration";
				// transition
				// @direction 为移动的距离
				// @speed 为移动的速度
				slidesControl[0].style[transform] = "translateX(" + direction + "px)";
				slidesControl[0].style[duration] = this.options.effect.slide.speed + "ms";
				slidesControl[0].style["border"] = "1px solid blue";
				// transition-end事件
				slidesControl.one("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
					slidesControl[0].style[transform] = "";
					slidesControl[0].style[duration] = "";

					slidesControl.children(":eq(" + next + ")").css({
						left: 0
					});

					$.data(_this, "current", next);
					$.data(_this, "animating", false);
					// 
					slidesControl.children(":not(:eq(" + next + "))").css({
						display: "none",
						left: 0,
						zIndex: 0
					});
					
					if (_this.data.touch) {
						_this._setuptouch();
					}
					// return _this.options.callback.complete(next + 1);
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

	Plugin.prototype._fade = function(number) {
		var _this = this;
		var $element = $(this.element);
		this.data = $.data(this);
		if (!this.data.animating && number !== this.data.current + 1) {
			$.data(this, "animating", true);
			var currentSlide = this.data.current;
			var next;
			var value;
			if (number) {
				number = number - 1;
				value = number > currentSlide ? 1 : -1;
				next = number;
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

			this._setActive(next);

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

	// @Des 检测浏览器核心 ？？
	Plugin.prototype._getVendorPrefix = function() {
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
	}

	return $.fn[pluginName] = function(options) {
		return this.each(function() {
			if (!$.data(this, "plugin_" + pluginName)) {
				return $.data(this, "plugin_" + pluginName, new Plugin(this, options));
			}
		});
	};
	
})(jQuery, window, document);
