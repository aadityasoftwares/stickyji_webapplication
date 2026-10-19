import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LucidePlus } from '@lucide/angular';
import { AppIcon } from './icon';

describe('AppIcon', () => {
  let component: AppIcon;
  let fixture: ComponentFixture<AppIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(AppIcon);
    component = fixture.componentInstance;
    component.icon = LucidePlus;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
