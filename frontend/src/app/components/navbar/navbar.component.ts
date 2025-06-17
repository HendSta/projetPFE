import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isDarkMode = false;

  constructor(private themeService: ThemeService, public translate: TranslateService) {
    translate.addLangs(['en', 'fr']);
    translate.setDefaultLang('en');
    const browserLang = translate.getBrowserLang() || 'en';
    translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
  }

  ngOnInit(): void {
    this.isDarkMode = document.documentElement.classList.contains('dark');
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = document.documentElement.classList.contains('dark');
  }

  switchLang(lang: string) {
    if (lang) {
      this.translate.use(lang);
    }
  }
}
