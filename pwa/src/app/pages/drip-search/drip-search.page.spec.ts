import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DripSearchPage } from './drip-search.page';

describe('SearchPage', () => {
  let component: DripSearchPage;
  let fixture: ComponentFixture<DripSearchPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DripSearchPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DripSearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
