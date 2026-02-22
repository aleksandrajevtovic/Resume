import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
  standalone: false,
})
export class AdminLoginComponent {
  username = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/admin']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 0) {
          this.errorMessage = 'Backend is not reachable. Start backend on port 8081.';
          return;
        }
        this.errorMessage = 'Invalid credentials.';
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
