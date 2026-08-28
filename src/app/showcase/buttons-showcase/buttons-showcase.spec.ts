import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonsShowcase } from './buttons-showcase';

describe('ButtonsShowcase', () => {
  let component: ButtonsShowcase;
  let fixture: ComponentFixture<ButtonsShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonsShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonsShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
