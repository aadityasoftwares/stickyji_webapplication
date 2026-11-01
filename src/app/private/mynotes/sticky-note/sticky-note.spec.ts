import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StickyNote } from './sticky-note';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EMPTY, of } from 'rxjs';
import { vi } from 'vitest';
import { StickyNoteAttachmentService } from '../services/sticky-note-attachment.service';
import { NoteAttachments } from '../note-attachments/note-attachments';

describe('StickyNote', () => {
  let component: StickyNote;
  let fixture: ComponentFixture<StickyNote>;
  const list = vi.fn();

  beforeEach(async () => {
    list.mockReset().mockReturnValue(
      of({
        data: [
          {
            attachmentId: 'attachment-1',
            fileName: 'brief.pdf',
            mimeType: 'application/pdf',
            size: 1200,
          },
        ],
      }),
    );
    await TestBed.configureTestingModule({
      imports: [StickyNote],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StickyNoteAttachmentService, useValue: { list, changes$: EMPTY } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyNote);
    component = fixture.componentInstance;
    component.data = {
      id: 'note-1',
      title: 'Design Sprint',
      description: 'Prepare design assets',
      color: 'YELLOW',
      noteKey: 'ST-000001',
    };
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads attachments by note ID in detail layout even when the note has no embedded attachment data', () => {
    expect(list).toHaveBeenCalledWith('note-1', 1);
    expect(fixture.nativeElement.textContent).toContain('brief.pdf');
    expect(
      fixture.debugElement.query(By.directive(NoteAttachments)).componentInstance.readOnly,
    ).toBe(true);
  });

  it('keeps attachment actions from opening the note editor', () => {
    const clicked = vi.spyOn(component.noteClick, 'emit');
    fixture.nativeElement.querySelector('.attachment-card').click();
    expect(clicked).not.toHaveBeenCalled();
  });

  it('passes getall attachments to the detail view without requesting the attachment list again', () => {
    list.mockClear();
    fixture.componentRef.setInput('data', {
      ...component.data,
      attachments: [
        {
          attachmentId: 'embedded',
          fileName: 'from-getall.pdf',
          mimeType: 'application/pdf',
          size: 100,
        },
      ],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('from-getall.pdf');
    expect(list).not.toHaveBeenCalled();
    fixture.componentRef.setInput('data', { ...component.data, attachments: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('from-getall.pdf');
    expect(list).not.toHaveBeenCalled();
  });

  it('does not render attachment lists in compact layout', () => {
    fixture.componentRef.setInput('data', { ...component.data, layout: 'compact' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(NoteAttachments))).toBeNull();
  });

  it('should compute tooltipTone matching note color', () => {
    component.data = { ...component.data, color: 'YELLOW' };
    expect(component.tooltipTone).toBe('noteYellow');

    component.data = { ...component.data, color: 'BLUE' };
    expect(component.tooltipTone).toBe('noteBlue');

    component.data = { ...component.data, color: 'WHITE' };
    expect(component.tooltipTone).toBe('paper');
  });

  it('should attach appTooltip directive to interactive elements', () => {
    const tooltipDirectives = fixture.debugElement.queryAll(By.directive(Tooltip));
    expect(tooltipDirectives.length).toBeGreaterThan(0);

    const editBtn = fixture.debugElement.query(By.css('.sticky-note__edit-trigger'));
    expect(editBtn).toBeTruthy();
    const editTooltip = editBtn.injector.get(Tooltip);
    expect(editTooltip.text).toBe('Edit note');
  });
});
