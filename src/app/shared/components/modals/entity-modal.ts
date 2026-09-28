import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Entity, CreateEntityPayload } from '../../../core/models/entity.model';

@Component({
  selector: 'app-entity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-modal.html',
  styleUrl: './entity-modal.css',
})
export class EntityModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() editingEntity: Entity | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ payload: CreateEntityPayload; id?: string }>();

  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  formData: CreateEntityPayload = {
    entity_name: '',
    short_name: '',
    description: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingEntity'] || changes['isOpen']) {
      if (this.editingEntity) {
        this.formData = {
          entity_name: this.editingEntity.entity_name,
          short_name: this.editingEntity.short_name,
          description: this.editingEntity.description || '',
        };
      } else {
        this.formData = { entity_name: '', short_name: '', description: '' };
      }
      this.error.set(null);
      this.submitting.set(false);
    }
  }

  onSubmit(): void {
    if (!this.formData.entity_name || !this.formData.short_name) {
      this.error.set('Entity name and short name are required.');
      return;
    }

    this.submitting.set(true);
    this.save.emit({
      payload: this.formData,
      id: this.editingEntity?._id,
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
