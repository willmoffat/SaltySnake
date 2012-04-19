var SS = {markers:[]};

SS.getAssignment = function() { return App.current_nugget_controller.get("currentAssignment"); };
SS.getEditor     = function() { return SS.getAssignment().get("codeEditor"); };

SS.focusEditor = function() { SS.getEditor().focus(); };

SS.run = function() {
  var cm = SS.getEditor();
  while (SS.markers.length) { var m = SS.markers.pop(); cm.clearMarker(m); }
  var val = cm.getValue();
  document.getElementById("ssDataNode").textContent = val;
};

SS.markLine = function(lineNum) {
  var cm = SS.getEditor();
  cm.setCursor(lineNum, 10000);
  SS.markers.push(cm.setMarker(lineNum, "", "ssErrorLine"));
};

