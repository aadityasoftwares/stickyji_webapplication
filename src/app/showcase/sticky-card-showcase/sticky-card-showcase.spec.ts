import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickyCardShowcase } from './sticky-card-showcase';

describe('StickyCardShowcase', () => {
  let component: StickyCardShowcase;
  let fixture: ComponentFixture<StickyCardShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyCardShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyCardShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
