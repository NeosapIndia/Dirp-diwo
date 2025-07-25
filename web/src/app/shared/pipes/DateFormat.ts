import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';

@Pipe({
	name: 'DateFormat',
	pure: false,
})
export class DateFormat implements PipeTransform {
	public transform(value: string) {
		value = moment.utc(value).format('DD MMM, YYYY');
		return value;
	}
}
