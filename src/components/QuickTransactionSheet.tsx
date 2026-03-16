'use client';

import { ArrowLeft, X } from 'lucide-react';
import { useState } from 'react';
import QuickAddComposer from '@/components/QuickAddComposer';
import TransactionForm, { type TransactionFormPrefill } from '@/components/TransactionForm';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

interface QuickTransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickTransactionSheet({
  open,
  onClose,
}: QuickTransactionSheetProps) {
  const { t } = useLanguage();
  const [reviewDraft, setReviewDraft] = useState<TransactionFormPrefill | null>(null);
  const title = reviewDraft ? t('dashboard.quickAdd.reviewTitle') : t('dashboard.quickAdd.sheetTitle');

  const handleClose = () => {
    setReviewDraft(null);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? handleClose() : null)}>
      <SheetContent side="bottom" hideClose className="max-w-[36rem] rounded-t-[var(--radius-sheet)] px-4 pb-5 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {reviewDraft ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setReviewDraft(null)}
                aria-label={t('dashboard.quickAdd.backToQuickAdd')}
                className="h-9 w-9 shrink-0"
              >
                <ArrowLeft size={18} />
              </Button>
            ) : null}
            <SheetTitle className="truncate text-base">{title}</SheetTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label={t('nav.closeSheet')}
              className="h-9 w-9"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
        {reviewDraft ? (
          <TransactionForm
            initialValues={reviewDraft}
            createSource="quick_add"
            onSuccess={() => {
              setReviewDraft(null);
              handleClose();
            }}
            onCancel={() => setReviewDraft(null)}
            variant="sheet"
          />
        ) : (
          <QuickAddComposer
            variant="sheet"
            onReview={(draft) => setReviewDraft(draft)}
            onSaved={() => {
              setReviewDraft(null);
              handleClose();
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
