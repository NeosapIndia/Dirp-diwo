import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { WorksheetPage } from './worksheet.page';

describe('WorksheetPage', () => {
  let component: WorksheetPage;
  let fixture: ComponentFixture<WorksheetPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WorksheetPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(WorksheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
