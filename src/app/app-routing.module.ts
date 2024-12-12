import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ErrorComponent } from './pages/error/error.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' }, // pathMatch is explicitly 'full'
  { path: '**', component: ErrorComponent }, // No pathMatch needed for wildcard route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
