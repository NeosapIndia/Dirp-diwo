import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SingleWorkbookPage } from './all-worksheets.page';

describe('SingleWorkbookPage', () => {
  let component: SingleWorkbookPage;
  let fixture: ComponentFixture<SingleWorkbookPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SingleWorkbookPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SingleWorkbookPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
