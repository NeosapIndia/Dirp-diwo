import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
	name: 'TimeFormat',
	pure: false,
})
export class TimeFormat implements PipeTransform {
	public transform(value: string) {
		let values = value.split('-');
		let times = values[0].split(':');
		if (+times[0] < 12) {
			return +times[0] + ':' + times[1] + ' AM';
		} else if (+times[0] > 12) {
			return +times[0] - 12 + ':' + times[1] + ' PM';
		} else if (+times[0] == 12) {
			return '00:' + times[1] + ' AM';
		}
		return times[0] + ':' + times[1];
	}
}
