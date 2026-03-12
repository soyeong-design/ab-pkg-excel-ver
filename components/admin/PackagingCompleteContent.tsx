'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { PackagingRequest, SubPackage, ProductItem } from '@/lib/mockData'

interface Props {
  request: PackagingRequest
}

type BadgeInfo =
  | { type: 'split'; remaining: number }
  | { type: 'over'; excess: number }
  | null

// qty 변경 시 배지 계산
function getBadge(originalQty: number, currentQty: number): BadgeInfo {
  if (currentQty === originalQty) return null
  if (currentQty < originalQty) return { type: 'split', remaining: originalQty - currentQty }
  return { type: 'over', excess: currentQty - originalQty }
}

// 패키징 옵션으로 qty가 0이 된 본품인지 확인
function isOptionZeroed(pkg: SubPackage, product: ProductItem): boolean {
  return (
    (pkg.packagingOption === '구성품만' || pkg.packagingOption === 'POB만') &&
    !product.isPob &&
    product.qty === 0
  )
}

interface PackageQtys {
  [pkgIndex: number]: number[]
}

export function PackagingCompleteContent({ request }: Props) {
  const router = useRouter()

  // 패키지별 수량 state (pkgIndex → qty 배열)
  const [qtys, setQtys] = useState<PackageQtys>(() =>
    Object.fromEntries(request.packages.map((pkg, i) => [i, pkg.productList.map(p => p.qty)]))
  )

  // 기본 정보 state
  const [idCode, setIdCode] = useState('')
  const [barcodeNum, setBarcodeNum] = useState('')
  const [shippingNote, setShippingNote] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [adminMemo, setAdminMemo] = useState(request.adminMemo)

  function updateQty(pkgIdx: number, prodIdx: number, value: string) {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setQtys(prev => ({
        ...prev,
        [pkgIdx]: prev[pkgIdx].map((q, i) => (i === prodIdx ? num : q)),
      }))
    }
  }

  // 미할당 상품 존재 여부
  const hasUnassigned = request.packages.some(pkg =>
    pkg.productList.some(p => p.qty > 0)
  )

  return (
    <>
      {/* Page header */}
      <div className="border-b border-border-default bg-bg-default px-6 py-4 shrink-0">
        <Link
          href="/packaging?tab=started"
          className="inline-flex items-center gap-1 text-label-md text-fg-subtle hover:text-fg-default transition-colors mb-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          목록으로 돌아가기
        </Link>
        <h1 className="text-heading-lg text-fg-default">패키징 완료 처리</h1>
        <p className="text-label-md text-fg-subtle mt-0.5">{request.requestId} · {request.userId}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ── 왼쪽: 패키징 기본 정보 입력 ── */}
          <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
            <div className="px-5 py-4 border-b border-border-default">
              <h2 className="text-heading-md text-fg-default">패키징 기본 정보 입력</h2>
            </div>

            <div className="p-5 space-y-5">
              {/* 아이디코드 + 바코드 번호 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-md text-fg-subtle">아이디코드</label>
                  <input
                    value={idCode}
                    onChange={e => setIdCode(e.target.value)}
                    placeholder="아이디코드 입력"
                    className="w-full h-9 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-fg-subtle">바코드 번호</label>
                  <div className="flex gap-2">
                    <input
                      value={barcodeNum}
                      onChange={e => setBarcodeNum(e.target.value)}
                      placeholder="바코드 번호 입력"
                      className="flex-1 h-9 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
                    />
                  </div>
                </div>
              </div>

              {/* 패키지 연결 버튼 */}
              <div className="flex gap-2">
                <button className="flex items-center gap-1 h-9 px-3 rounded-lg border border-border-default bg-bg-default text-label-md text-fg-subtle hover:bg-bg-subtle transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  이 코드로 패키지
                </button>
                <button className="flex items-center gap-1 h-9 px-3 rounded-lg border border-border-default bg-bg-default text-label-md text-fg-subtle hover:bg-bg-subtle transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  저 코드로 패키지
                </button>
              </div>

              {/* 배송 정보 입력 */}
              <div className="space-y-1.5">
                <label className="text-label-md text-fg-subtle">배송 정보 입력</label>
                <textarea
                  value={shippingNote}
                  onChange={e => setShippingNote(e.target.value)}
                  rows={3}
                  placeholder="배송 정보를 입력하세요"
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default resize-none"
                />
              </div>

              {/* 유저 안내 메세지 */}
              <div className="space-y-1.5">
                <label className="text-label-md text-fg-subtle">유저 안내 메세지</label>
                <textarea
                  value={userMessage}
                  onChange={e => setUserMessage(e.target.value)}
                  rows={3}
                  placeholder="유저에게 전달할 안내 메세지를 입력하세요"
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default resize-none"
                />
              </div>

              {/* 관리자 기록용 메모 */}
              <div className="space-y-1.5">
                <label className="text-label-md text-fg-subtle">관리자 기록용 메모</label>
                <textarea
                  value={adminMemo}
                  onChange={e => setAdminMemo(e.target.value)}
                  rows={3}
                  placeholder="관리자 메모를 입력하세요"
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── 오른쪽: 작업 정보 입력 ── */}
          <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
            <div className="px-5 py-4 border-b border-border-default">
              <h2 className="text-heading-md text-fg-default">작업 정보 입력</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* 미할당 경고 */}
              {hasUnassigned && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-bg-accent-yellow-subtlest border border-border-accent-yellow-subtlest">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-fg-accent-yellow-default shrink-0 mt-0.5" aria-hidden="true">
                    <path d="M8 2.5L14.5 13.5H1.5L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r=".75" fill="currentColor" />
                  </svg>
                  <p className="text-body-regular-md text-fg-accent-yellow-default">
                    미할당 상품이 포함된 패키지가 있습니다.
                  </p>
                </div>
              )}

              {/* 📦 기본 패키지 #1 섹션 정보 (박스번호, 봉투, 파킹 등) */}
              <PackageInfoSection />

              {/* 패키지 내 상품 목록 테이블 */}
              <ProductTable
                packages={request.packages}
                qtys={qtys}
                onUpdateQty={updateQty}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 sticky bottom-0 bg-bg-default border-t border-border-default px-6 py-4">
        <div className="flex justify-end gap-3">
          <Link href="/packaging?tab=started">
            <Button size="xl" variant="outline" color="default">취소</Button>
          </Link>
          <Button size="xl" color="brand1" onClick={() => router.push('/packaging?tab=completed')}>
            완료
          </Button>
        </div>
      </div>
    </>
  )
}

// ── 박스번호·봉투·파킹 등 입력 섹션 ──────────────────────────────────────────

function PackageInfoSection() {
  const [boxNum, setBoxNum] = useState('')
  const [leftRight, setLeftRight] = useState('')
  const [itemCount, setItemCount] = useState('')
  const [sizeInfo, setSizeInfo] = useState('')
  const [parkingQty, setParkingQty] = useState('')
  const [envelopeQty, setEnvelopeQty] = useState('1')
  const [boxQty, setBoxQty] = useState('')

  return (
    <div className="rounded-lg border border-border-default overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-bg-subtle border-b border-border-default">
        <span className="text-body-bold-md text-fg-default">📦 기본 패키지 #1</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-label-md text-fg-subtle w-16 shrink-0">박스번호</span>
            <input
              value={boxNum}
              onChange={e => setBoxNum(e.target.value)}
              className="flex-1 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default focus:outline-none focus:border-border-accent-brand1-default"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-md text-fg-subtle w-12 shrink-0">우/좌등</span>
            <input
              value={leftRight}
              onChange={e => setLeftRight(e.target.value)}
              className="flex-1 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default focus:outline-none focus:border-border-accent-brand1-default"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-label-md text-fg-subtle w-16 shrink-0">파악정보 수량</span>
            <input
              value={itemCount}
              onChange={e => setItemCount(e.target.value)}
              className="flex-1 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default focus:outline-none focus:border-border-accent-brand1-default"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-md text-fg-subtle w-16 shrink-0">사이즈 정보</span>
            <input
              value={sizeInfo}
              onChange={e => setSizeInfo(e.target.value)}
              className="flex-1 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default focus:outline-none focus:border-border-accent-brand1-default"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-label-md text-fg-subtle">파킹(선)</span>
            <input value={parkingQty} onChange={e => setParkingQty(e.target.value)}
              className="w-16 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-md text-fg-subtle">봉투(선)</span>
            <input value={envelopeQty} onChange={e => setEnvelopeQty(e.target.value)}
              className="w-16 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-md text-fg-subtle">박스(선)</span>
            <input value={boxQty} onChange={e => setBoxQty(e.target.value)}
              className="w-16 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-body-regular-md text-fg-default focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 상품 목록 테이블 ─────────────────────────────────────────────────────────

interface ProductTableProps {
  packages: SubPackage[]
  qtys: PackageQtys
  onUpdateQty: (pkgIdx: number, prodIdx: number, value: string) => void
}

function ProductTable({ packages, qtys, onUpdateQty }: ProductTableProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="rounded-lg border border-border-default overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-subtle border-b border-border-default hover:bg-bg-subtle/80 transition-colors"
      >
        <span className="text-body-bold-md text-fg-default">패키지 내 상품 목록</span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={cn('text-fg-subtle transition-transform', collapsed && 'rotate-180')}
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!collapsed && (
        <>
          {/* Table header */}
          <div className="flex items-stretch border-b border-border-default bg-bg-subtle text-label-md text-fg-subtle">
            <div className="w-[100px] shrink-0 px-3 py-2 border-r border-border-default flex items-center">
              패키지 옵션
            </div>
            <div className="w-[130px] shrink-0 px-3 py-2 border-r border-border-default flex items-center">
              패키지 및 패키지 번호
            </div>
            <div className="flex-1 px-3 py-2 border-r border-border-default flex items-center">
              패키지 내 상품 목록
            </div>
            <div className="w-[120px] shrink-0 px-3 py-2 flex items-center justify-center">
              포장 수량
            </div>
          </div>

          {/* Rows grouped by package */}
          {packages.map((pkg, pkgIdx) => {
            const isOptionPkg = pkg.packagingOption === '구성품만' || pkg.packagingOption === 'POB만'
            // 메인 행(qty:0, 비POB) 인덱스 찾기
            const mainIdx = isOptionPkg
              ? pkg.productList.findIndex(p => p.qty === 0 && !p.isPob)
              : -1
            const mainProduct = mainIdx >= 0 ? pkg.productList[mainIdx] : null
            // 표시 순서: 메인 먼저
            const orderedIndices = isOptionPkg && mainIdx >= 0
              ? [mainIdx, ...pkg.productList.map((_, i) => i).filter(i => i !== mainIdx)]
              : pkg.productList.map((_, i) => i)

            return (
              <div key={pkgIdx} className="flex items-stretch border-b border-border-default last:border-b-0">
                {/* 패키지 옵션 (세로 병합) */}
                <div className={cn(
                  'w-[100px] shrink-0 border-r border-border-default flex flex-col items-center justify-center px-2 py-3 text-center',
                  pkg.packagingOption === '합포장' && 'bg-bg-default',
                  pkg.packagingOption === '구성품만' && 'bg-bg-accent-brand2-subtlest',
                  pkg.packagingOption === 'POB만' && 'bg-bg-accent-brand1-subtlest',
                )}>
                  <p className="text-body-bold-sm text-fg-default">{pkg.packagingOption}</p>
                  {pkg.packageList.filter(l => l !== pkg.packagingOption).slice(0, 1).map((l, i) => (
                    <p key={i} className="text-label-sm text-fg-subtle mt-0.5 leading-tight">{l}</p>
                  ))}
                </div>

                {/* 패키지 코드 (세로 병합) */}
                <div className="w-[130px] shrink-0 border-r border-border-default flex flex-col items-center justify-center px-2 py-3 text-center">
                  <p className="text-body-bold-sm text-fg-default font-mono">{pkg.packageCode}</p>
                  <p className="text-label-sm text-fg-subtle">({pkg.packageAlias})</p>
                </div>

                {/* 상품 행들 */}
                <div className="flex-1 flex flex-col">
                  {orderedIndices.map(prodIdx => {
                    const product = pkg.productList[prodIdx]
                    const currentQty = qtys[pkgIdx]?.[prodIdx] ?? product.qty
                    const badge = getBadge(product.qty, currentQty)
                    const zeroed = isOptionZeroed(pkg, product)
                    const isSub = isOptionPkg && prodIdx !== mainIdx

                    return (
                      <div
                        key={prodIdx}
                        className="flex items-stretch border-b border-border-default last:border-b-0"
                      >
                        {/* 상품명 + qty */}
                        <div className="flex-1 px-3 py-2.5 border-r border-border-default flex flex-col justify-center gap-0.5 min-w-0">
                          {isSub && mainProduct && (
                            <p className="text-label-sm text-fg-subtle truncate leading-tight">{mainProduct.name}</p>
                          )}
                          <div className="flex items-center gap-1 flex-wrap">
                            {isSub && <span className="text-body-regular-sm text-fg-subtle shrink-0">•</span>}
                            {product.isPob && !isSub && <Badge size="sm" color="brand1">POB</Badge>}
                            <span className={cn(
                              'text-body-regular-sm text-fg-default',
                              !isSub && 'font-semibold',
                            )}>
                              {product.name}
                            </span>
                            <span className="text-body-regular-sm shrink-0">
                              <span className="text-fg-subtle">{'/ '}</span>
                              <span className={cn(
                                'font-semibold',
                                isSub || product.isPob
                                  ? 'text-fg-accent-brand1-default'
                                  : 'text-fg-accent-brand2-default',
                              )}>
                                {currentQty}개
                              </span>
                            </span>
                            {zeroed && product.preOptionQty != null && (
                              <span className="text-body-regular-sm text-fg-subtle shrink-0">
                                ({product.preOptionQty}개)
                              </span>
                            )}
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
                            {badge === null && currentQty === 0 && product.qty > 0 && (
                              <Badge size="sm" type="round" color="yellow">미할당</Badge>
                            )}
                          </div>
                        </div>

                        {/* 포장 수량 입력 */}
                        <div className="w-[120px] shrink-0 px-3 py-2 flex items-center justify-center">
                          <input
                            type="number"
                            min={0}
                            value={currentQty}
                            onChange={e => onUpdateQty(pkgIdx, prodIdx, e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-border-default bg-bg-subtle text-body-regular-sm text-fg-default text-center focus:outline-none focus:border-border-accent-brand1-default transition-colors"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
