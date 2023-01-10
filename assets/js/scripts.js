//= require vendor/jquery-3.4.1.min.js
//= require vendor/jquery.cookie-1.4.1.js
//= require vendor/wobble.browser.min.js
//= require vendor/slick.min.js

function constructTransform(attrSprings, opts) {
  var parts = [];
  if (attrSprings.translateX || attrSprings.translateY) {
    var vals = [
      attrSprings.translateX ? attrSprings.translateX.currentValue : 0,
      attrSprings.translateY ? attrSprings.translateY.currentValue : 0,
    ];
    if (opts.asStyle) {
      parts.push("translate3d(" + vals.map(v => v + "%").join(", ") + ", 0)");
    } else {
      parts.push("translate(" + vals.join(" ") + ")");
    }
  }
  if (attrSprings.scale) {
    parts.push("scale(" + attrSprings.scale.currentValue + ")");
  }
  return parts.join(" ");
}

function applyCss(el, attr, val) {
  el.css(attr, val);
  if (attr === "opacity") {
    if (val < 0.2) {
      el.css({pointerEvents: "none"});
    } else {
      el.css({pointerEvents: "initial"});
    }
  }
}

function createKeyframeListener(el, opts) {
  var opts = opts || {asStyle: false};
  var targetVals = []; // {keyframeVal: 0.2, springs: [{spring, targetVal}]}
  var attrSprings = {}; // one spring for each attribute that is listed
  var enable = true;
  var resizeListener = null;

  var mediaQuery = el.data("only-animate-if-matches");
  if (mediaQuery && window.matchMedia) {
    resizeListener = () => {
      var mql = window.matchMedia(mediaQuery);
      enable = mql.matches;
    };
  }

  var applyAttr = opts.asStyle
    ? (attr, val) => applyCss(el, attr, val)
    : (attr, val) => el.attr(attr, val);
  el.data(opts.asStyle ? "style-keyframes" : "keyframes")
    .trim()
    .split(/\s+/g)
    .forEach(keyframe => {
      var m = keyframe.trim().match(/(-?[\d.]+):(.*)/);
      if (m) {
        var keyframeVal = parseFloat(m[1]);
        var springs = [];
        m[2].split(",").map(attr => {
          var splitted = attr.split("=");
          var attr = splitted[0];
          var val = parseFloat(splitted[1]);
          var spring = attrSprings[attr];
          var isTransform = attr.indexOf("translate") === 0 || attr === "scale";

          if (!spring) {
            var currVal = isTransform ? val : parseFloat(el.attr(attr), 10) || 0;
            spring = new Wobble.Spring({
              damping: 15,
              fromValue: currVal,
              toValue: currVal,
            });
            if (isTransform) {
              spring.onUpdate(() => {
                if (enable) {
                  applyAttr("transform", constructTransform(attrSprings, opts));
                } else {
                  applyAttr("transform", null);
                }
              });
            } else {
              spring.onUpdate(s => {
                if (enable) {
                  applyAttr(attr, s.currentValue);
                } else {
                  applyAttr(attr, "initial");
                }
              });
            }
            attrSprings[attr] = spring;
          }
          springs.push({spring: spring, targetValue: val});
        });
        targetVals.push({
          keyframeVal: keyframeVal,
          springs: springs,
        });
      }
    });

  targetVals.reverse();

  function handleProgress(progress) {
    var firstValidTargetVal = targetVals.filter(targetVal => progress >= targetVal.keyframeVal)[0];
    if (!firstValidTargetVal) return;
    firstValidTargetVal.springs.forEach(data => {
      data.spring.updateConfig({toValue: data.targetValue});
      data.spring.start();
    });
  }
  return {handleProgress: handleProgress, handleResize: resizeListener};
}

function createClassOnRangeListener(el) {
  var classList = [];
  el.data("class-on-range")
    .trim()
    .split(/\s+/g)
    .forEach(keyframe => {
      var m = keyframe.trim().match(/(-?[\d.]+)-([\d.]+):(.*)/);
      if (m) {
        classList.push({
          start: parseFloat(m[1]),
          end: parseFloat(m[2]),
          className: m[3],
        });
      }
    });
  function handleProgress(progress) {
    classList.forEach(data => {
      if (progress >= data.start && progress < data.end) {
        el.addClass(data.className);
      } else {
        el.removeClass(data.className);
      }
    });
  }
  return handleProgress;
}

function setupScrollSpy() {
  $("[data-scrollspy]").each(function() {
    var scrollArea = $(this);
    var keyframeEls = [];
    var scrollListeners = [];
    var resizeListeners = [];
    var maxIdx = -1;
    var currIdx = -1;

    function handleResize() {
      keyframeEls = [];
      scrollArea.find("[data-keyframe-marker]").each(function(idx) {
        var el = $(this);
        maxIdx = idx;
        keyframeEls.push({
          idx: idx,
          top: el.offset().top,
          height: el.height(),
        });
      });
      resizeListeners.forEach(checkerFn => checkerFn());
      handleScroll();
    }

    function handleScroll() {
      var prevIdx = currIdx;
      currIdx = -1;
      var currMin = 9999;
      keyframeEls.forEach(el => {
        if (window.scrollY + window.innerHeight < el.top) {
          // below fold
          return;
        }
        if (window.scrollY > el.top + el.height) {
          if (currIdx === -1) currIdx = maxIdx + 1;
          // above viewport
          return;
        }
        const distToCenter = Math.abs(
          window.scrollY + window.innerHeight / 2 - (el.top + el.height / 2)
        );
        if (distToCenter < currMin) {
          currMin = distToCenter;
          currIdx = el.idx;
        }
      });
      if (prevIdx !== currIdx) {
        scrollListeners.forEach(fn => fn(currIdx));
        scrollArea.find("[data-prev-button]").attr("disabled", currIdx <= 1);
        scrollArea.find("[data-next-button]").attr("disabled", currIdx >= maxIdx);
      }
    }

    scrollArea.find("[data-keyframes]").each(function() {
      var el = $(this);
      var retVal = createKeyframeListener(el);
      scrollListeners.push(retVal.handleProgress);
      if (retVal.handleResize) resizeListeners.push(retVal.handleResize);
    });

    scrollArea.find("[data-style-keyframes]").each(function() {
      var el = $(this);
      var retVal = createKeyframeListener(el, {asStyle: true});
      scrollListeners.push(retVal.handleProgress);
      if (retVal.handleResize) resizeListeners.push(retVal.handleResize);
    });

    scrollArea.find("[data-class-on-range]").each(function() {
      var el = $(this);
      scrollListeners.push(createClassOnRangeListener(el));
    });

    function scrollToTargetIdx(idx, dir) {
      var target = keyframeEls[idx];
      const scrollTo =
        target.top + target.height / 2 - window.innerHeight * (dir === "up" ? 0.3 : 0.7);
      $("html, body").animate({scrollTop: scrollTo}, 100);
    }

    scrollArea.find("[data-prev-button]").on("click", function() {
      if (currIdx > 1) scrollToTargetIdx(currIdx - 1, "up");
    });
    scrollArea.find("[data-next-button]").on("click", function() {
      if (currIdx < maxIdx) scrollToTargetIdx(currIdx + 1, "down");
    });

    scrollArea.find("[data-prev-button]").each(function() {
      var btn = $(this);
      btn.on("click", function() {
        if (currIdx > 1) {
          var target = keyframeEls[currIdx - 1];
          $("html, body").animate(
            {scrollTop: target.top + target.height / 2 - window.innerHeight * 0.3},
            500
          );
        }
      });
    });

    $(window).on("resize", handleResize);
    $(window).on("scroll", handleScroll);
    handleResize();
    handleScroll();
  });
}

function toggleButton() {
  $("[data-toggle]").each(function() {
    var el = $(this);
    var hasHidden = el.children(".hidden").length > 0;
    var style = el.data("toggle-style") || "fade";
    el.on("click", function() {
      $(el.data("toggle"))[style + "Toggle"](250);
      if (hasHidden) el.children().toggleClass("hidden");
    });
  });
}

function headerScroll() {
  var el = $(".main-header,#mobile-nav");
  var windowHeight = $(window).innerHeight() * 0.8;
  var handleScroll = () => {
    if (window.scrollY < windowHeight - 30) {
      el.removeClass("is-scrolled-a-page");
    } else if (window.scrollY > windowHeight) {
      el.addClass("is-scrolled-a-page");
    }
  };
  $(window).on("scroll", handleScroll);
  handleScroll();
}

// This function is being called by the google-maps script
function initMap() {
  var styles = [
    {elementType: "geometry", stylers: [{color: "#f5f5f5"}]},
    {elementType: "labels.icon", stylers: [{visibility: "off"}]},
    {elementType: "labels.text.fill", stylers: [{color: "#616161"}]},
    {elementType: "labels.text.stroke", stylers: [{color: "#f5f5f5"}]},
    {
      featureType: "administrative.land_parcel",
      elementType: "labels.text.fill",
      stylers: [{color: "#bdbdbd"}],
    },
    {
      featureType: "administrative.country",
      elementType: "geometry.stroke",
      stylers: [{color: "#9e9e9e"}],
    },
    {featureType: "poi", elementType: "geometry", stylers: [{color: "#eeeeee"}]},
    {featureType: "poi", elementType: "labels.text.fill", stylers: [{color: "#757575"}]},
    {featureType: "poi.park", elementType: "geometry", stylers: [{color: "#e5e5e5"}]},
    {featureType: "poi.park", elementType: "labels.text.fill", stylers: [{color: "#9e9e9e"}]},
    {featureType: "road", elementType: "geometry", stylers: [{color: "#ffffff", visibility: "simplified"}]},
    {featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{color: "#757575", visibility: "simplified"}]},
    {featureType: "road.highway", elementType: "geometry", stylers: [{color: "#fff", visibility: "simplified"}]},
    {featureType: "road.highway", elementType: "labels.text.fill", stylers: [{color: "#616161"}]},
    {featureType: "road.local", elementType: "labels.text.fill", stylers: [{color: "#9e9e9e"}]},
    {featureType: "transit.line", elementType: "geometry", stylers: [{color: "#e5e5e5"}]},
    {featureType: "transit.station", elementType: "geometry", stylers: [{color: "#eeeeee"}]},
    {featureType: "water", elementType: "geometry", stylers: [{color: "#c9c9c9"}]},
    {featureType: "water", elementType: "geometry.fill", stylers: [{color: "#009fe3"}]},
    {featureType: "water", elementType: "labels.text.fill", stylers: [{color: "#9e9e9e"}]},
  ];
  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 6,
    center: {lat: 48.77 + (52.5 - 48.77) / 2, lng: 9.17 + (13.12 - 9.17) / 2},
    styles,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  });

  var image = {
    url: "/assets/images/icon_d-labs.svg",
    scaledSize: new google.maps.Size(25, 25),
  };

  // Potsdam
  new google.maps.Marker({
    position: {lat: 52.3902283, lng: 13.1171623},
    map: map,
    icon: image,
  });

  // Stuttgart
  new google.maps.Marker({
    position: {lat: 48.7765607, lng: 9.1767708},
    map: map,
    icon: image,
  });

  // Berlin
  new google.maps.Marker({
    position: {lat: 52.5051579, lng: 13.4642886},
    map: map,
    icon: image,
  });
}

function approachAnimation() {
  var circle = $("#approach-circle");
  if (!circle.length) return;
  var hasFired = false;
  function fire() {
    if (hasFired) return;
    $(document).off("mousemove", fire);
    $(window).off("scroll", fire);
    hasFired = true;
    circle.addClass("is-big");
  }
  setTimeout(fire, 1500);
  $(document).on("mousemove", fire);
  $(window).on("scroll", fire);
}

function setupCarousel() {
  $(".carousel").slick({
    dots: true,
    arrows: true,
    prevArrow:
      '<div class="absolute inset-y right-100 col justify-center"><button type="button" class="button-text"><img src="/assets/images/icons/icon-swipe-left.svg" alt="Previous" class="height-4" style="max-width: initial"/></button></div>',
    nextArrow:
      '<div class="absolute inset-y left-100 col justify-center"><button type="button" class="button-text"><img src="/assets/images/icons/icon-swipe-right.svg" alt="Next" class="height-4" style="max-width: initial"/></button></div>',
  });
}

function setupMethodFilter() {
  var activeFilters = [];
  var buttons = {};
  var tiles = [];
  var query = null;

  var filterLabel = $("[data-default-label]");

  var matchesQuery = () => false;

  var mediaQuery = $("[data-filter-toggle-query]").data("filter-toggle-query");
  if (mediaQuery && window.matchMedia) {
    var mql = window.matchMedia(mediaQuery);
    matchesQuery = () => mql.matches;
  }

  $("[data-services-filter]").each(function() {
    var button = $(this);
    var filter = button.data("services-filter");
    buttons[filter] = button;
    button.on("click", () => {
      if (filter === "all") {
        activeFilters = [];
      } else if (activeFilters.indexOf(filter) >= 0) {
        activeFilters = activeFilters.filter(f => f !== filter);
      } else {
        activeFilters = [filter];
      }
      sync();
    });
  });

  $("[data-search]").each(function() {
    var container = $(this);
    var inputArea = container.find("[data-search-input]");
    var input = inputArea.find("input");
    var inputAreaButton = inputArea.find("button");
    var button = container.find("[data-search-button]");
    var nonSearchInput = container.find("[data-search-button],[data-toggle]");
    button.on("click", function() {
      nonSearchInput.hide();
      inputArea.show();
      input.focus();
    });
    inputAreaButton.on("click", function() {
      inputArea.hide();
      nonSearchInput.show();
      query = null;
      sync();
    });
    input.on("input", function(e) {
      query = e.target.value.toLowerCase();
      sync();
    });
  });

  $("[data-search-tile]").each(function() {
    var el = $(this);
    var domainKeys = el
      .data("method-tile")
      .split(",")
      .filter(Boolean);
    var domains = {};
    domainKeys.forEach(key => (domains[key] = true));

    var texts = [];
    el.find("[data-search-text]").each(function() {
      texts.push($(this).text());
    });
    tiles.push({el: el, domains: domains, text: texts.join(" ").toLowerCase()});
  });

  function sync() {
    $("[data-services-filter]").removeClass("is-active");
    if (activeFilters.length === 0) {
      filterLabel.text(filterLabel.data("default-label"));
      buttons.all.addClass("is-active");
      tiles.forEach(tile => {
        if (!query || tile.text.indexOf(query) >= 0) {
          tile.el.removeClass("hidden");
        } else {
          tile.el.addClass("hidden");
        }
      });
    } else {
      tiles.forEach(tile => tile.el.addClass("hidden"));
      activeFilters.forEach(f => {
        var button = buttons[f];
        button.addClass("is-active");
        filterLabel
          .html(button.html())
          .children()
          .addClass("sp-2")
          .find(".service-circle")
          .addClass("is-active");
        tiles.forEach(tile => {
          if (tile.domains[f] && (!query || tile.text.indexOf(query) >= 0))
            tile.el.removeClass("hidden");
        });
      });
    }
    if (matchesQuery()) {
      $("#services-filter").slideUp();
    }
  }
}

function setupImageFader() {
  $("[data-image-fader]").each(function() {
    var children = $(this).children();
    var currentIndex = children.length - 1;
    setInterval(() => {
      var lastChild = children.eq(currentIndex);
      var nextIndex = (currentIndex + 1) % children.length;
      var nextChild = children.eq(nextIndex);
      nextChild.css("z-index", 1);
      nextChild.hide();
      nextChild.fadeIn(2000, () => {
        lastChild.hide();
        nextChild.css("z-index", 0);
      });
      currentIndex = nextIndex;
    }, 5000);
  });
}

function doTheGoogleStuff() {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "UA-46146953-1", { "anonymize_ip": true });
  var script = document.createElement('script');
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=UA-46146953-1";
  document.getElementsByTagName("head")[0].appendChild(script, document.getElementsByTagName("head")[0]); 
}

function cookieConsent() {
  if ($.cookie("accept_cookies") !== "true") {
    var container = $("#cookie-consent");
    container.removeClass("hidden");
    container.find("button").on("click", function() {
      $.cookie("accept_cookies", "true", {expires: 365});
      container.addClass("hidden");
    });
  } else {
    doTheGoogleStuff();
  }
}

function setupServicesAnimation() {
  var container = $("#services-top-area");
  if (!container.length) return;
  var blue = container.find(".service-circle.is-blue");
  var bluePos = blue.offset();
  container.find(".service-circle:not(.is-blue)").each(function() {
    var circle = $(this);
    var circlePos = circle.offset();
    circle.addClass("is-active");
    circle.css({
      position: "relative",
      left: bluePos.left - circlePos.left + 10,
      top: bluePos.top - circlePos.top + 10,
    });
    setTimeout(() => {
      circle.css({left: 0, top: 0, opacity: 1});
      blue.css({opacity: 0});
    }, 250);
  });
  setTimeout(() => {
    container.find(".service-label").css({opacity: 1});
    setTimeout(() => {
      container.find(".lead-line").css({opacity: 1});
    }, 500);
  }, 750);
  function handleScroll() {
    container.find(".service-circle:not(.is-blue)").removeClass("is-active");
    $(window).off("scroll", handleScroll);
  }
  $(window).on("scroll", handleScroll);
}

function setupFadeInit() {
  $("[data-init-fade]").each(function() {
    var el = $(this);
    setTimeout(() => el.removeClass("opacity-0").addClass("opacity-1"), 250);
  });
}

function smoothAnchorScroll() {
  $(document).on("click", "a[href*='#']", function(e) {
    var $target = $($(this).attr("href"));
    if ($target.length) {
      $("html, body").animate({scrollTop: $target.offset().top - 50}, 500);
      e.preventDefault();
    }
  });
}

function disableGoogleFontsInGoogleMapsAPI(){
  var head = document.getElementsByTagName('head')[0];
  var insertBefore = head.insertBefore;
  head.insertBefore = function (newElement, referenceElement) {
    if (newElement.href && newElement.href.indexOf('https://fonts.googleapis.com/css?family=') > -1) {
      return;
    }
    insertBefore.call(head, newElement, referenceElement);
  }
}

$(function() {
  disableGoogleFontsInGoogleMapsAPI();
  setupScrollSpy();
  toggleButton();
  headerScroll();
  approachAnimation();
  setupCarousel();
  setupMethodFilter();
  setupImageFader();
  cookieConsent();
  setupServicesAnimation();
  setupFadeInit();
  smoothAnchorScroll();
  var ua = window.navigator.userAgent;
  if (ua.indexOf("MSIE ") > 0 || !!ua.match(/Trident.*rv\:11\./)) {
    $("body").addClass("is-ie");
  } else if (/^((?!chrome|android).)*safari/i.test(ua)) {
    $("body").addClass("is-safari");
  }
});
