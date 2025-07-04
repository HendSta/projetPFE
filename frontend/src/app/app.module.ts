import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule,HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ReactiveFormsModule } from '@angular/forms';

import { 
  Moon, Sun, LogIn, Activity, Stethoscope, Menu, UserPlus, 
  Users, Trophy, Mail, Linkedin, Facebook, Twitter, Instagram,
  MapPin, Phone, Clock, CreditCard, Landmark, CircleDollarSign, ChevronRight,
  Check, CheckCircle, FileText, Download, Headphones, HelpCircle, UploadCloud, 
  PlayCircle, Save, Loader, Eye, Trash2, X, ExternalLink, RefreshCw, Search
} from 'lucide-angular';
import { SigninComponent } from './components/signin/signin.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { SignupComponent } from './components/signup/signup.component';
import { AuthButtonComponent } from './components/auth-button/auth-button.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AuthModule } from '@auth0/auth0-angular';
import { environment } from '../environments/environment';
import { AnalyzingComponent } from './components/analyzing/analyzing.component';
import { HistoricsComponent } from './components/historics/historics.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    SigninComponent,
    SignupComponent,
    AuthButtonComponent,
    UserProfileComponent,
    DoctorDashboardComponent,
    AnalyzingComponent,
    HistoricsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    }),
    FormsModule,
    AuthModule.forRoot({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin //redirect after l auth
      }
    }),
    LucideAngularModule.pick({ 
      Moon, Sun, LogIn, Activity, Stethoscope, Menu, UserPlus,
      Users, Trophy, Mail, Linkedin, Facebook, Twitter, Instagram,
      MapPin, Phone, Clock, CreditCard, Landmark, CircleDollarSign, ChevronRight,
      Check, CheckCircle, FileText, Download, Headphones, HelpCircle, UploadCloud, 
      PlayCircle, Save, Loader, Eye, Trash2, X, ExternalLink, RefreshCw, Search
    }),
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
