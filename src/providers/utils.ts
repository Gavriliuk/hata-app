import { Injectable } from '@angular/core';
import Parse from 'parse';

@Injectable()
export class Utils {

  static getFileURL(fileName) {
    return Parse.serverURL + 'files/' + Parse.applicationId + '/' + fileName;
  }
}
