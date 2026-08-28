import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeShowcase } from './badge-showcase';

describe('BadgeShowcase', () => {
  let component: BadgeShowcase;
  let fixture: ComponentFixture<BadgeShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
