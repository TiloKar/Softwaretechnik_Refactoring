
/**Zentrale Ablaufsteuerung für At-Auswahl, Datei-parsen und Anstoßen des Seitenaufbaus im Event-teil
 *     !!!!!!!!!!!!     ACHTUNG keine class Notation sondern JS Object-Notation, da nur ein statisches HMI Objekt nötig
 *
 *@author TK, 04/2021, version 1.0.1
 *
*/
"use strict";
function round(wert, dez) {
    var hlp = Math.pow(10,dez)
    return Math.floor(wert * hlp) / hlp;
}
var Trendfile1 = {};
var Eventfile1 = {};
var Dumpfile1 = {};

var AT_ID_1;     //die Explizite Abbildung auf Object Nummer 1 ist gedanklich vorbereitend für zukünftige vergleichsplots
var UnitID_1;

var HMI = {

  /** Der B&R webserver aktualisiert beim erzeugen neuer trenddateien die Dateiliste uf dem Server
   * Diese methode hängt ein onClick Event an jede zeile
   *
   * to do: Styling und Tooltip mit Hinweis auf Unit (auch als Klassenname bereits vom Server angelegt
   */
  atPrepareFileList(){
    //holt liste aus sps tohdatei und fügt click eventhandler für jede zeile an
    $("#fileListfromServer").load("plcfile/atfilenames.html", function(){
      $( ".trendfiles" ).click(HMI.onClickInTrendList);
      //ändert nativen B&R datumsinteger in JS Datumsobjektstring
      $(".trendfiles td:nth-child(2)").each(function() {
        var num = parseInt($(this).html());
        $(this).html(new Date(num * 1000).toUTCString());
      });
    });
  },

  /**
	 * Eventhandler zum dynamischen generieren des Zielpfades für Ajax request auf Trendfile
	 */
	onClickInTrendList(){
		//Pfad aus Dateinamen und unit-index aus Klassenbezeichner extrahieren
		AT_ID_1 = $(this).children("td:first-child").text();     //die Explizite Abbildung auf Object Nummer 1 ist vorbereitend für zukünftige vergleichsplots
		UnitID_1 = Number(this.className.slice(-1));

		//Call
		HMI.getTrendFile1('plcfile/TREND'+UnitID_1+'/' + AT_ID_1 + '.TREND');
	},
  /**
   * bargraph, während Dateidownload
   *
   */
  onprogressLoadingFile(xhr){
    $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", (xhr.loaded / xhr.total) * 100 );
    //alert(xhr.loaded);
  },


	/**
	 * Ajax request für Trendfile
	 */
	getTrendFile1(path){//binärer Ajax-GET mit Pfadstring
    const xhr = new XMLHttpRequest(); //	HMI.binRequest = new XMLHttpRequest();
    xhr.responseType="arraybuffer"; //	HMI.binRequest.responseType="arraybuffer";
		xhr.open("GET", path, true);//HMI.binRequest.open("GET", path, true);
    //alert('');
		xhr.onload = function(){HMI.unzipTrendFile1(xhr)}; //HMI.binRequest.onload = function(){HMI.trendfile.unzipTrendFile(HMI.binRequest)};
    xhr.addEventListener('progress', HMI.onprogressLoadingFile);//HMI.binRequest.onprogress = function(){HMI.trendfile.onprogressHandlerTrendFile(HMI.binRequest)};
    $("#loadingScreen").dialog("open");//hier HMI Eventhandler für Ladefenster öffnen
    $("#loadingScreen h1").html("Getting Trend-File from PLC...");
    $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", 0 );
		xhr.send();                        //HMI.binRequest.send();
    return xhr;
	},

	/**
	 * bei onload 404 abfangen
	 * sonst entpacken starten
	 * Trendfile.readDataBlock() ist asynchron, daher müssen eventhandler für jeden Zwischen-Aufruf
	 * und beenden des Lesens übergeben werden
	 *
	 */
	unzipTrendFile1(xhr){
		if (xhr.status == 404){
			//to do auf 404 reagieren, solange ungültige dateinamen in B&R zulässig, sehr wahrscheinlich
			$( "#DialogError404" ).dialog("open");
		}else{
			//this.trendfile.blob = xhr.response; //blob für weitere Verwendung im objekt speichern
			Trendfile1 = new Trendfile(xhr.response); //trendobject header und erste zeile synchron erzeugen

			if (Trendfile1.firstLineOK){


				$("#editor").hide();
				$("#reportList").html("<br><br><br>");

				Trendfile1.readDataBlock(//diese funktion ruft sich selbst rekursiv asynchron auf, bis entpackt ist
						//Hier HMI Eventhandler für Statusaktualisierung im Ladefenster
					event => {	$("#loadingScreen h1").html("Trend Lines read: " + Trendfile1.dataLinesRead);
								$( "#progressbarloadingTrendfile" ).progressbar( "option", "value", Trendfile1.percentRead );},
						//hier HMI Eventhandler für beenden des Ladens
          //event => {HMI.getEventFile1('plcfile/EVENTS' + UnitID_1 + '/' + AT_ID_1 + '.EVENT');});
          event => {HMI.getDumpFile1('plcfile/DUMP' + UnitID_1 + '/' + AT_ID_1 + '.bbid');});
			}else{
				$( "#DialogErrorHeaderTrendfile" ).dialog("open");
			}
		}
	},

  getDumpFile1(path){
    const xhr = new XMLHttpRequest();
    xhr.responseType="arraybuffer";
    xhr.open("GET", path, true);

    xhr.onload = function(){HMI.unzipDumpFile1(xhr)}; //HMI.binRequest.onload = function(){HMI.trendfile.unzipTrendFile(HMI.binRequest)};
    xhr.addEventListener('progress', HMI.onprogressLoadingFile);//HMI.binRequest.onprogress = function(){HMI.trendfile.onprogressHandlerTrendFile(HMI.binRequest)};
    $("#loadingScreen").dialog("open");//hier HMI Eventhandler für Ladefenster öffnen
    $("#loadingScreen h1").html("Getting Dump-File from PLC...");
    $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", 0 );
    xhr.send();                        //HMI.binRequest.send();
    return xhr;
  },

  unzipDumpFile1(xhr){
    if (xhr.status == 404){
      //to do auf 404 reagieren, solange ungültige dateinamen in B&R zulässig, sehr wahrscheinlich
      $( "#DialogError404" ).dialog("open");
    }else{
      var dobj = new BinaryBRTypedFile(xhr.response,"dumpfile_typ");
      Dumpfile1=dobj.elements;
      HMI.getEventFile1('plcfile/EVENTS' + UnitID_1 + '/' + AT_ID_1 + '.EVENT');
    }
  },

  /**
   * Ajax request für Trendfile
   */
  getEventFile1(path){//binärer Ajax-GET mit Pfadstring
    const xhr = new XMLHttpRequest(); //	HMI.binRequest = new XMLHttpRequest();
    xhr.responseType="arraybuffer"; //	HMI.binRequest.responseType="arraybuffer";
    xhr.open("GET", path, true);//HMI.binRequest.open("GET", path, true);
    xhr.onload = function(){HMI.unzipEventFile(xhr)}; //HMI.binRequest.onload = function(){HMI.trendfile.unzipTrendFile(HMI.binRequest)};
    xhr.addEventListener('progress', HMI.onprogressLoadingFile);//HMI.binRequest.onprogress = function(){HMI.trendfile.onprogressHandlerTrendFile(HMI.binRequest)};
    $("#loadingScreen").dialog("open");//hier HMI Eventhandler für Ladefenster öffnen
    $("#loadingScreen h1").html("Getting Event-File from PLC...");
    $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", 0 );
    xhr.send();                        //HMI.binRequest.send();
    return xhr;
  },

  /**
   * bei onload 404 abfangen
   * sonst entpacken starten
   * Trendfile.readDataBlock() ist asynchron, daher müssen eventhandler für jeden Zwischen-Aufruf
   * und beenden des Lesens übergeben werden
   *
   */
  unzipEventFile(xhr){
    if (xhr.status == 404){
      //to do auf 404 reagieren, solange ungültige dateinamen in B&R zulässig, sehr wahrscheinlich
      $( "#DialogError404" ).dialog("open");
    }else{
    //  this.eventfile.blob = xhr.response; //blob für weitere Verwendung im objekt speichern
      Eventfile1 = new Eventfile(xhr.response); //trendobject header und erste zeile synchron erzeugen
      Eventfile1.readDataBlock(//diese funktion ruft sich selbst rekursiv asynchron auf, bis entpackt ist
          //Hier HMI Eventhandler für Statusaktualisierung im Ladefenster
        event => {	$("#loadingScreen h1").html("Event Lines read: " + Eventfile1.eventsRead);
                    $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", Eventfile1.percentRead );
                },
          //hier HMI Eventhandler für beenden des Ladens
        event => {  HMI.onFinishUnzip();});
    }
  },

  onFinishUnzip(){
    $("#loadingScreen").dialog("close");//hier HMI Eventhandler für Ladefenster öffnen
    $('#headerFilename').html(Trendfile1.tag);
    $("#fileSelection").hide();

    ListPlotter.init(Trendfile1,Eventfile1,Dumpfile1);
    //FIL.makeReportFilterInputs("#reportBlockInputs");
    $("#ButtonDrawReport").show();
    $("#ButtonChooseNewTrendfile").show();

    $('#editor').accordion({
      heightStyle: "content", active: false, collapsible: true
    });
    //HMI.makeReportList("preview");

    EventDOMOutputs.makeHeaderTable(Trendfile1,Eventfile1);
    $("#ButtonToggleEditorView").show();
    $("#ButtonLoadDump").show();
    $("#editor").show("slow");
  },

  onFinalReportButton(){
    $('#reportList').empty();
    $("#loadingScreen").dialog("open");//hier HMI Eventhandler für Ladefenster öffnen
    $("#loadingScreen h1").html("Building up Report: ");
    $("#editor").hide();
    ListPlotter.makeReportList(
      event => {
                  $("#loadingScreen h1").html("Building up Report: " + ListPlotter.asyReportRead + " of " + ListPlotter.preParsedDomOutputs.length + " printed...");
                  $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", ListPlotter.asyReportRead * 100 / ListPlotter.preParsedDomOutputs.length );
              },
      //hier HMI Eventhandler für Beenden des Ladens
      event => {  $("#loadingScreen").dialog("close");});
  }
}
