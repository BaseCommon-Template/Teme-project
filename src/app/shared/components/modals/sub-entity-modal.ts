import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubEntityFromAPI, CreateSubEntityPayload } from '../../../core/models/sub-entity.model';
import { Entity } from '../../../core/models/entity.model';

@Component({
  selector: 'app-sub-entity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sub-entity-modal.html',
  styleUrl: './sub-entity-modal.css',
})
export class SubEntityModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() isEditing = false;
  @Input() subEntity: SubEntityFromAPI | null = null;
  @Input() entities: Entity[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ payload: CreateSubEntityPayload; id?: string }>();

  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  formData: CreateSubEntityPayload = {
    parent_entity_id: '',
    sub_entity_name: '',
    short_name: '',
    hq_street_address: '',
    hq_city: '',
    hq_state: '',
    hq_pincode: undefined,
    official_website_url: '',
    posts: [],
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subEntity'] || changes['isOpen']) {
      if (this.subEntity) {
        this.formData = {
          parent_entity_id: this.subEntity.parent_entity_id || '',
          sub_entity_name: this.subEntity.sub_entity_name,
          short_name: this.subEntity.short_name,
          hq_street_address: this.subEntity.hq_street_address || '',
          hq_city: this.subEntity.hq_city || '',
          hq_state: this.subEntity.hq_state || '',
          hq_pincode: this.subEntity.hq_pincode,
          official_website_url: this.subEntity.official_website_url || '',
          posts: this.subEntity.posts || [],
        };
      } else {
        this.formData = {
          parent_entity_id: this.entities[0]?._id || '',
          sub_entity_name: '',
          short_name: '',
          hq_street_address: '',
          hq_city: '',
          hq_state: '',
          hq_pincode: undefined,
          official_website_url: '',
          posts: [],
        };
      }
      this.error.set(null);
      this.submitting.set(false);
    }
  }

  onSubmit(): void {
    if (!this.formData.parent_entity_id || !this.formData.sub_entity_name || !this.formData.short_name) {
      this.error.set('Parent organization, sub-entity name, and short name are required.');
      return;
    }

    this.submitting.set(true);
    this.save.emit({
      payload: this.formData,
      id: this.subEntity?._id,
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
