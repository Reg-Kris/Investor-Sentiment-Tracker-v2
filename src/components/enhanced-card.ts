import { CardData } from './cards/types';
import { BaseCard } from './cards/base-card';
import { AnimationEffects } from './cards/animations/animation-effects';
import { VisualEffects } from './cards/effects/visual-effects';

// Re-export CardData interface for backward compatibility
export type { CardData } from './cards/types';

export class EnhancedCard extends BaseCard {
  private animationEffects: AnimationEffects;
  private visualEffects: VisualEffects;
  private morphingShapes: HTMLElement[] = [];

  constructor(containerId: string, data: CardData) {
    super(containerId, data);
    this.animationEffects = new AnimationEffects();
    this.visualEffects = new VisualEffects();
    this.init();
  }

  private init(): void {
    this.createCardStructure();
    this.createMorphingBackground();
    this.setupIntersectionObserver(() => this.animateIn());
    this.setupInteractions(
      () => this.animateHover(),
      () => this.animateHoverOut(),
      () => this.animateClick()
    );
  }

  private createMorphingBackground(): void {
    this.morphingShapes = this.visualEffects.createMorphingBackground(this.container, this.data);
  }

  private animateIn(): void {
    const elements = this.getCardElements();
    if (!elements.card) return;

    // Main card entrance
    this.animationEffects.animateCardEntrance(elements.card);

    // Animate value with counting effect
    if (elements.value) {
      this.animationEffects.animateValueCounting(elements.value, this.data);
    }

    // Animate morphing shapes
    this.visualEffects.startMorphingAnimation(this.morphingShapes);

    // Animate trend line
    if (elements.trendLine) {
      this.animationEffects.animateTrendLine(elements.trendLine, this.data.trend);
    }

    // Add subtle text reveal
    if (elements.message) {
      this.animationEffects.animateMessageReveal(elements.message);
    }
  }

  private animateHover(): void {
    const elements = this.getCardElements();
    if (!elements.card) return;

    // Enhanced hover effect
    this.animationEffects.animateHover(elements.card, elements.gauge, elements.value);

    // Intensify morphing shapes
    this.visualEffects.intensifyMorphingShapes(this.morphingShapes);
  }

  private animateHoverOut(): void {
    const elements = this.getCardElements();
    if (!elements.card) return;

    // Return to normal state
    this.animationEffects.animateHoverOut(elements.card, elements.gauge, elements.value);

    // Return morphing shapes to normal
    this.visualEffects.normalizeMorphingShapes(this.morphingShapes);
  }

  private animateClick(): void {
    const elements = this.getCardElements();
    if (!elements.card) return;

    // Quick scale pulse
    this.animationEffects.animateClick(elements.card);

    // Create ripple effect
    this.visualEffects.createRippleEffect(elements.card);
  }

  public updateData(newData: Partial<CardData>): void {
    this.data = { ...this.data, ...newData };
    const elements = this.getCardElements();
    
    // Animate value change
    if (elements.value && newData.value !== undefined) {
      this.animationEffects.animateValueUpdate(elements.value, newData.value);
    }

    // Update message with fade transition
    if (elements.message && newData.message) {
      this.animationEffects.animateMessageUpdate(elements.message, newData.message);
    }

    // Update colors if changed
    if (newData.color) {
      this.visualEffects.updateShapeColors(this.morphingShapes, newData.color);
    }
  }

  public pulse(): void {
    const elements = this.getCardElements();
    if (!elements.card) return;

    this.animationEffects.animatePulse(elements.card);
  }

  public destroy(): void {
    super.destroy();
    
    // Clean up animations and effects
    this.animationEffects.destroy([this.container, ...this.morphingShapes]);
    this.visualEffects.destroy();
  }
}