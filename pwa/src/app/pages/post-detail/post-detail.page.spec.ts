import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PostDetailPage } from './post-detail.page';

describe('PostDetailPage', () => {
  let component: PostDetailPage;
  let fixture: ComponentFixture<PostDetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PostDetailPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
