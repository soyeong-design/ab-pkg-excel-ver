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

function getBadge(originalQty: number, currentQty: number): BadgeInfo {
  if (currentQty === originalQty) return null
  if (currentQty < originalQty) return { type: 'split', remaining: originalQty - currentQty }
  return { type: 'over', excess: currentQty - originalQty }
}

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

// ─── ADM 테이블 스타일 행 컴포넌트 ─────────────────────────────────────────────

function AdmRow({ label, children, noBorder }: { label: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={cn('flex items-stretch', !noBorder && 'border-b border-border-default')}>
      <div className="w-[100px] shrink-0 bg-bg-subtle border-r border-border-default flex items-start px-4 py-4">
        <span className="text-label-bold-sm text-fg-default leading-5 break-keep">{label}</span>
      </div>
      <div className="flex-1 px-4 py-3 bg-bg-default min-w-0">
        {children}
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function PackagingCompleteContent({ request }: Props) {
  const router = useRouter()

  const [qtys, setQtys] = useState<PackageQtys>(() =>
    Object.fromEntries(request.packages.map((pkg, i) => [i, pkg.productList.map(p => p.qty)]))
  )
  const [albumQty, setAlbumQty] = useState('')
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

  // 구성품만 / POB만 옵션이 있는 패키지 목록 (infobox 표시용)
  const optionPackages = request.packages.filter(
    pkg => pkg.packagingOption === '구성품만' || pkg.packagingOption === 'POB만'
  )

  // 미할당 상품 존재 여부 (qty가 0인데 원본은 0보다 큰 경우)
  const hasUnassigned = request.packages.some((pkg, pkgIdx) =>
    pkg.productList.some((p, prodIdx) => {
      const cur = qtys[pkgIdx]?.[prodIdx] ?? p.qty
      return cur === 0 && p.qty > 0
    })
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* ── 패키징 기본 정보 입력 ── */}
        <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
          {/* 카드 헤더 */}
          <div className="px-4 py-3 border-b border-border-default">
            <h2 className="text-[18px] font-bold text-fg-default leading-7 tracking-tight">패키징 기본 정보 입력</h2>
          </div>

          {/* 패키지 ID 서브 헤더 */}
          <div className="px-4 py-2 bg-bg-subtle border-b border-border-default">
            <span className="text-label-bold-sm text-fg-accent-brand1-default">{request.requestId}</span>
          </div>

          {/* 이미지 / 비디오 업로드 (2열) */}
          <div className="flex border-b border-border-default">
            <div className="flex-1 flex flex-col border-r border-border-default">
              <div className="bg-bg-subtle border-b border-border-default px-4 py-3">
                <span className="text-label-bold-sm text-fg-default">이미지 업로드</span>
              </div>
              <UploadArea label="여기로 파일을 드래그하거나 업로드하세요." />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="bg-bg-subtle border-b border-border-default px-4 py-3 flex items-center gap-2">
                <span className="text-label-bold-sm text-fg-default">비디오 업로드</span>
                <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
              </div>
              <UploadArea label="여기로 파일을 드래그하거나 업로드하세요." />
            </div>
          </div>

          {/* 매입 앨범 수량 */}
          <AdmRow label="매입 앨범 수량">
            <input
              value={albumQty}
              onChange={e => setAlbumQty(e.target.value)}
              placeholder="매입될 앨범 수량을 입력해주세요"
              className="w-full h-10 px-4 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
            />
          </AdmRow>

          {/* 유저 안내 메세지 */}
          <AdmRow label="유저 안내 메세지">
            <input
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              placeholder="해당 내용은 유저에게 안내되므로 영어로 작성해주세요"
              className="w-full h-10 px-4 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
            />
          </AdmRow>

          {/* 관리자 기록용 메모 */}
          <AdmRow label="관리자 기록용 메모" noBorder>
            <textarea
              value={adminMemo}
              onChange={e => setAdminMemo(e.target.value)}
              placeholder="해당 내용은 관리자용으로만 기록됩니다"
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default resize-none"
            />
          </AdmRow>
        </div>

        {/* ── 작업 정보 입력 ── */}
        <div className="space-y-3">
          {/* 작업 정보 헤더 */}
          <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h2 className="text-[18px] font-bold text-fg-default leading-7 tracking-tight">작업 정보 입력</h2>
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-label-md text-fg-default hover:bg-bg-subtle transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                패키지 추가하기
              </button>
            </div>

            {/* 구성품만 / POB만 옵션 infobox */}
            {optionPackages.map((pkg, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 bg-bg-accent-brand1-subtlest border-b border-border-accent-brand1-subtlest last:border-b-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-fg-accent-brand1-default shrink-0 mt-0.5" aria-hidden="true">
                  <path d="M8 2.5L14.5 13.5H1.5L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11" r=".75" fill="currentColor" />
                </svg>
                <div className="min-w-0">
                  <p className="text-label-bold-sm text-fg-accent-brand1-default">
                    {pkg.packagingOption} 옵션이 포함된 패키지입니다
                  </p>
                  <p className="text-label-sm text-fg-subtle mt-0.5">
                    {pkg.packageList.join(' / ')}
                    {pkg.userNote ? ` / 추가 요청사항 / ${pkg.userNote}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 📦 기본 패키지 카드 */}
          <PackageWorkCard
            packages={request.packages}
            qtys={qtys}
            hasUnassigned={hasUnassigned}
            onUpdateQty={updateQty}
          />
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

// ─── 파일 업로드 영역 ──────────────────────────────────────────────────────────

function UploadArea({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 p-4 min-h-[120px]">
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-default bg-bg-default hover:bg-bg-subtle transition-colors shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <p className="text-body-regular-md text-fg-subtlest">
        여기로 파일을{' '}
        <span className="font-bold text-fg-subtle">드래그</span>
        하거나{' '}
        <span className="font-bold text-fg-subtle">업로드</span>
        하세요.
      </p>
    </div>
  )
}

// ─── 📦 기본 패키지 작업 카드 ─────────────────────────────────────────────────

interface PackageWorkCardProps {
  packages: SubPackage[]
  qtys: PackageQtys
  hasUnassigned: boolean
  onUpdateQty: (pkgIdx: number, prodIdx: number, value: string) => void
}

function PackageWorkCard({ packages, qtys, hasUnassigned, onUpdateQty }: PackageWorkCardProps) {
  return (
    <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
      {/* 카드 헤더 */}
      <div className="px-4 py-3 bg-bg-subtle border-b border-border-default">
        <span className="text-body-bold-md text-fg-default">📦 기본 패키지 #1</span>
      </div>

      {/* 패키지 번호 정보 행 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-bg-default border-b border-border-default">
        <span className="text-label-bold-sm text-fg-default">📦 패키지 #1 번호</span>
        <span className="w-px h-4 bg-border-default" />
        <span className="text-label-sm text-fg-subtle font-mono">
          {packages[0]?.packageCode ?? '—'} ({packages[0]?.packageAlias ?? '—'})
        </span>
      </div>

      {/* 미할당 경고 */}
      {hasUnassigned && (
        <div className="flex items-start gap-3 mx-4 my-3 px-4 py-3 rounded-lg bg-bg-accent-yellow-subtlest border border-border-accent-yellow-subtlest">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-fg-accent-yellow-default shrink-0 mt-0.5" aria-hidden="true">
            <path d="M8 2.5L14.5 13.5H1.5L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r=".75" fill="currentColor" />
          </svg>
          <p className="text-body-regular-sm text-fg-accent-yellow-default">
            미할당 상품이 포함된 패키지가 있습니다. 아래 해당하는 상품 수량을 배분해 주세요.
          </p>
        </div>
      )}

      {/* 패키지 입력 정보 */}
      <PackageInfoSection />

      {/* 패키지 내 상품 목록 테이블 */}
      <ProductTable
        packages={packages}
        qtys={qtys}
        onUpdateQty={onUpdateQty}
      />
    </div>
  )
}

// ─── 박스번호·봉투·파킹 등 입력 섹션 ──────────────────────────────────────────

function PackageInfoSection() {
  const [boxNum, setBoxNum] = useState('')
  const [leftRight, setLeftRight] = useState('')
  const [itemCount, setItemCount] = useState('')
  const [sizeInfo, setSizeInfo] = useState('')
  const [parkingQty, setParkingQty] = useState('')
  const [envelopeQty, setEnvelopeQty] = useState('1')
  const [boxQty, setBoxQty] = useState('')

  const inputCls = 'flex-1 h-9 px-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-sm text-fg-default focus:outline-none focus:border-border-accent-brand1-default'
  const labelCls = 'text-label-sm text-fg-subtle shrink-0'

  return (
    <div className="p-4 border-b border-border-default space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <span className={cn(labelCls, 'w-14')}>박스번호</span>
          <input value={boxNum} onChange={e => setBoxNum(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(labelCls, 'w-10')}>우/좌등</span>
          <input value={leftRight} onChange={e => setLeftRight(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(labelCls, 'w-16')}>파악정보 수량</span>
          <input value={itemCount} onChange={e => setItemCount(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(labelCls, 'w-16')}>사이즈 정보</span>
        <input value={sizeInfo} onChange={e => setSizeInfo(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-sm text-fg-default focus:outline-none focus:border-border-accent-brand1-default" />
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={labelCls}>파킹(선)</span>
          <input value={parkingQty} onChange={e => setParkingQty(e.target.value)}
            className="w-16 h-9 px-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-sm text-fg-default focus:outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className={labelCls}>봉투(선)</span>
          <input value={envelopeQty} onChange={e => setEnvelopeQty(e.target.value)}
            className="w-16 h-9 px-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-sm text-fg-default focus:outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className={labelCls}>박스(선)</span>
          <input value={boxQty} onChange={e => setBoxQty(e.target.value)}
            className="w-16 h-9 px-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-sm text-fg-default focus:outline-none" />
        </div>
      </div>
    </div>
  )
}

// ─── 상품 목록 테이블 ─────────────────────────────────────────────────────────

interface ProductTableProps {
  packages: SubPackage[]
  qtys: PackageQtys
  onUpdateQty: (pkgIdx: number, prodIdx: number, value: string) => void
}

function ProductTable({ packages, qtys, onUpdateQty }: ProductTableProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
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
            <div className="w-[110px] shrink-0 px-3 py-2 border-r border-border-default flex items-center">패키지 옵션</div>
            <div className="w-[140px] shrink-0 px-3 py-2 border-r border-border-default flex items-center">패키지 및 패키지 번호</div>
            <div className="flex-1 px-3 py-2 border-r border-border-default flex items-center">패키지 내 상품 목록</div>
            <div className="w-[120px] shrink-0 px-3 py-2 flex items-center justify-center">포장 수량</div>
          </div>

          {/* Rows */}
          {packages.map((pkg, pkgIdx) => {
            const isOptionPkg = pkg.packagingOption === '구성품만' || pkg.packagingOption === 'POB만'
            const mainIdx = isOptionPkg
              ? pkg.productList.findIndex(p => p.qty === 0 && !p.isPob)
              : -1
            const mainProduct = mainIdx >= 0 ? pkg.productList[mainIdx] : null
            const orderedIndices = isOptionPkg && mainIdx >= 0
              ? [mainIdx, ...pkg.productList.map((_, i) => i).filter(i => i !== mainIdx)]
              : pkg.productList.map((_, i) => i)

            return (
              <div key={pkgIdx} className="flex items-stretch border-b border-border-default last:border-b-0">
                {/* 패키지 옵션 */}
                <div className={cn(
                  'w-[110px] shrink-0 border-r border-border-default flex flex-col items-center justify-center px-2 py-3 text-center',
                  pkg.packagingOption === '구성품만' && 'bg-bg-accent-brand2-subtlest',
                  pkg.packagingOption === 'POB만' && 'bg-bg-accent-brand1-subtlest',
                )}>
                  <p className="text-body-bold-sm text-fg-default">{pkg.packagingOption}</p>
                  {pkg.packageList.filter(l => l !== pkg.packagingOption).slice(0, 1).map((l, i) => (
                    <p key={i} className="text-label-sm text-fg-subtle mt-0.5 leading-tight">{l}</p>
                  ))}
                </div>

                {/* 패키지 코드 */}
                <div className="w-[140px] shrink-0 border-r border-border-default flex flex-col items-center justify-center px-2 py-3 text-center">
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
