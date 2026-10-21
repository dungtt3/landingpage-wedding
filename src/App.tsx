import { forGuest, guestName, mainEvent, sectionIds, wedding, type WeddingEvent } from './content/wedding';
import { WeddingLanding } from './features/landing/WeddingLanding';
import { guestSearch } from './features/landing/lib/guests';
import { BackgroundMusic } from './features/landing/lib/music';
import { useEffect, useMemo, useState } from 'react';
import { CardIntro } from './features/storybook/components/CardIntro';
import type { InvitationContent } from './features/storybook/components/InvitationOverlay';

const music = wedding.music.src ? new BackgroundMusic(wedding.music.src) : undefined;

/** Text inside the gatefold card, derived from the same content as the landing page. */
function invitationCard(search: string, event: WeddingEvent): InvitationContent {
  return {
    // `?name=Anh%20Nam` → the guest's name under "…trân trọng kính mời" inside the opening card.
    recipient: guestName(search) || 'Quý khách',
    eyebrow: 'Gia đình chúng tôi trân trọng kính mời',
    occasion: 'Đến dự tiệc thành hôn của hai con chúng tôi',
    closing: 'Sự hiện diện của Quý khách\nlà niềm vinh hạnh lớn đối với gia đình chúng tôi',
    signoff: 'Trân trọng',
    groom: wedding.groom.name,
    bride: wedding.bride.name,
    dateISO: event.start,
    dateLabel: event.dateLabel,
    timeLabel: event.timeLabel,
    lunarDate: event.lunarDate,
    venueName: event.venueName,
    venueAddress: event.address,
    primaryAction: { label: 'Mở thiệp mời', href: `#${sectionIds.landing}` },
    secondaryAction: { label: 'Xác nhận tham dự', href: `#${sectionIds.rsvp}` },
    // Names, date and venue on the card are real; placeholders remain only further down the page.
    isPlaceholder: false,
  };
}

/**
 * The landing page, with the closed gatefold card laid over it. Opening the
 * card fades it away straight onto the page (the 2.5D storybook scenes are not used).
 */
export function App() {
  // `?place=2` (nhà trai) / `?place=1` (nhà gái), or a `/g/<code>` link looked up before
  // the first render, picks which party this guest is invited to.
  const { content, card } = useMemo(() => {
    const search = guestSearch();
    const content = forGuest(wedding, search);
    return { content, card: invitationCard(search, mainEvent(content)) };
  }, []);
  const [introDone, setIntroDone] = useState(false);
  // Arrived through a link to a section (e.g. #rsvp): go there once the card is gone and scroll is unlocked.
  useEffect(() => {
    if (!introDone || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  }, [introDone]);
  // "Đóng thiệp" at the end of the page: back to the closed card, ready to be opened again.
  const closeCard = () => {
    // Drop any #section so reopening does not jump back down the page.
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: 'instant' });
    music?.stop();
    setIntroDone(false);
  };
  return (
    <main id="top">
      {!introDone && (
        <CardIntro
          content={card}
          onOpen={() => music?.prepare()}
          // Started on the "Tiếp tục" tap itself: browsers only allow sound right after one.
          onEnter={() => music?.start()}
          onDone={() => {
            music?.start();
            setIntroDone(true);
          }}
        />
      )}
      <WeddingLanding content={content} music={music} showMusicToggle={introDone} onCloseCard={closeCard} />
    </main>
  );
}
