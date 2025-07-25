import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'FilterSearch',
  pure: false
})

export class FilterSearch implements PipeTransform {
  public transform(value, keys: string, subStr: string) {

    if (subStr == null || subStr == undefined) return value;
    return (value || []).filter(item => keys.split(',').some(key => {
      if (key.includes('[]')) {
        for (let arr of item[key.split('[]')[0]]) {
          for (let keyof in arr) {
            if(keyof !='status'){
            let result = (this.checkIfExists(arr, keyof, subStr));
            if (result)
              return (this.checkIfExists(arr, keyof, subStr));
            }
          }
        }
      }
      if (key.includes('.'))
        return (this.checkIfExists(item[key.split('.')[0]], key.split('.')[1], subStr));
      return (this.checkIfExists(item, key, subStr));
    })
    )
  }

  checkIfExists(item, key, subStr) {
    return (item.hasOwnProperty(key) && new RegExp(subStr, 'gi').test(item[key]))
  }
}


