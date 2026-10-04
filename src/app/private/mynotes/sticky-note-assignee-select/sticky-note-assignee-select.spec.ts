import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Select } from '../../../shared/components/select/select';
import { WorkspaceMemberApiService } from '../../workspace-members/services/workspace-member.service';
import { StickyNoteAssigneeSelect } from './sticky-note-assignee-select';

describe('StickyNoteAssigneeSelect', () => {
  let fixture: ComponentFixture<StickyNoteAssigneeSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyNoteAssigneeSelect],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: false },
        { provide: WorkspaceMemberApiService, useValue: { getAll: () => of({ data: [] }) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(StickyNoteAssigneeSelect);
  });

  it('does not write to ngModel again when the selection is unchanged', async () => {
    fixture.componentRef.setInput('selectedAssigneeIds', ['member-1']);
    fixture.detectChanges();
    await Promise.resolve();

    const select = fixture.debugElement.query(By.directive(Select)).componentInstance as Select;
    const writeValue = vi.spyOn(select, 'writeValue');

    for (let index = 0; index < 5; index += 1) {
      fixture.detectChanges();
      await Promise.resolve();
    }

    expect(writeValue).not.toHaveBeenCalled();

    fixture.componentRef.setInput('selectedAssigneeIds', ['member-2']);
    fixture.detectChanges();
    await Promise.resolve();

    expect(writeValue).toHaveBeenCalledExactlyOnceWith(['member-2']);
  });

  it('keeps the empty selection stable across repeated checks', () => {
    const component = fixture.componentInstance;
    expect(component.currentValues).toBe(component.currentValues);

    fixture.componentRef.setInput('selectedAssigneeIds', null);
    expect(component.currentValues).toBe(component.currentValues);
  });
});
