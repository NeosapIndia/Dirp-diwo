import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DiwoSearchPage } from './diwo-search.page';

describe('SearchPage', () => {
  let component: DiwoSearchPage;
  let fixture: ComponentFixture<DiwoSearchPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiwoSearchPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DiwoSearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
