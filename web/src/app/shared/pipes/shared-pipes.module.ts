import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FilterSearch } from './FilterSearch';
// import { DurationFormat } from './DurationFormat';
import { DateFormat } from './DateFormat';
import { TimeFormat } from './TimeFormat';
import { CardFilter } from './CardFilter';
import { AmountFormat } from './AmountFilter';

@NgModule({
    imports: [
        CommonModule,
        TranslateModule
    ],
    declarations: [ FilterSearch, CardFilter,DateFormat, TimeFormat, AmountFormat ],
    exports:[ FilterSearch, CardFilter, DateFormat, TimeFormat, TranslateModule, AmountFormat ]
})
export class SharedPipesModule { }
