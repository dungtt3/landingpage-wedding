import { forGuest, guestName, mainEvent, sectionIds, wedding } from './content/wedding';
import { WeddingLanding } from './features/landing/WeddingLanding';
import { useEffect, useState } from 'react';
import { CardIntro } from './features/storybook/components/CardIntro';
import type { InvitationContent } from './features/storybook/components/InvitationOverlay';

// `?place=1` (nhà gái) / `?place=2` (nhà trai) picks which party this guest is invited to.
const search = typeof window === 'undefined' ? '' : window.location.search;
const content = forGuest(wedding, search);
const event = mainEvent(content);

/** Text inside the gatefold card, derived from the same content as the landing page. */
const invitationCard: InvitationContent = {
  // `?name=Anh%20Nam` → the guest's name under "Trân trọng kính mời" inside the opening card.
  recipient: guestName(search) || 'Quý khách',
  eyebrow: 'Trân trọng kính mời',
  occasion: 'Tới dự lễ thành hôn của hai con chúng tôi',
  closing: 'Rất hân hạnh được đón tiếp',
  // Both families sign the invitation, whichever party the guest is invited to.
  families: [wedding.groom, wedding.bride].map((p) => ({ label: p.family, father: p.father, mother: p.mother })),
  groom: wedding.groom.name,
  bride: wedding.bride.name,
  dateISO: event.start,
  dateLabel: event.dateLabel,
  timeLabel: event.timeLabel,
  lunarDate: event.lunarDate && `(${event.lunarDate})`,
  venueName: event.venueName,
  venueAddress: event.address,
  primaryAction: { label: 'Mở thiệp mời', href: `#${sectionIds.landing}` },
  secondaryAction: { label: 'Xác nhận tham dự', href: `#${sectionIds.rsvp}` },
  // Names, date and venue on the card are real; placeholders remain only further down the page.
  isPlaceholder: false,
};

/**
 * The landing page, with the closed gatefold card laid over it. Opening the
 * card fades it away straight onto the page (the 2.5D storybook scenes are not used).
 */
export function App() {
  const [introDone, setIntroDone] = useState(false);
  // Arrived through a link to a section (e.g. #rsvp): go there once the card is gone and scroll is unlocked.
  useEffect(() => {
    if (!introDone || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  }, [introDone]);
  return (
    <main id="top">
      {!introDone && <CardIntro content={invitationCard} onDone={() => setIntroDone(true)} />}
      <WeddingLanding content={content} />
    </main>
  );
}
