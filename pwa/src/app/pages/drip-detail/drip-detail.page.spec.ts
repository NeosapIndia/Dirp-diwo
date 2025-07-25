import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DripDetailPage } from './drip-detail.page';

describe('DripDetailPage', () => {
  let component: DripDetailPage;
  let fixture: ComponentFixture<DripDetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DripDetailPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DripDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
