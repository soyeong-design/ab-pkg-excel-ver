'use client'

import { Button } from '@/components/ui/Button'

interface Props {
  packageCode: string
  onCancel: () => void
  onConfirm: () => void
}

export function CancelPackagingDialog({ packageCode, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-blanket" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-bg-default rounded-2xl shadow-overlay w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <span className="text-heading-md text-fg-default">패키징 요청 취소</span>
          <button
            onClick={onCancel}
            className="text-fg-subtle hover:text-fg-default transition-colors p-1 rounded-lg hover:bg-bg-subtle"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-body-regular-lg text-fg-default">
            <strong className="font-semibold">{packageCode}</strong>가 요청 취소됩니다.
          </p>
          <p className="text-body-regular-lg text-fg-default mt-1">
            패키징 요청을 취소하시겠어요?
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border-default">
          <Button size="lg" variant="outline" color="default" onClick={onCancel}>취소</Button>
          <Button size="lg" color="red" onClick={onConfirm}>패키징 요청 취소</Button>
        </div>
      </div>
    </div>
  )
}
