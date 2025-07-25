import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditProductAndPackagesComponent } from './add-edit-product-and-packages.component';

describe('AddEditProductAndPackagesComponent', () => {
  let component: AddEditProductAndPackagesComponent;
  let fixture: ComponentFixture<AddEditProductAndPackagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddEditProductAndPackagesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditProductAndPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
