import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ambient-shapes',
  templateUrl: './ambient-shapes.component.html',
  styleUrls: ['./ambient-shapes.component.css'],
  standalone: false,
})
export class AmbientShapesComponent {
  @Input() errorMode = false;
}
