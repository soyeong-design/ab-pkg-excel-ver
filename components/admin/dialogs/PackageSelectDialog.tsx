'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ADDITIONAL_PACKAGES } from '@/lib/mockData'

interface Props {
  onCancel: () => void
  onSelect: (pkgId: string) => void
}

export function PackageSelectDialog({ onCancel, onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-blanket" onClick={onCancel} />

      <div className="relative bg-bg-default rounded-2xl shadow-overlay w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <span className="text-heading-md text-fg-default">할당 패키지 선택</span>
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
        <div className="px-6 py-5 space-y-3">
          <p className="text-body-regular-md text-fg-subtle mb-4">상품을 포장한 패키지를 선택해주세요</p>

          {ADDITIONAL_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => setSelected(pkg.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                selected === pkg.id
                  ? 'border-border-accent-brand1-default bg-bg-accent-brand1-subtlest'
                  : 'border-border-default hover:bg-bg-subtle'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selected === pkg.id ? 'border-fg-accent-brand1-default' : 'border-border-default'
                }`}>
                  {selected === pkg.id && (
                    <div className="w-2 h-2 rounded-full bg-fg-accent-brand1-default" />
                  )}
                </div>
                <span className="text-body-regular-md text-fg-default">{pkg.label}</span>
              </div>
              {pkg.selected && (
                <Badge size="sm" color="brand1">선택</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border-default">
          <Button size="lg" variant="outline" color="default" onClick={onCancel}>취소</Button>
          <Button size="lg" color="brand1" isDisabled={!selected} onClick={() => selected && onSelect(selected)}>
            선택하기
          </Button>
        </div>
      </div>
    </div>
  )
}
