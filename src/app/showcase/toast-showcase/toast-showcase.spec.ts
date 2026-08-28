import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastShowcase } from './toast-showcase';

describe('ToastShowcase', () => {
  let component: ToastShowcase;
  let fixture: ComponentFixture<ToastShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
