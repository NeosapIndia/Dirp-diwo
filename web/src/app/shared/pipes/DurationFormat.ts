import {Pipe, PipeTransform} from '@angular/core';
declare var moment : any;
declare var momentDurationFormatSetup : any;
momentDurationFormatSetup(moment);
@Pipe({
  name: 'DurationFormat',
  pure: false
})
export class DurationFormat implements PipeTransform {
  public transform(value, keys: string) {
  	if (!value) {
  		return '';
  	}
  	try {
  		if (parseInt(moment().diff(moment(value), 'months', true)) > 0 ) {
    		return  moment.duration(moment().diff(moment(value), 'months', true), "months").format("Y [y], M [m], D [d]");
  		} else {
    		return  moment.duration(moment().diff(moment(value), 'days', true), "days").format("Y [y], M [m], D [d]");
  		}
  	}catch (e) {
  		return '';
  	}
    return '';
  }
}
