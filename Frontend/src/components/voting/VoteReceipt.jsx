import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateTime } from '../../utils/format.js';
import { Button } from '../common/Button.jsx';

/** Confirmation shown after a vote (and when reopening an event the user already voted in). */
export function VoteReceipt({ heading, label, title, receiptCode, votedAt, backTo, backLabel, alreadyVoted = false }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  return (
    <div className="vote-success">
      <motion.div
        className="vote-success__check"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <span>
          <Check aria-hidden="true" />
        </span>
      </motion.div>
      <h1>{heading ?? (alreadyVoted ? t('vote.alreadyVotedTitle') : t('vote.successTitle'))}</h1>
      <p>{alreadyVoted ? t('vote.alreadyVotedText') : t('vote.successText')}</p>
      <dl className="receipt">
        <div>
          <dt>{label ?? t('vote.receiptEvent')}</dt>
          <dd>{title}</dd>
        </div>
        <div>
          <dt>{t('vote.receiptId')}</dt>
          <dd className="ltr">#{receiptCode}</dd>
        </div>
        <div className="span-2">
          <dt>{t('vote.receiptDate')}</dt>
          <dd>{formatDateTime(votedAt ?? new Date(), lang)}</dd>
        </div>
      </dl>
      <p className="muted sm" style={{ marginBottom: 20 }}>{t('vote.receiptPrivacy')}</p>
      <Button variant="primary" size="lg" block to={backTo}>
        {backLabel}
      </Button>
    </div>
  );
}
