import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarShowcase } from './avatar-showcase';

describe('AvatarShowcase', () => {
  let component: AvatarShowcase;
  let fixture: ComponentFixture<AvatarShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
