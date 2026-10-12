import { forwardRef } from 'react';
import { refKeys } from '../engine/refRegistry';
import type { LayoutMode } from '../engine/sceneTypes';
import { useStorybook } from './StorybookContext';

/** Copy shown on the finale card. The app supplies it; the engine owns no content. */
export interface InvitationContent {
  /** Guest's name from the invitation link (`?name=`); shown inside the opening card. */
  recipient?: string;
  eyebrow: string;
  /** Opening card only: "Đến dự tiệc thành hôn của hai con chúng tôi". */
  occasion?: string;
  /** Opening card only: the closing lines (a "
" starts a new line). */
  closing?: string;
  /** Opening card only: "Trân trọng", the last line. */
  signoff?: string;
  groom: string;
  bride: string;
  dateISO: string;
  dateLabel: string;
  timeLabel: string;
  lunarDate?: string;
  venueName: string;
  venueAddress: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  /** Shows a "placeholder content" note on the card. */
  isPlaceholder?: boolean;
}

interface Props {
  content: InvitationContent;
  rect: { left: number; top: number; width: number; height: number };
  layout: LayoutMode;
  /** Error fallback: render visible without the timeline. */
  staticMode?: boolean;
}

/**
 * Invitation text, laid out in real (unscaled) CSS pixels inside the finale's
 * text-safe area so it stays crisp and readable at any viewport size.
 * Elements marked `data-reveal` are staggered in by the master timeline.
 */
export const InvitationOverlay = forwardRef<HTMLHeadingElement, Props>(function InvitationOverlay(
  { content, rect, layout, staticMode },
  headingRef,
) {
  const { refs } = useStorybook();
  return (
    <div
      ref={refs.ref(refKeys.invite)}
      className={`sb-invite sb-invite--${layout}${staticMode ? ' is-static' : ''}`}
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
    >
      <div className="sb-invite__card">
        <p data-reveal className="sb-invite__eyebrow">
          {content.eyebrow}
        </p>
        <h1 data-reveal ref={headingRef} tabIndex={-1} className="sb-invite__names">
          <span>{content.groom}</span>
          <span className="sb-invite__amp"> &amp; </span>
          <span>{content.bride}</span>
        </h1>
        <p data-reveal className="sb-invite__date">
          <time dateTime={content.dateISO}>
            {content.timeLabel} · {content.dateLabel}
          </time>
          {content.lunarDate && <span className="sb-invite__lunar">{content.lunarDate}</span>}
        </p>
        <p data-reveal className="sb-invite__venue">
          <strong>{content.venueName}</strong>
          <span>{content.venueAddress}</span>
        </p>
        <div data-reveal className="sb-invite__actions">
          <a className="sb-btn sb-btn--primary" href={content.primaryAction.href}>
            {content.primaryAction.label}
          </a>
          {content.secondaryAction && (
            <a className="sb-btn sb-btn--ghost" href={content.secondaryAction.href}>
              {content.secondaryAction.label}
            </a>
          )}
        </div>
        {content.isPlaceholder && (
          <p data-reveal className="sb-invite__note">
            Nội dung mẫu (placeholder) — thay trong <code>src/content/wedding.ts</code>
          </p>
        )}
      </div>
    </div>
  );
});
