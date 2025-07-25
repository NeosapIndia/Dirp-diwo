import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditOptInsComponent } from './add-edit-opt-ins.component';

describe('AddEditOptInsComponent', () => {
  let component: AddEditOptInsComponent;
  let fixture: ComponentFixture<AddEditOptInsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditOptInsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddEditOptInsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
