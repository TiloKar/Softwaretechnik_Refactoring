
/**Prototype für Umgang mit B&R binaries für die eine Typ-Datei geparst wurde
 *
 *@author TK, 04/2021, version 1.0.1
 *
*/
"use strict";
class EventPlotterHMI {

  constructor(){
    alert("constructed");

  }
  /** 
    Rundungen
  */
  static round(wert, dez) {
      var hlp = Math.pow(10,dez)
      return Math.floor(wert * hlp) / hlp;
  }

  static init(){
    alert("static call");
  }
}
