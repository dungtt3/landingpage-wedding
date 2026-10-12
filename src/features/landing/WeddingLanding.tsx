import { useRef } from 'react';
import { sectionIds, type WeddingContent } from '../../content/wedding';
import { LandingNav, type NavItem } from './components/LandingNav';
import { MusicToggle } from './components/MusicToggle';
import { useRevealOnScroll } from './components/useRevealOnScroll';
import type { BackgroundMusic } from './lib/music';
import { CoupleSection } from './sections/CoupleSection';
import { EventsSection } from './sections/EventsSection';
import { GallerySection } from './sections/GallerySection';
import { GiftSection } from './sections/GiftSection';
import { HeroSection } from './sections/HeroSection';
import { RsvpSection } from './sections/RsvpSection';
import { StorySection } from './sections/StorySection';
import { WishesSection } from './sections/WishesSection';
import './landing.css';

const NAV: NavItem[] = [
  { id: sectionIds.couple, label: 'Cô dâu & Chú rể', icon: 'couple' },
  { id: sectionIds.events, label: 'Sự kiện', icon: 'events' },
  { id: sectionIds.story, label: 'Chuyện tình', icon: 'story' },
  { id: sectionIds.gallery, label: 'Album', icon: 'gallery' },
  { id: sectionIds.rsvp, label: 'Xác nhận', icon: 'rsvp' },
  { id: sectionIds.wishes, label: 'Lời chúc', icon: 'wishes' },
  { id: sectionIds.gifts, label: 'Mừng cưới', icon: 'gifts' },
];

/**
 * Part 2 of the site: the regular, scrollable invitation page that follows the
 * storybook intro. Plain React + CSS; it does not depend on the storybook engine.
 */
export function WeddingLanding({
  content,
  music,
  showMusicToggle,
  onCloseCard,
}: {
  content: WeddingContent;
  music?: BackgroundMusic;
  /** Off while the card intro still covers the page. */
  showMusicToggle?: boolean;
  onCloseCard?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useRevealOnScroll(rootRef);
  const couple = `${content.groom.shortName} & ${content.bride.shortName}`;

  return (
    <div ref={rootRef} className="ld">
      <div className="ld-card">
        <LandingNav items={NAV} brand={couple} />
        <HeroSection content={content} />
        <CoupleSection content={content} />
        <EventsSection content={content} />
        <StorySection content={content} music={music} />
        <GallerySection content={content} />
        <RsvpSection content={content} />
        <WishesSection content={content} />
        <GiftSection content={content} />
        <footer className="ld-footer">
          <p className="ld-footer__names">{couple}</p>
          <h2 className="ld-footer__title">{content.closing.title}</h2>
          <p>{content.closing.text}</p>
          <div className="ld-footer__actions">
            {onCloseCard && (
              <button type="button" className="ld-btn ld-btn--primary" onClick={onCloseCard}>
                Đóng thiệp <span aria-hidden="true">✉</span>
              </button>
            )}
            <a className="ld-btn ld-btn--ghost" href="#top">
              Về đầu trang ↑
            </a>
          </div>
        </footer>
      </div>
      {/* Outside .ld-card: its container query would pin a fixed button to the card instead of the screen. */}
      {music && showMusicToggle && <MusicToggle music={music} title={content.music.title} />}
    </div>
  );
}
