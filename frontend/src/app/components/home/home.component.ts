import { Component,OnInit, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy{
  currentSlide = 1;
  totalSlides = 3;
  autoplayInterval: any;
  
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // Initialiser le défilement automatique après que la vue soit chargée
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    // Nettoyer l'intervalle lors de la destruction du composant
    this.stopAutoplay();
  }

  startAutoplay(): void {
    const carousel = document.querySelector('[data-carousel-autoplay="true"]');
    if (!carousel) return;
    
    const interval = parseInt(carousel.getAttribute('data-carousel-interval') || '6000');
    
    this.autoplayInterval = setInterval(() => {
      this.goToNextSlide();
    }, interval);
  }

  stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  goToSlide(slideNumber: number): void {
    this.currentSlide = slideNumber;
    
    // Pour Daisy UI, nous devons utiliser l'attribut "checked" sur les radios
    const radioInput = document.getElementById(`slide${slideNumber}`) as HTMLInputElement;
    if (radioInput) {
      radioInput.checked = true;
    }
  }

  goToNextSlide(): void {
    const nextSlide = this.currentSlide < this.totalSlides ? this.currentSlide + 1 : 1;
    this.goToSlide(nextSlide);
  }

  goToPrevSlide(): void {
    const prevSlide = this.currentSlide > 1 ? this.currentSlide - 1 : this.totalSlides;
    this.goToSlide(prevSlide);
  }


}
