import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxCursorModule } from 'ngx-cursor';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true,
    imports: [RouterOutlet, NgxCursorModule]
})
export class AppComponent {
  title = 'portfolio';
}
