/**
 *  Enthällt ststische Methoden für die DOM Strings zur menschenlesbaren Ausgabe der Eventdatei und Trenddatei
 *
 *
 *  *@author TK, 04/2020,   version 1.0.1

 * to do in ListPlotter umziehen lassen
 *
 */
"use strict";
class EventDOMOutputs   {

  static makeHeaderTable(trends,events){
    var age=Math.ceil((trends.lastDat - trends.firstDat)/1000/60/60);
    $('#headerInfoTrendfile').html(
      "<table><tbody><tr>   <td>Total batch time: </td><td>"              + String(age) + ' hours' +
      "</td></tr><tr>       <td>Last sample time from header:</td><td>"   + trends.firstDat.toUTCString() +
      "</td></tr><tr>       <td>Last sample time from header:</td><td>"   + trends.lastDat.toUTCString() +
      "</td></tr><tr>       <td>User Comment: </td><td>"                   + trends.comment +
      "</td></tr><tr>       <td>Data lines header: </td><td>"             + String(trends.lineCount) +
      "</td></tr><tr>       <td>Data lines read: </td><td>"               + String(trends.dataLinesRead) +
      "</td></tr><tr>       <td>Bytes skipped: </td><td>"                 + String(trends.bytesSkipped) + " / " + String(events.bytesSkipped) +
      "</td></tr><tr>       <td>Events read: </td><td>"                   + String(events.records) +
      "</td></tr><tr>       <td>Max. events in buffer: </td><td>"         + String(events.maxBufCount) +
      "</td></tr><tr>       <td>Max. eventbuffer size: </td><td>"         + String(events.maxBufSize) +
      "</td></tr><tr>       <td>Sampling rate: </td><td>"                 + String(trends.samplingRate) + ' sek' +
      "</td></tr><tr>       <td>Device Ident: </td><td>"                  + String(trends.ident) +
      "</td></tr><tr>       <td>Controller: </td><td>"                    + String(trends.countCLMax) +
      "</td></tr><tr>       <td>Outputs: </td><td>"                       + String(trends.countOutpMax) +
      "</td></tr><tr>       <td>Inputs: </td><td>"                        + String(trends.countInpMax) +
      "</td></tr></tbody></table>");
  }





}
