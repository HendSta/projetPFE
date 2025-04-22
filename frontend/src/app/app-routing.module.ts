import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SigninComponent } from './components/signin/signin.component';
import { HomeComponent } from './components/home/home.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { AnalyzingComponent } from './components/analyzing/analyzing.component';
import { HistoricsComponent } from './components/historics/historics.component';
import { AuthGuard } from './guards/auth.guard';
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'signin', component: SigninComponent },
  {
    path: '',
    component: DoctorDashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'user-profile', component: UserProfileComponent },
      { path: 'analyzing', component: AnalyzingComponent },
      { path: 'historics', component: HistoricsComponent },
      { path: '', redirectTo: 'user-profile', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'home' }  // Rediriger vers home par défaut
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
