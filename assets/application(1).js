(function() {
  var ALONGSLIDE_QUERIES, DEBOUNCE_RESIZE_MS, MARGIN_TOP_PX, MIN_WIDTH_PX, READABILITY_QUERIES, doLayout, flattenContentToSource, matchAlongslide, matchReadability;

  READABILITY_QUERIES = ["screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : portrait)", "screen and (max-width: 568px)"];

  ALONGSLIDE_QUERIES = ["screen and (min-width:569px)"];

  MIN_WIDTH_PX = 980;

  MARGIN_TOP_PX = 35;

  DEBOUNCE_RESIZE_MS = 250;

  /* 
  Called when all web fonts are loaded.
    
  See webfonts.coffee.
  
  Next in line of asynchronous chain of load events: load styles.
  Then check screen resolution, and kick off initial ALS render.
  */


  $(document).on('webfonts.loaded', function(e) {
    return Styles.prototype.doLoad(function() {
      console.log("Loaded styles.");
      flattenContentToSource();
      $('style.custom').remove().appendTo('body');
      _.each(READABILITY_QUERIES, function(query) {
        return enquire.register(query, {
          match: matchReadability,
          unmatch: function() {
            return location.reload();
          }
        });
      });
      return _.each(ALONGSLIDE_QUERIES, function(query) {
        return enquire.register("screen and (min-width:569px)", {
          match: matchAlongslide,
          unmatch: function() {
            return location.reload();
          }
        });
      });
    });
  });

  matchReadability = function() {
    var raw;
    $('body').addClass('readability');
    raw = $('#source').html();
    return $('#content-display').html(raw);
  };

  matchAlongslide = function() {
    window.alongslide = new Alongslide({
      source: '#content .raw',
      to: '#frames',
      regionCls: 'column'
    });
    return doLayout();
  };

  /* 
  Flattens and copies '#content .raw' to '#source'.
  All block elements are removed for both print and readability modes.
  */


  flattenContentToSource = function() {
    var source;
    source = $('#source').find('h1,h2,h3,h4,h5,h6,blockquote,p,a,img');
    source = _.map(source, function(el) {
      return el.outerHTML;
    });
    source = _.reduce(source, function(memo, el) {
      return memo.concat(el);
    });
    return $('#source').html(source);
  };

  /*
  Do render, on page load and again on resize.
  
  @param lite - if true, don't do full re-render, just the computationally
    cheap 'refresh'
  */


  doLayout = function(lite) {
    var frameAspect;
    Loader.prototype.show(lite);
    frameAspect = FixedAspect.prototype.fitFrame(MIN_WIDTH_PX, MARGIN_TOP_PX);
    if (!lite) {
      return window.alongslide.render(frameAspect, function() {
        FixedAspect.prototype.fitPanels(frameAspect);
        return Loader.prototype.hide();
      });
    } else {
      window.alongslide.refresh(frameAspect);
      return FixedAspect.prototype.fitPanels(frameAspect);
    }
  };

  /*
  Resize handler.
   
  Do a 'lite' refresh--and set a timer to debounce user resize events
  so we only re-render once, after an interval.
  */


  $(window).resize(function() {
    doLayout(true);
    clearTimeout(window.renderTimeout);
    return window.renderTimeout = setTimeout((function() {
      return doLayout();
    }), DEBOUNCE_RESIZE_MS);
  });

  window.grid_mode = "project";

  $(document).on('alongslide.progress', function(e, progress) {
    return Loader.prototype.updateSecondaryProgress(progress);
  });

  $(function() {
    $('#frames').click(function() {
      return $('#markdown-source').removeClass('on');
    });
    return $('#markdown-source a.close').click(function() {
      $('#markdown-source').removeClass('on');
      return false;
    });
  });

  $(document).on('alongslide.ready', function(e, frames) {
    return $(frames).find('.panel[data-alongslide-id=footer] a').click(function() {
      $('#markdown-source').addClass('on');
      return false;
    });
  });

}).call(this);
