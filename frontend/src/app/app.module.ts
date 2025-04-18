import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LucideAngularModule } from 'lucide-angular';
import { 
  Moon, Sun, LogIn, Activity, Stethoscope, Menu, UserPlus, 
  Users, Trophy, Mail, Linkedin 
} from 'lucide-angular';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LucideAngularModule.pick({ 
      Moon, Sun, LogIn, Activity, Stethoscope, Menu, UserPlus,
      Users, Trophy, Mail, Linkedin
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
