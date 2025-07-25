import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'AmountFilter',
    pure: false
})

export class AmountFormat implements PipeTransform {
    public transform(value) {
        value = +value;
        return value = Number.isNaN(value) ? '0.00': value.toFixed(2);
    }
}
