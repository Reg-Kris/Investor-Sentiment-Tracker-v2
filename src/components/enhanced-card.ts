import anime from 'animejs';
import { gsap } from 'gsap';

export interface CardData {
  title: string;
  value: string | number;
  change?: string | number;
  message: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  timeframe?: string;
}

export class EnhancedCard {
  private container: HTMLElement;
  private data: CardData;
  private isVisible: boolean = false;
  private observer: IntersectionObserver | null = null;
  private morphingShapes: HTMLElement[] = [];

  constructor(containerId: string, data: CardData) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Card container with id "${containerId}" not found`);
    }
    this.container = container;
    this.data = data;
    this.init();
  }

  private init(): void {
    this.createCardStructure();
    this.createMorphingBackground();
    this.setupIntersectionObserver();
    this.setupInteractions();
  }

  private createCardStructure(): void {
    this.container.innerHTML = `
      <div class="indicator-card enhanced" data-trend="${this.data.trend || 'neutral'}">
        <div class="morphing-background"></div>
        <div class="card-header">
          <div class="card-title-section">
            <h3 class="card-title">${this.data.title}</h3>
            ${this.data.timeframe ? `<span class="timeframe-badge">${this.data.timeframe}</span>` : ''}
          </div>
          <div class="gauge-container">
            <div class="mini-gauge"></div>
          </div>
        </div>
        
        <div class="card-content">
          <div class="value-section">
            <div class="primary-value" data-value="${this.data.value}">${this.data.value}</div>
            ${this.data.change ? `<div class="change-value ${this.getTrendClass()}">${this.data.change}</div>` : ''}
          </div>
          
          <div class="message-section">
            <p class="indicator-message">${this.data.message}</p>
          </div>
        </div>
        
        <div class="card-footer">
          <div class="trend-indicator">
            <div class="trend-line ${this.getTrendClass()}"></div>
          </div>
          <div class="pulse-indicator"></div>
        </div>
      </div>
    `;
  }

  private createMorphingBackground(): void {
    const background = this.container.querySelector('.morphing-background') as HTMLElement;
    if (!background) return;

    background.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.1;
      z-index: 1;
      overflow: hidden;
      border-radius: 16px;
    `;

    // Create animated blob shapes
    for (let i = 0; i < 3; i++) {
      const shape = document.createElement('div');
      shape.className = `morphing-shape-${i}`;
      shape.style.cssText = `
        position: absolute;
        width: ${60 + i * 20}px;
        height: ${60 + i * 20}px;
        background: linear-gradient(135deg, 
          ${this.data.color || 'rgba(59, 130, 246, 0.3)'}, 
          ${this.data.color || 'rgba(139, 92, 246, 0.3)'}
        );
        border-radius: 50%;
        filter: blur(${10 + i * 5}px);
        opacity: 0;
      `;
      
      this.morphingShapes.push(shape);
      background.appendChild(shape);
    }
  }

  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.isVisible) {
              this.isVisible = true;
              this.animateIn();
            }
          });
        },
        { threshold: 0.1 }
      );
      
      this.observer.observe(this.container);
    } else {
      this.isVisible = true;
      this.animateIn();
    }
  }

  private setupInteractions(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    if (!card) return;

    card.addEventListener('mouseenter', () => this.animateHover());
    card.addEventListener('mouseleave', () => this.animateHoverOut());
    card.addEventListener('click', () => this.animateClick());

    // Touch events for mobile
    card.addEventListener('touchstart', () => this.animateHover());
    card.addEventListener('touchend', () => {
      this.animateClick();
      setTimeout(() => this.animateHoverOut(), 1000);
    });
  }

  private animateIn(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    const value = this.container.querySelector('.primary-value') as HTMLElement;
    const message = this.container.querySelector('.indicator-message') as HTMLElement;
    
    if (!card) return;

    // Main card entrance
    gsap.fromTo(card, 
      { 
        opacity: 0, 
        y: 50, 
        scale: 0.9,
        rotationX: -15 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotationX: 0,
        duration: 1.2, 
        ease: "back.out(1.7)" 
      }
    );

    // Animate value with counting effect
    if (value) {
      const targetValue = parseFloat(String(this.data.value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(targetValue)) {
        const cardInstance = this;
        gsap.fromTo({ value: 0 }, 
          { value: targetValue },
          {
            duration: 2,
            ease: "power2.out",
            onUpdate: function() {
              const currentValue = this.targets()[0].value;
              value.textContent = typeof cardInstance.data.value === 'string' 
                ? String(cardInstance.data.value).replace(/[\d.-]+/, currentValue.toFixed(2))
                : currentValue.toFixed(2);
            }
          }
        );
      }
    }

    // Animate morphing shapes
    this.morphingShapes.forEach((shape, index) => {
      const delay = index * 300;
      
      gsap.to(shape, {
        opacity: 0.6,
        delay: delay / 1000,
        duration: 1,
        ease: "power2.out"
      });

      // Continuous morphing animation
      anime({
        targets: shape,
        translateX: [
          { value: Math.random() * 100 - 50, duration: 4000 },
          { value: Math.random() * 100 - 50, duration: 4000 }
        ],
        translateY: [
          { value: Math.random() * 100 - 50, duration: 5000 },
          { value: Math.random() * 100 - 50, duration: 5000 }
        ],
        scale: [
          { value: Math.random() * 0.5 + 0.5, duration: 3000 },
          { value: Math.random() * 0.5 + 0.8, duration: 3000 }
        ],
        delay: delay,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });
    });

    // Animate trend line
    this.animateTrendLine();

    // Add subtle text reveal
    if (message) {
      gsap.fromTo(message,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: "power2.out" }
      );
    }
  }

  private animateHover(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    const gauge = this.container.querySelector('.mini-gauge') as HTMLElement;
    
    if (!card) return;

    // Enhanced hover effect
    gsap.to(card, {
      y: -8,
      scale: 1.02,
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
      duration: 0.4,
      ease: "power2.out"
    });

    // Intensify morphing shapes
    this.morphingShapes.forEach(shape => {
      gsap.to(shape, {
        opacity: 0.8,
        scale: 1.2,
        filter: 'blur(8px) brightness(1.2)',
        duration: 0.4,
        ease: "power2.out"
      });
    });

    // Animate gauge
    if (gauge) {
      gsap.to(gauge, {
        rotation: 360,
        scale: 1.1,
        duration: 0.6,
        ease: "power2.out"
      });
    }

    // Add pulse effect to value
    const value = this.container.querySelector('.primary-value') as HTMLElement;
    if (value) {
      gsap.to(value, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }

  private animateHoverOut(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    const gauge = this.container.querySelector('.mini-gauge') as HTMLElement;
    
    if (!card) return;

    // Return to normal state
    gsap.to(card, {
      y: 0,
      scale: 1,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      duration: 0.6,
      ease: "power2.out"
    });

    // Return morphing shapes to normal
    this.morphingShapes.forEach(shape => {
      gsap.to(shape, {
        opacity: 0.6,
        scale: 1,
        filter: 'blur(15px) brightness(1)',
        duration: 0.6,
        ease: "power2.out"
      });
    });

    // Return gauge to normal
    if (gauge) {
      gsap.to(gauge, {
        rotation: 0,
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)"
      });
    }

    // Return value to normal
    const value = this.container.querySelector('.primary-value') as HTMLElement;
    if (value) {
      gsap.to(value, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  }

  private animateClick(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    if (!card) return;

    // Quick scale pulse
    gsap.to(card, {
      scale: 0.98,
      duration: 0.1,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(card, {
          scale: 1.02,
          duration: 0.2,
          ease: "back.out(2)"
        });
      }
    });

    // Create ripple effect
    this.createRippleEffect();
  }

  private createRippleEffect(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    if (!card) return;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;
    `;

    card.appendChild(ripple);

    gsap.to(ripple, {
      width: 200,
      height: 200,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });
  }

  private animateTrendLine(): void {
    const trendLine = this.container.querySelector('.trend-line') as HTMLElement;
    if (!trendLine) return;

    const trendClass = this.getTrendClass();
    let color = 'rgba(59, 130, 246, 0.8)';
    
    if (trendClass.includes('positive')) color = 'rgba(34, 197, 94, 0.8)';
    else if (trendClass.includes('negative')) color = 'rgba(239, 68, 68, 0.8)';

    trendLine.style.background = color;

    // Animate width from 0 to 100%
    gsap.fromTo(trendLine,
      { width: '0%', opacity: 0 },
      { 
        width: '100%', 
        opacity: 1, 
        duration: 1.5, 
        delay: 0.8,
        ease: "power2.out" 
      }
    );
  }

  private getTrendClass(): string {
    if (!this.data.trend) return 'neutral';
    
    switch (this.data.trend) {
      case 'up': return 'positive';
      case 'down': return 'negative';
      default: return 'neutral';
    }
  }

  public updateData(newData: Partial<CardData>): void {
    this.data = { ...this.data, ...newData };
    
    // Animate value change
    const valueElement = this.container.querySelector('.primary-value') as HTMLElement;
    if (valueElement && newData.value !== undefined) {
      gsap.to(valueElement, {
        scale: 1.1,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          valueElement.textContent = String(newData.value);
          gsap.to(valueElement, {
            scale: 1,
            duration: 0.3,
            ease: "back.out(2)"
          });
        }
      });
    }

    // Update message with fade transition
    const messageElement = this.container.querySelector('.indicator-message') as HTMLElement;
    if (messageElement && newData.message) {
      gsap.to(messageElement, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          messageElement.textContent = newData.message!;
          gsap.to(messageElement, {
            opacity: 1,
            duration: 0.3
          });
        }
      });
    }

    // Update colors if changed
    if (newData.color) {
      this.morphingShapes.forEach(shape => {
        gsap.to(shape, {
          background: `linear-gradient(135deg, ${newData.color}, ${newData.color})`,
          duration: 1,
          ease: "power2.inOut"
        });
      });
    }
  }

  public pulse(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    if (!card) return;

    gsap.to(card, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Clean up animations
    anime.remove(this.morphingShapes);
    gsap.killTweensOf([this.container, ...this.morphingShapes]);
  }
}