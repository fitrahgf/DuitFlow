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
      <SheetContent
        side="bottom"
        hideClose
        data-testid="quick-transaction-sheet"
        className="max-w-[34rem] rounded-t-[var(--radius-sheet)] px-3.5 pb-[calc(0.85rem+var(--safe-bottom))] pt-2.5"
      >
        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-border-strong" />
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-border-subtle/75 pb-2">
          <div className="flex min-w-0 items-center gap-2">
            {reviewDraft ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setReviewDraft(null)}
                aria-label={t('dashboard.quickAdd.backToQuickAdd')}
                className="h-[2.375rem] w-[2.375rem] shrink-0"
              >
                <ArrowLeft size={18} />
              </Button>
            ) : null}
            <SheetTitle className="truncate text-[0.94rem] tracking-[-0.04em]">{title}</SheetTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label={t('nav.closeSheet')}
              className="h-[2.375rem] w-[2.375rem]"
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
