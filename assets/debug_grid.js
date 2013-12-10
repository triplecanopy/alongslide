(function() {
  var PROJECT_GRID_MODES, toggleProjectGrid, writeProjectGrid;

  PROJECT_GRID_MODES = ['hidden', 'halves', 'thirds'];

  $(document).on('ready', function() {
    return keypress.combo("alt g", function() {
      switch (window.grid_mode) {
        case "project":
          return toggleProjectGrid();
        default:
          return $('body').toggleClass('debug');
      }
    });
  });

  toggleProjectGrid = function() {
    var currentMode, grid, index;
    grid = $('#als-debug-grid');
    if (grid.length === 0) {
      grid = writeProjectGrid();
    }
    currentMode = grid.get(0).className;
    index = PROJECT_GRID_MODES.indexOf(currentMode);
    index = (index + 1) % PROJECT_GRID_MODES.length;
    return grid.removeClass().addClass(PROJECT_GRID_MODES[index]);
  };

  writeProjectGrid = function() {
    var GRID_DIMENSIONS, dimension, grid, more, num_units, units;
    GRID_DIMENSIONS = {
      vertical: 56,
      horizontal: 18
    };
    grid = $("<div id='als-debug-grid' class='" + PROJECT_GRID_MODES[0] + "'>");
    for (dimension in GRID_DIMENSIONS) {
      num_units = GRID_DIMENSIONS[dimension];
      units = $("<div class='" + dimension + " units'/>").appendTo(grid);
      _(num_units).times(function() {
        return units.append("<div class='unit'/>");
      });
      grid.append("<div class='" + dimension + " margins'/>");
    }
    more = $('<div class="more"/>').appendTo(grid);
    _(2).times(function() {
      return more.append('<div class="vertical inner margins"/>');
    });
    return grid.appendTo('body');
  };

}).call(this);
