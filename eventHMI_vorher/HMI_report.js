
/**
füllt das Accordium mit header-Rohdatensaten
erst mal eher entwicklernahe infos...
später per checkbox option für übernahme einzelner header-infos in den report
- Kommentar
- batchid
- startzeit...
*/
HMI.fillRawHeader= function(){
  $('#headerInfoTrendfile').html(
    "<table><tbody><tr>   <td>first sample time from header: </td><td>" + String(HMI.trendfile.rawdata.firstDat.toUTCString()) +
    "</td></tr><tr>       <td>last sample time from header:</td><td>"   + String(HMI.trendfile.rawdata.lastDat.toUTCString()) +
    "</td></tr><tr>       <td>last sample time read: </td><td>"         + String(HMI.trendfile.rawdata.line[HMI.trendfile.rawdata.dataLinesRead-1].time.toUTCString())+
    "</td></tr><tr>       <td>date lines header: </td><td>"             + String(HMI.trendfile.rawdata.lineCount) +
    "</td></tr><tr>       <td>date lines read: </td><td>"               + String(HMI.trendfile.rawdata.dataLinesRead) +
    "</td></tr><tr>       <td>bytes skipped: </td><td>"                 + String(HMI.trendfile.rawdata.bytesSkipped) + " / " + String(HMI.eventfile.rawdata.bytesSkipped) +
    "</td></tr><tr>       <td>events read: </td><td>"                   + String(HMI.eventfile.rawdata.records) +
    "</td></tr><tr>       <td>max. events in buffer: </td><td>"         + String(HMI.eventfile.rawdata.maxBufCount) +
    "</td></tr><tr>       <td>max. eventbuffer size: </td><td>"         + String(HMI.eventfile.rawdata.maxBufSize) +
    "</td></tr><tr>       <td>sampling rate: </td><td>"                 + String(HMI.trendfile.rawdata.samplingRate) +
    "</td></tr><tr>       <td>ident: </td><td>"                         + String(HMI.trendfile.rawdata.ident) +
    "</td></tr><tr>       <td>Reglersollwerte: </td><td>"               + String(HMI.trendfile.rawdata.countCLMax) +
    "</td></tr><tr>       <td>Ausgangskan&auml;le: </td><td>"           + String(HMI.trendfile.rawdata.countOutpMax) +
    "</td></tr><tr>       <td>Kommentar: </td><td>"                     + HMI.trendfile.rawdata.comment +
    "</td></tr></tbody></table>");
};
/** dynamische erzeugung der Filter-Steuerelemente
 *
 * - Eingangskanäle mit tag listen
    - Auswahl, ob überhaupt im reportList
    - auswahl für totbandfilter (nur wenn änderungen>= dem betrag, dann neue zeile)


-liste anhand der filterregeln aus HMI.trendReportDefinition voreinstellen

 *
 */
HMI.prepareReportFilter=function(){
  $("#loadingScreen").dialog("close");//hier HMI Eventhandler für Ladefenster öffnen
  $('.headerFilename').html(HMI.trendfile.rawdata.tag);
  $("#fileSelection").hide("slow");
  $("#editor").show("slow");
  $( "#reportBlockInputs" ).empty();
  //Eingangskanäle nach Totband
  var tag,unit;
  var idCheck,idSpinner;
  var checkedDeadband;
  for (var i=0;i<HMI.trendfile.rawdata.countInpMax;i++){
    tag=HMI.trendfile.rawdata.tags.cI[i];
    unit=HMI.trendfile.rawdata.units.cI[i];
    idCheck="CheckboxReportBlockInputs_" + i;
    idSpinner="SpinnerReportBlockInputs_" + i;
    $( "#reportBlockInputs" ).append(
      //'<fieldset>' +
      '<div class="ControlGroupReportBlockInputItem">' +
      '<label for="' + idCheck +'">' + tag +
      '<input class="CheckboxRadiosReportBlockInputs" type="checkbox" name="' + idCheck + '" id="' + idCheck + '">' +
      '</label>' +
      '<input class="SpinnerReportBlockInputs" id="' + idSpinner + '" name="value">' +
      '<span class="SpinnerReportBlockInputsUnit">' + unit + '</span>' +
      '</div>'//</fieldset>'
    );
    if (HMI.trendReportDefinition.cIperValue.length==0){ //pseudoinit wenn keine Daten aus letzter session
      $( "#" + idSpinner ).spinner({
        step: 0.1,
        min: 0,
      }).val(Trendfile.getDeadbandFromUnitStr(unit)).width(30);
      $( "#" + idCheck ).checkboxradio();
    }else{ //session einstellungen wiederherstellen
      checkedDeadband=false;
      //alert(HMI.trendReportDefinition.cIperValue.length);
      for (var k=0; k<HMI.trendReportDefinition.cIperValue.length;k++)
        if (HMI.trendReportDefinition.cIperValue[k].index===i){
          checkedDeadband = parseFloat(HMI.trendReportDefinition.cIperValue[k].deadb);
          //alert((typeof checkedDeadband));
          break;
        }
      if ((typeof checkedDeadband)==='number'){ //falls als filterregel aufgenommen
        $( "#" + idSpinner ).spinner({
          step: 0.1,
          min: 0,
        }).val(checkedDeadband).width(30);
        //$( "#" + idCheck ).attr('checked',true);
        $( "#" + idCheck ).checkboxradio();
        $( "#" + idCheck).prop('checked',true).checkboxradio('refresh')
        //$( "#" + idCheck ).attr('checked',true).checkboxradio();
      }else{
        $( "#" + idSpinner ).spinner({
          step: 0.1,
          min: 0,
        }).val(Trendfile.getDeadbandFromUnitStr(unit)).width(30);
        $( "#" + idCheck ).checkboxradio();
      }
    }
  }//end for
//  $( ".CheckboxRadiosReportBlockInputs" ).checkboxradio();


  $("#reportBlockUserEvents input").checkboxradio();


  $('#editor').accordion({
    heightStyle: "content"
  });
  HMI.makeReportList("preview");
};
/**
Object für Reportdefinition
nimmt Einstellungen in den Forms auf und
JSON des objects kann als Cookie, localStorage oder Serverseitig gespeichert werden
*/
HMI.trendReportDefinition = {
  cIperValue :[],
  userEvents :[]
};

/**
  prüft, ob aus letzter session Filterregeln da sind und bereitet diese auf
*/
HMI.getLastSessionFilterRules=function() {
  var last = localStorage.getItem('trendReportDefinition');
  //alert(last);
  if (last != null) {
    HMI.trendReportDefinition = JSON.parse(last);
    //alert(HMI.trendReportDefinition.cIperValue[0].index);
    //alert("found");
  }
};
/**
  speichert die filterreglen für die nächste session
*/
HMI.saveSessionFilterRules=function() {
  /*var s='trendReportDefinition=';
  s+=JSON.stringify(HMI.trendReportDefinition);
  s+=';max-age=315360000;' //10 Jahre
  document.cookie = s;*/
  localStorage.setItem('trendReportDefinition', JSON.stringify(HMI.trendReportDefinition));
  //alert("saved");
};

/**
 * Erneuert Auswahl der Eingangskanäle in ReportDefinition
 * nur wenn ein object mit passendem index existiert, werden einträge anhand version
    .deadb gebildet
 */
HMI.refreshReportBlockInput=function() {
	HMI.trendReportDefinition.cIperValue = new Array(); //array mit Eingangskanaldefinitionen (kanalindex und totbandfilter)
	$(".CheckboxRadiosReportBlockInputs").each(function( index ) {
		  if ($( this ).prop("checked")){
			  var deadb = $( ".SpinnerReportBlockInputs" ).eq(index).val();
			  HMI.trendReportDefinition.cIperValue.push({index : index, deadb : deadb});
		  }
	});
  HMI.saveSessionFilterRules();
	HMI.makeReportList("preview"); //report aktualisieren; aktualisierung der vorschau zwischenschalten
};
/**
 * Erneuert Auswahl der Eventblöcke in ReportDefinition
  Object enthält Kategorie-IDs
  nur wenn dasEvent zur Kategorie passt, wird es in den Report übernommen
 */
HMI.refreshReportUserEvents=function() {
	HMI.trendReportDefinition.userEvents = new Array();
	if ($( "#CheckboxRadiosReportBlockUserEvents" ).prop("checked")) HMI.trendReportDefinition.userEvents.push(1);
	//if($( "#??" ).prop("checked")) HMI.trendReportDefinition.userEvents.push(2); ausbauen für weiter eventkreise
  HMI.saveSessionFilterRules();
	HMI.makeReportList("preview"); //report aktualisieren;; aktualisierung der vorschau zwischenschalten
};
/**
 *  wendet die in HMI.trendReportDefinition zusammengetragenen
 Filterregeln an und füllt ein Array mit den auszugebene Report-Snippets
  - Sortiert diese zum schluss nach der zeit
  - stößt dann den asynchronen Aufbau des Reports im DOM an
  - to do: bei sehr großer Array-Größe, eine ungefähre Seitenzahl voraussagen und Nutzer fragen,
          ob wirklich nach diesen Filterregeln geplottet werden soll !!!
 */
HMI.makeReportList=  function(preview) {
  if (preview!=null){ //mit preview par wird das filterobjekt angewendet
    HMI.parsedTrendLines=0;
    HMI.parsedEventLines=0;
  	HMI.trendReportOutput = new Array();//array mit object {intgerzeit als sortierschlüsse , ausgabestring}
    //.... im report erst aus defnitionsdatei einträge pushen, dann array.sort(sortierschlüssel differenz)

  	//zeilen für jeden selektierten eingang mit totbandfiler in ausgabearray pushen
  	HMI.trendReportDefinition.cIperValue.forEach(element => {
  		var channelName=HMI.trendfile.rawdata.tags.cI[element.index];
  		//alert(channelName);
  		var oldValue=HMI.trendfile.rawdata.line[0].data.cI[element.index] - element.deadb;
  		for (var i=0;i<HMI.trendfile.rawdata.dataLinesRead;i++){
  			if (Math.abs(HMI.trendfile.rawdata.line[i].data.cI[element.index] - oldValue) >= element.deadb) {
  				oldValue=HMI.trendfile.rawdata.line[i].data.cI[element.index];
  				HMI.trendReportOutput.push( {
            // to do:  hier besser vorereitetes snippet mit styleklassen und einheiten generieren
  					rawtime: HMI.trendfile.rawdata.line[i].timeRaw, //PFlicht-Sortierschlüssel!!!
  					output :  '<span class="reportListTimestamp">' + HMI.trendfile.rawdata.line[i].time.toUTCString() + "</span>" +
                      '<span class="reportListFirstCol"><b>Input</b> channel value of<span class="reportListInputTag">' + channelName  + "</span></span> was" +
                      '<span class="reportListValue">' + oldValue + " " + HMI.trendfile.rawdata.units.cI[element.index] +  "</span>"
  				});
          HMI.parsedTrendLines++;
  			}
  		}
  	});
  	//alle evnts des selektierten eventsblocks in ausgabearray pushen
  	//einmal über alle events iterieren und nur falls gewählt, pushen
  	HMI.eventfile.rawdata.event.forEach(element => {
  		var push=false;
      //alert (element.ID);
      switch (element.ID) {
        case 10:
        case 11:
        case 12:
        push=true;
        break;
        default:
        //eigentlichen filter anwenden, nur pushen, wenn Kategorie gewählt
  			for (var i= 0; i<HMI.trendReportDefinition.userEvents.length; i++){
          //events die immer ausgegeben werden
          switch(HMI.trendReportDefinition.userEvents[i]) {
  				  case 1:
  					push = ((element.ID > 0) && (element.ID < 10));
  				  break;
  				  case 2:
  					//push = ((element.ID > 0) && (element.ID < 10));  für weiter blöcke fortführen
  				  break;
  				}
        }
        break;
      }
  		if (push) {
        HMI.trendReportOutput.push( {
    			rawtime: element.timeRaw,   //PFlicht-Sortierschlüssel!!!
    			output :  '<span class="reportListTimestamp">' + element.time.toUTCString() + "</span>" +
                    HMI.eventfile.rawdata.makeATeventString( element.ID,element.data)
    		});
        HMI.parsedEventLines++;
      }
  	});
    //hier noch update des preview blocks
    $("#ButtonDrawReport span").append(  "Event-Liness: " + HMI.parsedEventLines +
                                  "<br>Trend-Value-Lines: " + HMI.parsedTrendLines +
                                  "<br>Estimated Pages: " + (Number.parseInt((HMI.parsedEventLines + HMI.parsedTrendLines)/42) + 1)
    );
    $("#ButtonDrawReport").show();
  }
  if (preview==null){ //ohne preview wird sortiert und der asynchrone aufbau angestoßen
  	//sortieren, bisher ohne Prüfung auf "zu hohe" Array-Längen
  	HMI.trendReportOutput.sort((o1,o2) => {return (o2.rawtime - o1.rawtime)}); //Jüngstes event zuerst
  	//alert(HMI.trendReportOutput.length);
  	//final im DOM anhängen, to do: asynchron blockweise, da sonst schnell systemauslastung bei zu vielen daten
    //bis hier hin alles synchron
    //eigentliches einbinden im DOM dann asynchron
  	$('#reportList').empty();
    HMI.asyReportRead=0;
    $("#loadingScreen").dialog("open");//hier HMI Eventhandler für Ladefenster öffnen
    $("#loadingScreen h1").html("Building up Report: ");
    $("#editor").hide();
    HMI.asyReportBlock(); //anstoßen des Report-Aufbaus
  }
};

HMI.asyReportBlock=  function() {
  //falls letzter block
  if (HMI.trendReportOutput.length - HMI.asyReportRead < HMI.ASYREPORTSIZE){
    //nur bis length -1  lesen
    for (var i = HMI.asyReportRead;i < HMI.trendReportOutput.length;i++){
      $('#reportList').append("<li>" + HMI.trendReportOutput[i].output +"</li>");
      HMI.asyReportRead+=1;
    }
    $("#loadingScreen").dialog("close");

  }else{//sonst nur blocklänge an events lesen von asyReportRead bis asyReportRead+ASYREPORTSIZE - 1
    for (var i = HMI.asyReportRead;i < HMI.asyReportRead + HMI.ASYREPORTSIZE;i++){
      $('#reportList').append("<li>" + HMI.trendReportOutput[i].output +"</li>");
    }
    HMI.asyReportRead+=HMI.ASYREPORTSIZE
    HMI.timeoutReportBlock=window.setTimeout(event => {HMI.asyReportBlock()}, HMI.ASYREPORTTIME);
    $("#loadingScreen h1").html("Building up Report: " + HMI.asyReportRead + " of " + HMI.trendReportOutput.length + " printed...");
    $( "#progressbarloadingTrendfile" ).progressbar( "option", "value", HMI.asyReportRead * 100 / HMI.trendReportOutput.length );
  }
};
