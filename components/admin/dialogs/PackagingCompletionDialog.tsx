'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { PackagingItem } from '@/lib/mockData'

interface Props {
  item: PackagingItem
  onCancel: () => void
  onConfirm: () => void
}

type BadgeInfo =
  | { type: 'split'; remaining: number }
  | { type: 'over'; excess: number }
  | null

export function PackagingCompletionDialog({ item, onCancel, onConfirm }: Props) {
  const [quantities, setQuantities] = useState<number[]>(
    item.productList.map(p => p.qty)
  )

  const isOptionPackage =
    item.packagingOption === '구성품만' || item.packagingOption === 'POB만'

  // 구성품만/POB만 옵션일 때 메인 항목(qty:0, 비POB) 과 서브 항목 구분
  const mainItemIndex = isOptionPackage
    ? item.productList.findIndex(p => p.qty === 0 && !p.isPob)
    : -1
  const mainItem = mainItemIndex >= 0 ? item.productList[mainItemIndex] : null

  // 표시 순서: 메인 항목 먼저, 그 다음 나머지
  const orderedIndices = isOptionPackage && mainItemIndex >= 0
    ? [
        mainItemIndex,
        ...item.productList.map((_, i) => i).filter(i => i !== mainItemIndex),
      ]
    : item.productList.map((_, i) => i)

  function updateQty(index: number, value: string) {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setQuantities(prev => prev.map((q, i) => (i === index ? num : q)))
    }
  }

  function getBadge(index: number): BadgeInfo {
    const originalQty = item.productList[index].qty
    const currentQty = quantities[index]
    if (currentQty === originalQty) return null
    if (currentQty < originalQty) return { type: 'split', remaining: originalQty - currentQty }
    return { type: 'over', excess: currentQty - originalQty }
  }

  const isMainRow = (index: number) => index === mainItemIndex && isOptionPackage
  const isSubRow = (index: number) => isOptionPackage && index !== mainItemIndex

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-default">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-default shrink-0">
        <h2 className="text-heading-lg text-fg-default">수량 확인 및 배분</h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg text-fg-subtle hover:text-fg-default hover:bg-bg-subtle transition-colors"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 📦 기본 패키지 #1 */}
        <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3 bg-bg-subtle border-b border-border-default">
            <span className="text-body-bold-md text-fg-default">📦 기본 패키지 #1</span>
            <span className="text-label-md text-fg-subtle">
              {item.packageCode} ({item.packageAlias})
            </span>
          </div>

          {/* Table header */}
          <div className="flex items-stretch border-b border-border-default bg-bg-subtle">
            {isOptionPackage && (
              <div className="w-[140px] shrink-0 px-3 py-2 border-r border-border-default flex items-center">
                <span className="text-label-md text-fg-subtle">패키징 옵션</span>
              </div>
            )}
            <div className="flex-1 px-4 py-2 flex items-center">
              <span className="text-label-md text-fg-subtle">상품명</span>
            </div>
            <div className="w-[180px] shrink-0 px-4 py-2 border-l border-border-default flex items-center justify-center">
              <span className="text-label-md text-fg-subtle">포장 수량</span>
            </div>
          </div>

          {/* Rows */}
          <div className="flex items-stretch">
            {/* 구성품만/POB만 옵션 레이블 (세로 병합처럼) */}
            {isOptionPackage && (
              <div className="w-[140px] shrink-0 border-r border-border-default flex flex-col items-center justify-center px-3 py-4 bg-bg-accent-brand2-subtlest">
                <div className="text-center">
                  <p className="text-body-bold-sm text-fg-default">{item.packagingOption}</p>
                  {item.packageList.filter(l => l !== item.packagingOption).map((label, i) => (
                    <p key={i} className="text-label-sm text-fg-subtle mt-0.5">{label}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Product rows */}
            <div className="flex-1 flex flex-col">
              {orderedIndices.map(index => {
                const product = item.productList[index]
                const badge = getBadge(index)
                const isSub = isSubRow(index)
                const isMain = isMainRow(index)
                const showGrayQty = isMain && !!product.preOptionQty

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-stretch border-b border-border-default last:border-b-0',
                      isSub && 'bg-bg-default',
                      isMain && 'bg-bg-default',
                    )}
                  >
                    {/* Product info cell */}
                    <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-0.5 min-w-0">
                      {/* Sub-row의 경우 상단에 부모 상품명 회색 작은 텍스트 */}
                      {isSub && mainItem && (
                        <p className="text-label-sm text-fg-subtle truncate">
                          {mainItem.name}
                        </p>
                      )}

                      <div className="flex items-center gap-1 flex-wrap">
                        {isSub && (
                          <span className="text-body-regular-md text-fg-subtle shrink-0">•</span>
                        )}
                        {product.isPob && !isSub && (
                          <Badge size="sm" color="brand1">POB</Badge>
                        )}
                        <span className={cn(
                          'text-body-regular-md text-fg-default',
                          isMain && 'font-semibold',
                        )}>
                          {product.name}
                        </span>

                        {/* / qty개 */}
                        <span className="text-body-regular-md shrink-0">
                          <span className="text-fg-subtle">{'/ '}</span>
                          <span className={cn(
                            'font-semibold',
                            isSub || product.isPob
                              ? 'text-fg-accent-brand1-default'
                              : 'text-fg-accent-brand2-default',
                          )}>
                            {quantities[index]}개
                          </span>
                        </span>

                        {/* (preOptionQty개) — 회색 원본 수량 */}
                        {showGrayQty && (
                          <span className="text-body-regular-md text-fg-subtle shrink-0">
                            ({product.preOptionQty}개)
                          </span>
                        )}

                        {/* 배지 */}
                        {badge?.type === 'split' && (
                          <Badge size="sm" type="round" color="yellow">
                            ✂️ 분할 포장 / {badge.remaining}개 남음
                          </Badge>
                        )}
                        {badge?.type === 'over' && (
                          <Badge size="sm" type="round" color="green">
                            요청 반영 / {badge.excess}개
                          </Badge>
                        )}
                        {badge === null && quantities[index] === 0 && product.qty > 0 && (
                          <Badge size="sm" type="round" color="yellow">미할당</Badge>
                        )}
                      </div>
                    </div>

                    {/* Qty input cell */}
                    <div className="w-[180px] shrink-0 px-4 py-3 border-l border-border-default flex items-center">
                      <input
                        type="number"
                        min={0}
                        value={quantities[index]}
                        onChange={e => updateQty(index, e.target.value)}
                        className="w-full h-8 px-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default text-center focus:outline-none focus:border-border-accent-brand1-default transition-colors"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 패키징 옵션 안내 */}
        {isOptionPackage && (
          <div className="mt-3 flex items-start gap-2 px-4 py-3 rounded-lg bg-bg-accent-brand2-subtlest border border-border-accent-brand2-subtlest">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-fg-accent-brand2-default shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r=".75" fill="currentColor" />
            </svg>
            <p className="text-label-md text-fg-accent-brand2-default">
              <span className="font-semibold">{item.packagingOption}</span> 옵션이 적용된 패키지입니다. 회색 괄호 수량은 옵션 적용 전 본품 수량입니다.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-border-default bg-bg-default">
        <Button size="xl" variant="outline" color="default" onClick={onCancel}>
          취소
        </Button>
        <Button size="xl" color="brand1" onClick={onConfirm}>
          완료 처리
        </Button>
      </div>
    </div>
  )
}
