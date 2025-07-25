import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AllWorkbooksPage } from './all-workbooks.page';

describe('AllWorkbooksPage', () => {
  let component: AllWorkbooksPage;
  let fixture: ComponentFixture<AllWorkbooksPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AllWorkbooksPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AllWorkbooksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
