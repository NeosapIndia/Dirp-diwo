import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditAppBrandingComponent } from './add-edit-app-branding.component';

describe('AddEditAppBrandingComponent', () => {
  let component: AddEditAppBrandingComponent;
  let fixture: ComponentFixture<AddEditAppBrandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditAppBrandingComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddEditAppBrandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
