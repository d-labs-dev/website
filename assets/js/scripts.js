//= require vendor/jquery-3.4.1.min.js
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
  var resizeListener = null

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
      var m = keyframe.trim().match(/([\d.]+):(.*)/);
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
      var m = keyframe.trim().match(/([\d.]+)-([\d.]+):(.*)/);
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
    var resizeListeners = [];
    var scrollListeners = [];
    var spyDimensions = {};

    function handleScroll() {
      var progress =
        (window.scrollY - spyDimensions.top) /
        Math.max(200, spyDimensions.height - window.innerHeight / 2);
      scrollListeners.forEach(fn => fn(progress));
    }

    function handleResize() {
      var top = scrollArea.offset().top;
      spyDimensions = {
        top: top,
        height: scrollArea.outerHeight(),
      };
      resizeListeners.forEach(checkerFn => checkerFn());
      handleScroll();
    }

    scrollArea.find("[data-keyframes]").each(function() {
      var el = $(this);
      var retVal = createKeyframeListener(el);
      scrollListeners.push(retVal.handleProgress);
      if (retVal.handleResize) resizeListeners.push(retVal.handleResize)
    });

    scrollArea.find("[data-style-keyframes]").each(function() {
      var el = $(this);
      var retVal = createKeyframeListener(el, {asStyle: true});
      scrollListeners.push(retVal.handleProgress);
      if (retVal.handleResize) resizeListeners.push(retVal.handleResize)
    });

    scrollArea.find("[data-class-on-range]").each(function() {
      var el = $(this);
      scrollListeners.push(createClassOnRangeListener(el));
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

function setupActiveSnapping() {
  var spyDimensions = [];
  var isActive = false;

  function measure() {
    spyDimensions = [];
    $("[data-active-snapping]").each(function() {
      var el = $(this);
      var top = el.offset().top;
      var bottom = top + el.outerHeight();
      var spyInfo = {
        top: top,
        bottom: bottom,
      };
      spyDimensions.push(spyInfo);
    });
  }

  function findIfActive() {
    var scrollEnterPos = window.scrollY + window.innerHeight * 0.75;
    var scrollLeavePos = window.scrollY + window.innerHeight * 0.66;
    var someActive = spyDimensions.some(
      spy => scrollLeavePos >= spy.top && scrollEnterPos <= spy.bottom
    );
    if (someActive) {
      if (!isActive) {
        $("body").css({scrollSnapType: "y mandatory"});
        isActive = true;
      }
    } else {
      if (isActive) {
        $("body").css({scrollSnapType: "none"});
        isActive = false;
      }
    }
  }

  $(window).on("resize", measure);
  $(window).on("scroll", findIfActive);
  measure();
  findIfActive();
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
    {featureType: "poi", elementType: "geometry", stylers: [{color: "#eeeeee"}]},
    {featureType: "poi", elementType: "labels.text.fill", stylers: [{color: "#757575"}]},
    {featureType: "poi.park", elementType: "geometry", stylers: [{color: "#e5e5e5"}]},
    {featureType: "poi.park", elementType: "labels.text.fill", stylers: [{color: "#9e9e9e"}]},
    {featureType: "road", elementType: "geometry", stylers: [{color: "#ffffff"}]},
    {featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{color: "#757575"}]},
    {featureType: "road.highway", elementType: "geometry", stylers: [{color: "#fff"}]},
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
    position: {lat: 52.3902283, lng: 13.1149736},
    map: map,
    icon: image,
  });

  // Stuttgart
  new google.maps.Marker({
    position: {lat: 48.7765607, lng: 9.1745821},
    map: map,
    icon: image,
  });

  // Berlin
  new google.maps.Marker({
    position: {lat: 52.5051579, lng: 13.4620999},
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
    $("body").addClass("with-blue-header");
    $("[data-after-approach-animate]").each(function() {
      var el = $(this);
      el.data("after-approach-animate")
        .split(/\s+/g)
        .forEach(part => {
          var match = part.match(/([+\-])([\w-]+)/);
          if (match) {
            if (match[1] === "-") {
              el.removeClass(match[2]);
            } else {
              el.addClass(match[2]);
            }
          }
        });
    });
  }
  setTimeout(fire, 5000);
  $(document).on("mousemove", fire);
  $(window).on("scroll", fire);
}

function setupCarousel() {
  $(".carousel")
    .slick({
      dots: true,
      arrows: true,
      prevArrow:
        '<div class="absolute inset-y right-100 col justify-center px-1"><button type="button" class="button-text"><img src="/assets/images/icons/icon-swipe-left.svg" alt="Previous" class="height-4" style="max-width: initial"/></button></div>',
      nextArrow:
        '<div class="absolute inset-y left-100 col justify-center px-1"><button type="button" class="button-text"><img src="/assets/images/icons/icon-swipe-right.svg" alt="Next" class="height-4" style="max-width: initial"/></button></div>',
    })
}

function setupMethodFilter() {
  var activeFilters = [];
  var buttons = {};
  var tiles = [];
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

  $("[data-method-tile]").each(function() {
    var tile = $(this);
    var domainKeys = tile
      .data("method-tile")
      .split(",")
      .filter(Boolean);
    var domains = {};
    domainKeys.forEach(key => (domains[key] = true));
    tiles.push({el: tile, domains: domains});
  });

  function sync() {
    $("[data-services-filter]").removeClass("is-active");
    if (activeFilters.length === 0) {
      buttons.all.addClass("is-active");
      tiles.forEach(tile => tile.el.removeClass("hidden"));
    } else {
      tiles.forEach(tile => tile.el.addClass("hidden"));
      activeFilters.forEach(f => {
        buttons[f].addClass("is-active");
        tiles.forEach(tile => {
          if (tile.domains[f]) tile.el.removeClass("hidden");
        });
      });
    }
  }
}

$(function() {
  setupScrollSpy();
  toggleButton();
  headerScroll();
  setupActiveSnapping();
  approachAnimation();
  setupCarousel();
  setupMethodFilter();
  var ua = window.navigator.userAgent;
  if (ua.indexOf("MSIE ") > 0 || !!ua.match(/Trident.*rv\:11\./)) $("body").addClass("is-ie");
});
