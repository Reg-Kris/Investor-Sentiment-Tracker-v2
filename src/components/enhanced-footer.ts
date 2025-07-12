import { FooterBase } from './footer/footer-base.js';
import { FooterStyles } from './footer/footer-styles.js';
import { FloatingElements } from './footer/elements/floating-elements.js';
import { SocialLinks } from './footer/elements/social-links.js';
import { TechBadge } from './footer/elements/tech-badge.js';
import { FooterAnimations } from './footer/animations/footer-animations.js';
import { CelebrationEffects } from './footer/effects/celebration-effects.js';

export class EnhancedFooter extends FooterBase {
  private floatingElements!: FloatingElements;
  private socialLinks!: SocialLinks;
  private techBadge!: TechBadge;
  private animations!: FooterAnimations;
  private celebrationEffects!: CelebrationEffects;

  constructor() {
    super();
    this.init();
  }

  private init(): void {
    this.enhanceFooterStructure();
    FooterStyles.inject();
    
    this.floatingElements = new FloatingElements(this.container);
    this.socialLinks = new SocialLinks(this.container);
    this.techBadge = new TechBadge(this.container);
    this.animations = new FooterAnimations(this.container);
    this.celebrationEffects = new CelebrationEffects(this.container);
    
    this.floatingElements.create();
    this.socialLinks.setupInteractions();
    this.techBadge.setupInteractions();
    this.animations.setupScrollAnimations();
    
    this.animations.setupIntersectionObserver(() => {
      this.animateIn();
    });
  }

  private animateIn(): void {
    this.animations.animateMainContent();
    this.socialLinks.animateIn();
    this.techBadge.animateIn();
    this.floatingElements.startAnimations();
  }

  public updateLastUpdated(timestamp: string): void {
    this.animations.updateWithAnimation(timestamp);
  }

  public celebrateUpdate(): void {
    this.celebrationEffects.celebrate();
  }

  public destroy(): void {
    this.animations.destroy();
    this.floatingElements.destroy();
  }
}