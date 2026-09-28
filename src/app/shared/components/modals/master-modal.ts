import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-master-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './master-modal.html',
  styleUrl: './master-modal.css',
})
export class MasterModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() title = 'Master Record';
  @Input() nameLabel = 'Name';
  @Input() showCode = false;
  @Input() codeLabel = 'Code';
  @Input() showParent = false;
  @Input() parentLabel = 'State / Parent';
  @Input() parentOptions: { id: string; label: string }[] = [];
  @Input() editingItem: any = null;
  @Input() isEdit = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  formData: {
    name: string;
    code?: string;
    parent_id?: string;
    description?: string;
  } = {
    name: '',
    code: '',
    parent_id: '',
    description: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingItem'] || changes['isOpen']) {
      if (this.editingItem) {
        this.formData = {
          name:
            this.editingItem.nationality ||
            this.editingItem.religion ||
            this.editingItem.category_name ||
            this.editingItem.post_name ||
            this.editingItem.state_name ||
            this.editingItem.district_name ||
            this.editingItem.station_name ||
            this.editingItem.defence_post_name ||
            this.editingItem.name ||
            '',
          code:
            this.editingItem.short_name ||
            this.editingItem.code ||
            this.editingItem.category_code ||
            '',
          parent_id:
            this.editingItem.state_id ||
            this.editingItem.district_id ||
            this.editingItem.parent_id ||
            '',
          description: this.editingItem.description || '',
        };
      } else {
        this.formData = {
          name: '',
          code: '',
          parent_id: this.parentOptions[0]?.id || '',
          description: '',
        };
      }
      this.error.set(null);
      this.submitting.set(false);
    }
  }

  onSubmit(): void {
    if (!this.formData.name) {
      this.error.set('Please enter a name for this record.');
      return;
    }

    this.submitting.set(true);
    this.save.emit({
      formData: this.formData,
      id: this.editingItem?._id,
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
