import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceStrict, parseISO } from 'date-fns';

@Pipe({ name: 'humanizeDate' })
export class HumanizePipe implements PipeTransform {

    transform(value): any {
        return !!value ? formatDistanceStrict(parseISO(value), new Date(), { addSuffix: true }) : "";
    }
}
