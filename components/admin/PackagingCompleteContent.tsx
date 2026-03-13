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

interface PackageQtys {
  [pkgIndex: number]: number[]
}

interface AddedPkg {
  id: number
  qtys: PackageQtys
}

// ─── ADM 테이블 스타일 행 ──────────────────────────────────────────────────────

function AdmRow({ label, required, children, noBorder }: {
  label: string
  required?: boolean
  children: React.ReactNode
  noBorder?: boolean
}) {
  return (
    <div className={cn('flex items-stretch', !noBorder && 'border-b border-border-default')}>
      <div className="w-[100px] shrink-0 bg-bg-subtle border-r border-border-default flex items-start px-4 py-4 gap-1">
        <span className="text-label-bold-sm text-fg-default leading-5 break-keep">{label}</span>
        {required && <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0 mt-1" />}
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

  // 각 패키지·상품의 포장 수량 state (초기값 = 요청 수량과 동일)
  const [qtys, setQtys] = useState<PackageQtys>(() =>
    Object.fromEntries(request.packages.map((pkg, i) => [i, pkg.productList.map(p => p.qty)]))
  )
  const [albumQty, setAlbumQty] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [adminMemo, setAdminMemo] = useState(request.adminMemo)
  const [addedPkgs, setAddedPkgs] = useState<AddedPkg[]>([])

  function updateQty(pkgIdx: number, prodIdx: number, value: string) {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setQtys(prev => ({
        ...prev,
        [pkgIdx]: prev[pkgIdx].map((q, i) => (i === prodIdx ? num : q)),
      }))
    }
  }

  function handleAddPackage() {
    const initQtys: PackageQtys = {}
    request.packages.forEach((pkg, pkgIdx) => {
      initQtys[pkgIdx] = pkg.productList.map((prod, prodIdx) => {
        const baseQty = qtys[pkgIdx]?.[prodIdx] ?? prod.qty
        return Math.max(0, prod.qty - baseQty)
      })
    })
    setAddedPkgs(prev => [...prev, { id: Date.now(), qtys: initQtys }])
  }

  function updateAddedQty(addedId: number, pkgIdx: number, prodIdx: number, value: string) {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setAddedPkgs(prev => prev.map(ap =>
        ap.id !== addedId ? ap : {
          ...ap,
          qtys: { ...ap.qtys, [pkgIdx]: ap.qtys[pkgIdx].map((q, i) => i === prodIdx ? num : q) },
        }
      ))
    }
  }

  // 구성품만 / POB만 옵션 패키지 → 핑크 infobox
  const optionPackages = request.packages.filter(
    pkg => pkg.packagingOption === '구성품만' || pkg.packagingOption === 'POB만'
  )

  // 미할당 여부: 현재 포장 수량이 0이지만 원본 요청 수량이 0보다 큰 경우
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
          <div className="px-4 py-3 border-b border-border-default">
            <h2 className="text-[18px] font-bold text-fg-default leading-7 tracking-tight">패키징 기본 정보 입력</h2>
          </div>
          <div className="px-4 py-2 bg-bg-subtle border-b border-border-default">
            <span className="text-label-bold-sm text-fg-accent-brand1-default">{request.requestId}</span>
          </div>

          {/* 이미지 / 비디오 업로드 */}
          <div className="flex border-b border-border-default">
            <div className="flex-1 flex flex-col border-r border-border-default">
              <div className="bg-bg-subtle border-b border-border-default px-4 py-3">
                <span className="text-label-bold-sm text-fg-default">이미지 업로드</span>
              </div>
              <UploadArea />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="bg-bg-subtle border-b border-border-default px-4 py-3 flex items-center gap-2">
                <span className="text-label-bold-sm text-fg-default">비디오 업로드</span>
                <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
              </div>
              <UploadArea />
            </div>
          </div>

          <AdmRow label="매입 앨범 수량">
            <input
              value={albumQty}
              onChange={e => setAlbumQty(e.target.value)}
              placeholder="매입될 앨범 수량을 입력해주세요"
              className="w-full h-10 px-4 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
            />
          </AdmRow>
          <AdmRow label="유저 안내 메세지">
            <input
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              placeholder="해당 내용은 유저에게 안내되므로 영어로 작성해주세요"
              className="w-full h-10 px-4 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
            />
          </AdmRow>
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
          {/* 헤더 + 구성품만/POB만 infobox */}
          <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h2 className="text-[18px] font-bold text-fg-default leading-7 tracking-tight">작업 정보 입력</h2>
              <button
                onClick={handleAddPackage}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border-default bg-bg-default text-label-md text-fg-default hover:bg-bg-subtle transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                패키지 추가하기
              </button>
            </div>
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

          {/* 📦 기본 패키지 #1 카드 */}
          <PackageWorkCard
            cardLabel="📦 기본 패키지 #1"
            packages={request.packages}
            qtys={qtys}
            hasUnassigned={hasUnassigned}
            onUpdateQty={updateQty}
            showInfobox
          />

          {/* 추가 패키지 카드들 */}
          {addedPkgs.map((ap, idx) => (
            <PackageWorkCard
              key={ap.id}
              cardLabel={`📦 추가 패키지 #${idx + 2}`}
              packages={request.packages}
              qtys={ap.qtys}
              hasUnassigned={false}
              onUpdateQty={(pkgIdx, prodIdx, val) => updateAddedQty(ap.id, pkgIdx, prodIdx, val)}
              showInfobox={false}
            />
          ))}
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

function UploadArea() {
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
  cardLabel: string
  packages: SubPackage[]
  qtys: PackageQtys
  hasUnassigned: boolean
  onUpdateQty: (pkgIdx: number, prodIdx: number, value: string) => void
  showInfobox?: boolean
}

function PackageWorkCard({ cardLabel, packages, qtys, hasUnassigned, onUpdateQty, showInfobox = true }: PackageWorkCardProps) {
  return (
    <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
      {/* ── 헤더 ── */}
      <div className="px-4 py-3 bg-bg-subtle border-b border-border-default">
        <span className="text-body-bold-md text-fg-default">{cardLabel}</span>
      </div>

      {/* ── 입력 폼: 3열 × 2행 ── */}
      <PackageInputForm />

      {/* ── 패키지 내 상품 목록 ── */}
      <ProductTable
        packages={packages}
        qtys={qtys}
        hasUnassigned={hasUnassigned}
        onUpdateQty={onUpdateQty}
        showInfobox={showInfobox}
      />
    </div>
  )
}

// ─── 패키지 정보 입력 폼 (Figma 246:63293 + 246:63306) ────────────────────────

function PackageInputForm() {
  const [storageLocation, setStorageLocation] = useState('')
  const [weight, setWeight] = useState('')
  const [repackaging, setRepackaging] = useState('')
  const [width, setWidth] = useState('')
  const [depth, setDepth] = useState('')
  const [length, setLength] = useState('')

  // 100px 라벨 + 나머지 인풋, Figma ADM Table 스타일
  const labelCls = 'w-[100px] shrink-0 bg-bg-subtle border-r border-border-default px-4 flex items-center gap-1'
  const inputCls = 'w-full h-10 px-4 rounded-lg border border-border-default bg-bg-subtle text-body-regular-sm text-fg-default focus:outline-none focus:border-border-accent-brand1-default'

  return (
    <>
      {/* 행 1: 보관장소 | 무게(g) | 리패키징 여부 */}
      <div className="flex border-b border-border-default">
        {/* 보관장소 */}
        <div className="flex flex-1 border-r border-border-default">
          <div className={labelCls}>
            <span className="text-label-bold-sm text-fg-default whitespace-nowrap">보관장소</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
          </div>
          <div className="flex-1 px-4 py-3">
            <input value={storageLocation} onChange={e => setStorageLocation(e.target.value)}
              placeholder="보관장소" className={inputCls} />
          </div>
        </div>
        {/* 무게 */}
        <div className="flex flex-1 border-r border-border-default">
          <div className={labelCls}>
            <span className="text-label-bold-sm text-fg-default whitespace-nowrap">무게(g)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
          </div>
          <div className="flex-1 px-4 py-3">
            <input value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="g" className={inputCls} />
          </div>
        </div>
        {/* 리패키징 여부 — 체크박스 (Figma 246-63302) */}
        <div className="flex flex-1">
          <div className="w-[100px] shrink-0 bg-bg-subtle border-r border-[#e9ecef] px-4 flex items-center min-h-[56px]">
            <span className="text-[14px] font-semibold text-[#212529] leading-5 tracking-[-0.3px] break-keep">
              리패키징<br />여부
            </span>
          </div>
          <div className="flex-1 flex items-center px-5 min-h-[56px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={repackaging === '필요'}
                onChange={e => setRepackaging(e.target.checked ? '필요' : '')}
                className="sr-only"
              />
              {/* 커스텀 체크박스 (Figma: 24x24, border #dee2e6, rounded-[4px]) */}
              <span className={cn(
                'w-6 h-6 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors',
                repackaging === '필요'
                  ? 'bg-fg-accent-brand1-default border-fg-accent-brand1-default'
                  : 'bg-white border-[#dee2e6]',
              )}>
                {repackaging === '필요' && (
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
                    <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-[14px] font-normal text-[#212529] leading-5 tracking-[-0.3px] whitespace-nowrap">
                리패키징 필요
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 행 2: 가로(cm) | 세로(cm) | 길이(cm) */}
      <div className="flex border-b border-border-default">
        <div className="flex flex-1 border-r border-border-default">
          <div className={labelCls}>
            <span className="text-label-bold-sm text-fg-default whitespace-nowrap">가로(cm)</span>
          </div>
          <div className="flex-1 px-4 py-3">
            <input value={width} onChange={e => setWidth(e.target.value)}
              placeholder="w" className={inputCls} />
          </div>
        </div>
        <div className="flex flex-1 border-r border-border-default">
          <div className={labelCls}>
            <span className="text-label-bold-sm text-fg-default whitespace-nowrap">세로(cm)</span>
          </div>
          <div className="flex-1 px-4 py-3">
            <input value={depth} onChange={e => setDepth(e.target.value)}
              placeholder="h" className={inputCls} />
          </div>
        </div>
        <div className="flex flex-1">
          <div className={labelCls}>
            <span className="text-label-bold-sm text-fg-default whitespace-nowrap">길이(cm)</span>
          </div>
          <div className="flex-1 px-4 py-3">
            <input value={length} onChange={e => setLength(e.target.value)}
              placeholder="l" className={inputCls} />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── 상품 목록 테이블 ─────────────────────────────────────────────────────────

interface ProductTableProps {
  packages: SubPackage[]
  qtys: PackageQtys
  hasUnassigned: boolean
  onUpdateQty: (pkgIdx: number, prodIdx: number, value: string) => void
  showInfobox?: boolean
}

function ProductTable({ packages, qtys, hasUnassigned, onUpdateQty, showInfobox = true }: ProductTableProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      {/* 섹션 헤더 (접기/펼치기) */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-subtle border-b border-border-default hover:bg-bg-subtle/80 transition-colors"
      >
        <span className="text-body-bold-md text-fg-default">패키지 내 상품 정보</span>
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
          {/* 블루 인포박스 (Figma 246-63322) */}
          {showInfobox && (
            <div className="mx-4 my-3 flex items-start gap-2 px-4 py-3 rounded-lg bg-white border border-[#008fff]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="#008fff" strokeWidth="1.5" />
                <path d="M8 7v4" stroke="#008fff" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="5.5" r=".75" fill="#008fff" />
              </svg>
              <p className="text-[14px] font-bold text-[#008fff] leading-5 tracking-[-0.3px]">
                기본 패키지#1 에 포장되지 않은 상품은 수량을 0으로 표기 후, 패키지를 추가해 포장된 수량을 기입해주세요.
              </p>
            </div>
          )}

          {/* HTML table — 패키징 옵션 & 패키지 코드 rowSpan 적용 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-bg-subtle">
                  <th className="w-[160px] px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-left font-normal">
                    패키징 옵션
                  </th>
                  <th className="w-[152px] px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-left font-normal">
                    패키지 및 패키지 번호
                  </th>
                  <th className="px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-left font-normal">
                    패키지 내 상품 목록
                  </th>
                  <th className="w-[200px] px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-center font-normal">
                    패키징 수량
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, pkgIdx) => {
                  const isOptionPkg = pkg.packagingOption === '구성품만' || pkg.packagingOption === 'POB만'
                  const parentProduct = isOptionPkg
                    ? pkg.productList.find(p => !p.isPob && p.qty === 0)
                    : pkg.productList.find(p => !p.isPob)

                  return pkg.productList.map((product, prodIdx) => {
                    const isFirst    = prodIdx === 0
                    const originalQty = product.qty
                    const currentQty  = qtys[pkgIdx]?.[prodIdx] ?? originalQty
                    const isZeroed    = isOptionPkg && !product.isPob && originalQty === 0
                    const badge       = getBadge(originalQty, currentQty)

                    return (
                      <tr key={`${pkgIdx}-${prodIdx}`}>
                        {/* 패키징 옵션 — rowSpan per package */}
                        {isFirst && (
                          <td
                            rowSpan={pkg.productList.length}
                            className={cn(
                              'w-[160px] border border-border-default px-3 py-3 text-center align-middle',
                              pkg.packagingOption === '합포장'   && 'bg-[#ebf5fb]',
                              pkg.packagingOption === '구성품만' && 'bg-[#f3eeff]',
                              pkg.packagingOption === 'POB만'   && 'bg-[#fff0f5]',
                            )}
                          >
                            <p className="text-[13px] font-bold text-[#212529] leading-5">{pkg.packagingOption}</p>
                            {pkg.packagingOption === '구성품만' &&
                              pkg.packageList
                                .filter(l => l !== '구성품만')
                                .slice(0, 1)
                                .map((l, i) => (
                                  <p key={i} className="text-[11px] text-[#868e96] mt-0.5 leading-4 break-keep">{l}</p>
                                ))
                            }
                          </td>
                        )}

                        {/* 패키지 코드 — rowSpan per package */}
                        {isFirst && (
                          <td
                            rowSpan={pkg.productList.length}
                            className="w-[152px] border border-border-default px-3 py-3 text-center align-middle"
                          >
                            <p className="text-[12px] font-bold text-fg-default font-mono leading-5">{pkg.packageCode}</p>
                            <p className="text-[11px] text-fg-subtle leading-4">({pkg.packageAlias})</p>
                          </td>
                        )}

                        {/* 상품 정보 셀 */}
                        <td className="border border-border-default px-4 py-3 align-middle">
                          <div className="flex flex-col justify-center gap-0.5">
                            {product.isPob && parentProduct && (
                              <p className="text-[12px] text-[#868e96] leading-4 truncate">
                                {parentProduct.name}
                              </p>
                            )}
                            <div className="flex items-baseline gap-1 flex-wrap text-[14px] leading-5 tracking-[-0.3px]">
                              {product.isPob && (
                                <span className="text-[#212529] shrink-0">•</span>
                              )}
                              <span className={cn(
                                'text-[#212529]',
                                product.isPob ? 'font-normal' : 'font-semibold',
                              )}>
                                {product.name}
                              </span>
                              <span className="shrink-0 whitespace-nowrap">
                                <span className="font-normal text-[#868e96]">/ </span>
                                <span className="font-semibold text-[#ff558f]">{originalQty}개</span>
                              </span>
                              {isZeroed && product.preOptionQty != null && (
                                <span className="text-[12px] text-[#868e96] shrink-0">
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
                              {badge === null && currentQty === 0 && originalQty > 0 && (
                                <Badge size="sm" type="round" color="yellow">미할당</Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 포장 수량 입력 (200px) */}
                        <td className="w-[200px] border border-border-default px-4 py-[14px] align-middle">
                          <input
                            type="number"
                            min={0}
                            value={currentQty}
                            onChange={e => onUpdateQty(pkgIdx, prodIdx, e.target.value)}
                            className="w-full h-8 px-4 rounded-lg border border-[#dee2e6] bg-[#f8f9fa] text-[14px] text-[#212529] text-center focus:outline-none focus:border-border-accent-brand1-default transition-colors leading-5 tracking-[-0.3px]"
                          />
                        </td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── 뱃지 계산 ────────────────────────────────────────────────────────────────

type BadgeInfo =
  | { type: 'split'; remaining: number }
  | { type: 'over'; excess: number }
  | null

function getBadge(originalQty: number, currentQty: number): BadgeInfo {
  if (currentQty === originalQty) return null
  if (currentQty < originalQty) return { type: 'split', remaining: originalQty - currentQty }
  return { type: 'over', excess: currentQty - originalQty }
}
