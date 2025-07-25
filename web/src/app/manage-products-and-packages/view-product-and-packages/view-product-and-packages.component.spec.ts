import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewProductAndPackagesComponent } from './view-product-and-packages.component';

describe('ViewProductAndPackagesComponent', () => {
  let component: ViewProductAndPackagesComponent;
  let fixture: ComponentFixture<ViewProductAndPackagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewProductAndPackagesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewProductAndPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
