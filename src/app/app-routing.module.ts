import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
// import { HeroComponent } from './components/hero/hero.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full', redirectTo: '' },
  // { path: 'about', component: AboutPageComponent },
  // { path: 'contact', component: ContactPageComponent },
  // { path: 'projects', component: ProjectsPageComponent },
  // { path: '**', component: PageNotFoundComponent },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }



