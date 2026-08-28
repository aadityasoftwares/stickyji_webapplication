import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabelShowcase } from './label-showcase';

describe('LabelShowcase', () => {
  let component: LabelShowcase;
  let fixture: ComponentFixture<LabelShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
