import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SigninComponent } from './components/signin/signin.component';
import { HomeComponent } from './components/home/home.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },  // Route pour la page d'accueil
  { path: 'user-profile', component: UserProfileComponent },
  { path: 'signin', component: SigninComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }  // Route par défaut redirige vers /home
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
