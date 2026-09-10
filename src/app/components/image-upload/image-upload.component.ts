import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { fileToImageDataUrl } from '../../utils/image.util';

@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent {
  readonly value = input<string>('');
  readonly label = input<string>('Fotografía');
  readonly changed = output<string>();

  readonly dragging = signal(false);
  readonly busy = signal(false);

  async onFiles(files: FileList | null): Promise<void> {
    const file = files?.item(0);
    if (!file) return;
    this.busy.set(true);
    try {
      this.changed.emit(await fileToImageDataUrl(file));
    } catch {
      /* archivo no válido: se ignora */
    } finally {
      this.busy.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.onFiles(event.dataTransfer?.files ?? null);
  }

  onDrag(event: DragEvent, active: boolean): void {
    event.preventDefault();
    this.dragging.set(active);
  }

  remove(): void {
    this.changed.emit('');
  }
}
