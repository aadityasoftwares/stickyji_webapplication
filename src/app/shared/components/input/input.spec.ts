import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Input } from './input';

describe('Input', () => {
  let component: Input;
  let fixture: ComponentFixture<Input>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Input],
    }).compileComponents();

    fixture = TestBed.createComponent(Input);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to no shadow and does not apply shadow classes', () => {
    expect(component.resolvedShadow).toBe('none');
    expect(component.wrapperClasses['app-input-has-shadow']).toBeFalsy();
    expect(component.wrapperClasses['app-input-shadow-none']).toBeFalsy();
  });

  it('applies shadow classes when shadow="upside" is set', () => {
    component.shadow = 'upside';
    expect(component.resolvedShadow).toBe('upside');
    expect(component.wrapperClasses['app-input-has-shadow']).toBe(true);
    expect(component.wrapperClasses['app-input-shadow-upside']).toBe(true);
  });

  it('applies shadow classes when shadow="sm" is set', () => {
    component.shadow = 'sm';
    expect(component.resolvedShadow).toBe('sm');
    expect(component.wrapperClasses['app-input-has-shadow']).toBe(true);
    expect(component.wrapperClasses['app-input-shadow-sm']).toBe(true);
  });

  it('resolves boolean true to upside shadow', () => {
    component.shadow = true;
    expect(component.resolvedShadow).toBe('upside');
    expect(component.wrapperClasses['app-input-has-shadow']).toBe(true);
    expect(component.wrapperClasses['app-input-shadow-upside']).toBe(true);
  });

  it('resolves boolean false to none', () => {
    component.shadow = false;
    expect(component.resolvedShadow).toBe('none');
    expect(component.wrapperClasses['app-input-has-shadow']).toBeFalsy();
  });
});
