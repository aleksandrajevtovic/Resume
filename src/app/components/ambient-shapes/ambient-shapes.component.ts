import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ambient-shapes',
  templateUrl: './ambient-shapes.component.html',
  styleUrls: ['./ambient-shapes.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AmbientShapesComponent {
  @Input() errorMode = false;
}
