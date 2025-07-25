import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
     name: 'CardFilter',
    pure: false})
export class CardFilter implements PipeTransform {
    transform(items: any , searchText: any) {
        if (!items) return [];
        if (!searchText) return items;
        return items.filter(it => {
            return searchText.indexOf(it.Activity_format.name) > -1;
        });
    }
}


