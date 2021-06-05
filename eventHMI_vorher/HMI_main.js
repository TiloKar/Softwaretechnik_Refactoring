"use strict";
function round(wert, dez) {
    var hlp = Math.pow(10,dez)
    return Math.floor(wert * hlp) / hlp;
}

//Objekt für übergeordnete HMI Funktionen
var HMI = {
  ASYREPORTSIZE : 50, //Menge an Events pro asynchronem aufruf beim aufbau der Reportliste
  ASYREPORTTIME : 200, //ms für timeout des asynchronen report-aufbaus


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
		HMI.firstSelectedID = $(this).children("td:first-child").text();
		HMI.firstSelectedUnit = Number(this.className.slice(-1));
		//Call
		HMI.trendfile.getFile('plcfile/TREND'+HMI.firstSelectedUnit+'/' + HMI.firstSelectedID + '.TREND');
	},
  /**
   * bargraph, während Dateidownload
   *
   */
  onprogressLoadingFile(xhr){
    $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", (xhr.loaded / xhr.total) * 100 );
    //alert(xhr.loaded);
  },
	trendfile : {
		/**
		 * Ajax request für Trendfile
		 */
		getFile(path){//binärer Ajax-GET mit Pfadstring
      const xhr = new XMLHttpRequest(); //	HMI.binRequest = new XMLHttpRequest();
      xhr.responseType="arraybuffer"; //	HMI.binRequest.responseType="arraybuffer";
			xhr.open("GET", path, true);//HMI.binRequest.open("GET", path, true);
			xhr.onload = function(){HMI.trendfile.unzipFile(xhr)}; //HMI.binRequest.onload = function(){HMI.trendfile.unzipTrendFile(HMI.binRequest)};
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
		unzipFile(xhr){
			if (xhr.status == 404){
				//to do auf 404 reagieren, solange ungültige dateinamen in B&R zulässig, sehr wahrscheinlich
				$( "#DialogError404" ).dialog("open");
			}else{
				HMI.trendfile.blob = xhr.response; //blob für weitere Verwendung im objekt speichern
				HMI.trendfile.rawdata = new Trendfile(HMI.trendfile.blob); //trendobject header und erste zeile synchron erzeugen

				if (HMI.trendfile.rawdata.firstLineOK){


					$("#editor").hide();
					$("#reportList").html("<br><br><br>");

					HMI.trendfile.rawdata.readDataBlock(//diese funktion ruft sich selbst rekursiv asynchron auf, bis entpackt ist
							//Hier HMI Eventhandler für Statusaktualisierung im Ladefenster
						event => {	$("#loadingScreen h1").html("Trend Lines read: " + HMI.trendfile.rawdata.dataLinesRead);
									$( "#progressbarloadingTrendfile" ).progressbar( "option", "value", HMI.trendfile.rawdata.percentRead );},
							//hier HMI Eventhandler für beenden des Ladens
						//event => {HMI.prepareReportBlock();}); erst noch eventfile zwischenschalten
            event => {HMI.eventfile.getFile('plcfile/EVENTS'+HMI.firstSelectedUnit+'/' + HMI.firstSelectedID + '.EVENT');});
				}else{
					$( "#DialogErrorHeaderTrendfile" ).dialog("open");
				}
			}
		}
	},
  eventfile : {
    /**
     * Ajax request für Trendfile
     */
    getFile(path){//binärer Ajax-GET mit Pfadstring
      const xhr = new XMLHttpRequest(); //	HMI.binRequest = new XMLHttpRequest();
      xhr.responseType="arraybuffer"; //	HMI.binRequest.responseType="arraybuffer";
      xhr.open("GET", path, true);//HMI.binRequest.open("GET", path, true);
      xhr.onload = function(){HMI.eventfile.unzipFile(xhr)}; //HMI.binRequest.onload = function(){HMI.trendfile.unzipTrendFile(HMI.binRequest)};
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
    unzipFile(xhr){
      if (xhr.status == 404){
        //to do auf 404 reagieren, solange ungültige dateinamen in B&R zulässig, sehr wahrscheinlich
        $( "#DialogError404" ).dialog("open");
      }else{
        HMI.eventfile.blob = xhr.response; //blob für weitere Verwendung im objekt speichern
        HMI.eventfile.rawdata = new Eventfile(HMI.eventfile.blob); //trendobject header und erste zeile synchron erzeugen
        HMI.eventfile.rawdata.readDataBlock(//diese funktion ruft sich selbst rekursiv asynchron auf, bis entpackt ist
            //Hier HMI Eventhandler für Statusaktualisierung im Ladefenster
          event => {	$("#loadingScreen h1").html("Event Lines read: " + HMI.eventfile.rawdata.eventsRead);
                $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", HMI.eventfile.rawdata.percentRead );},
            //hier HMI Eventhandler für beenden des Ladens
          event => {  HMI.prepareReportFilter();
                      HMI.fillRawHeader();
                      $("#ButtonToggleEditorView").show();
                      $("#ButtonLoadDump").show();
                    });
      }
    }
  }


}
