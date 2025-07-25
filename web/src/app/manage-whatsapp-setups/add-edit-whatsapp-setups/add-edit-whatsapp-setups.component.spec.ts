import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditWhatsAppSetupsComponent } from './add-edit-whatsapp-setups.component';



describe('AddEditWhatsAppSetupsComponent', () => {
  let component: AddEditWhatsAppSetupsComponent;
  let fixture: ComponentFixture<AddEditWhatsAppSetupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddEditWhatsAppSetupsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditWhatsAppSetupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
