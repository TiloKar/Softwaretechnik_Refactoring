/**
 * Konstruktorenaufruf für jQuery UI Steuerelemente
 * Siehe JQery UI API
 */
 HMI.makeControlElementBindings = function(){
  $("#ButtonReportBlockInputs").button().click(HMI.refreshReportBlockInput);
  $("#ButtonReportBlockUserEvents").button().click(HMI.refreshReportUserEvents);
  $("#ButtonChooseNewTrendfile").button().click(function(){		$("#fileSelection").toggle( "slow", null);
  });
  //$("#ButtonPrint").button().click( function(){window.print();}); Öffnet nur druckerdialog, nicht vorschau
  $("#ButtonToggleEditorView").button().click(function(){$("#editor").toggle( "slow", null);});
  $("#ButtonToggleEditorView").hide();
  $("#ButtonRefreshTrendfileList").button().click(HMI.atPrepareFileList);
  $("#ButtonLoadDump").button().click(function(){window.open('dumb.html', 'dumbWindowName');});
  $("#ButtonLoadDump").hide();
  $("#ButtonDrawReport").button().click(function(){HMI.makeReportList();});
  $("#ButtonDrawReport").hide();
  $("#loadingScreen").dialog({autoOpen: false, modal:true, height: 400, width:600});
  $( "#DialogError404, #DialogErrorHeaderTrendfile" ).dialog({dialogClass: "alert", autoOpen: false});
  $( "#progressbarloadingTrendfile" ).progressbar({max: 100, value:0});
  $( document ).tooltip();
//	    $( "#spinnerFilterCIperValue" ).spinner({
//	        step: 0.1,
//	        numberFormat: "n"
//	      });
//	    $( "#selectFilterCIperValue" ).selectmenu();
//	    $( ".filterBlock" ).draggable({ revert: true });
//	    $( "#reportList" ).droppable({
//	        drop: HMI.makeReportList,
//	        classes: { "ui-droppable-hover": "ui-state-hover"}
//	      });

}
