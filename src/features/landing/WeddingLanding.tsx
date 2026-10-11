import { useRef } from 'react';
import { sectionIds, type WeddingContent } from '../../content/wedding';
import { LandingNav, type NavItem } from './components/LandingNav';
import { useRevealOnScroll } from './components/useRevealOnScroll';
import { CoupleSection } from './sections/CoupleSection';
import { EventsSection } from './sections/EventsSection';
import { GallerySection } from './sections/GallerySection';
import { GiftSection } from './sections/GiftSection';
import { HeroSection } from './sections/HeroSection';
import { RsvpSection } from './sections/RsvpSection';
import { StorySection } from './sections/StorySection';
import { VideoSection } from './sections/VideoSection';
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
export function WeddingLanding({ content }: { content: WeddingContent }) {
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
        <StorySection content={content} />
        <VideoSection content={content} />
        <GallerySection content={content} />
        <RsvpSection content={content} />
        <WishesSection content={content} />
        <GiftSection content={content} />
        <footer className="ld-footer">
          <p className="ld-footer__names">{couple}</p>
          <h2 className="ld-footer__title">{content.closing.title}</h2>
          <p>{content.closing.text}</p>
          <a className="ld-btn ld-btn--ghost" href="#top">
            Về đầu trang ↑
          </a>
        </footer>
      </div>
    </div>
  );
}
