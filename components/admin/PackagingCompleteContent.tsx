'use client'

import Link from 'next/link'
import { useState, useMemo, Fragment, useEffect, useRef } from 'react'
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

// 추가 패키지는 flat key (`${pkgIdx}-${prodIdx}`) 로 관리
type FlatQtys = Record<string, number>

interface AddedPkg {
  id: number
  qtys: FlatQtys
}

interface PkgAllocationEntry {
  label: string
  getQty: (pkgIdx: number, prodIdx: number) => number
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
      <div className="w-[100px] shrink-0 bg-[#f8f9fa] border-r border-[#e9ecef] flex items-start px-4 py-4 gap-1">
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

  // 기본 패키지 수량 state (초기값 = 요청 수량과 동일)
  const [qtys, setQtys] = useState<PackageQtys>(() =>
    Object.fromEntries(request.packages.map((pkg, i) => [i, pkg.productList.map(p => p.qty)]))
  )
  const [albumQty, setAlbumQty] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [adminMemo, setAdminMemo] = useState(request.adminMemo)
  const [addedPkgs, setAddedPkgs] = useState<AddedPkg[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null)
  const [showUnallocatedWarning, setShowUnallocatedWarning] = useState(false)
  const [infoSectionCollapsed, setInfoSectionCollapsed] = useState(false)

  // 전체 할당 합산 (기본 패키지 + 모든 추가 패키지)
  const totalAllocations = useMemo<PackageQtys>(() => {
    const result: PackageQtys = {}
    request.packages.forEach((pkg, pkgIdx) => {
      result[pkgIdx] = pkg.productList.map((_, prodIdx) => {
        const base = qtys[pkgIdx]?.[prodIdx] ?? 0
        const added = addedPkgs.reduce((sum, ap) => sum + (ap.qtys[`${pkgIdx}-${prodIdx}`] ?? 0), 0)
        return base + added
      })
    })
    return result
  }, [qtys, addedPkgs, request.packages])

  // 기본 패키지 수량 변경 + 추가 패키지 자동 동기화
  function updateQty(pkgIdx: number, prodIdx: number, value: string) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0) return

    const key = `${pkgIdx}-${prodIdx}`
    const originalQty = request.packages[pkgIdx].productList[prodIdx].qty
    // 현재 추가 패키지들의 합산 (이 항목에 대해)
    const addedTotal = addedPkgs.reduce((sum, ap) => sum + (ap.qtys[key] ?? 0), 0)
    const newTotal = num + addedTotal

    setQtys(prev => ({
      ...prev,
      [pkgIdx]: prev[pkgIdx].map((q, i) => (i === prodIdx ? num : q)),
    }))

    if (addedPkgs.length > 0) {
      setAddedPkgs(prev => prev.map(ap => {
        if (newTotal >= originalQty) {
          // 완전 할당 → 추가 패키지에서 이 항목 제거
          const next = { ...ap.qtys }
          delete next[key]
          return { ...ap, qtys: next }
        } else {
          // 미할당 상태 → 아직 추가 패키지에 없으면 qty=0으로 추가
          if (key in ap.qtys) return ap
          return { ...ap, qtys: { ...ap.qtys, [key]: 0 } }
        }
      }))
    }
  }

  // 패키지 추가하기: 미할당/분할 항목은 qty=0으로 추가, 없으면 빈 패키지로 생성
  function handleAddPackage() {
    const newQtys: FlatQtys = {}
    request.packages.forEach((pkg, pkgIdx) => {
      pkg.productList.forEach((prod, prodIdx) => {
        const total = totalAllocations[pkgIdx]?.[prodIdx] ?? 0
        if (total < prod.qty) {
          newQtys[`${pkgIdx}-${prodIdx}`] = 0
        }
      })
    })
    setAddedPkgs(prev => [...prev, { id: Date.now(), qtys: newQtys }])
  }

  // 구성품만 옵션 패키지들 (핑크 인포박스 — 구성품만만, POB만 제외)
  const gumseongpumPkgs = useMemo(
    () => request.packages.filter(p => p.packagingOption === '구성품만'),
    [request.packages],
  )
  const hasGumseongpum = gumseongpumPkgs.length > 0

  // 구성품만이 아닌 패키지의 userNote (구성품만 존재 여부와 무관하게 항상 표시)
  const notePackages = useMemo(
    () => request.packages.filter(p => p.packagingOption !== '구성품만' && p.userNote),
    [request.packages],
  )
  const hasInnerInfo = hasGumseongpum || notePackages.length > 0 || !!adminMemo

  // 작업 참고사항 sticky 감지
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isInfoStuck, setIsInfoStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = scrollContainerRef.current
    if (!sentinel || !root) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsInfoStuck(!entry.isIntersecting),
      { root, rootMargin: '-100px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // 전체 패키지 할당 정보 (분할포장 뱃지용)
  const allPkgAllocations = useMemo<PkgAllocationEntry[]>(() => [
    {
      label: '📦 기본 패키지 #1',
      getQty: (pkgIdx: number, prodIdx: number) => qtys[pkgIdx]?.[prodIdx] ?? 0,
    },
    ...addedPkgs.map((ap: AddedPkg, idx: number) => ({
      label: `📦 추가 패키지 #${idx + 2}`,
      getQty: (pkgIdx: number, prodIdx: number) => ap.qtys[`${pkgIdx}-${prodIdx}`] ?? 0,
    })),
  ], [qtys, addedPkgs])

  return (
    <>
      {/* ── 스크롤 콘텐츠 영역 ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">

        {/* ── Sticky 최상단: 헤더 바 ── */}
        <div className="sticky top-0 z-20 bg-white">
          <div className="h-[100px] px-4 flex items-center justify-between border-b border-[#dee2e6] bg-white">
            {/* 왼쪽: 뒤로가기 + 페이지 타이틀 */}
            <div className="flex flex-col">
              <Link
                href="/packaging?tab=started"
                className="inline-flex items-center gap-1 text-[16px] font-semibold text-[#868e96] leading-6 tracking-[-0.3px] hover:text-[#212529] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                목록으로 돌아가기
              </Link>
              <h1 className="text-[20px] font-bold text-[#212529] leading-8 tracking-[-0.3px]">패키징 완료 처리</h1>
            </div>

            {/* 오른쪽: 포장 패키지 추가하기 버튼 */}
            <button
              onClick={handleAddPackage}
              className="flex items-center gap-2 h-11 px-5 rounded-[8px] border border-[#dee2e6] bg-white text-[18px] font-bold text-[#212529] leading-7 tracking-[-0.3px] hover:bg-[#f8f9fa] transition-colors shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              포장 패키지 추가하기
            </button>
          </div>
        </div>

        {/* ── 스크롤 콘텐츠 ── */}
        <div className="px-6 pt-5 pb-8 max-w-[1240px] mx-auto">

          {/* ── 패키징 기본 정보 입력 (이미지/비디오 업로드만) ── */}
          <div className="mb-4 bg-bg-default rounded-xl border border-border-default overflow-hidden">
            <div className="px-4 py-3 border-b border-border-default">
              <h2 className="text-[18px] font-bold text-fg-default leading-7 tracking-tight">패키징 기본 정보 입력</h2>
            </div>
            <div className="px-4 py-2 bg-[#f8f9fa] border-b border-[#dee2e6]">
              <span className="text-label-bold-sm text-fg-accent-brand1-default">{request.requestId}</span>
            </div>

            {/* 이미지 / 비디오 업로드 */}
            <div className="flex">
              <div className="flex-1 flex flex-col border-r border-border-default">
                <div className="bg-[#f8f9fa] border-b border-[#dee2e6] px-4 py-3 flex items-center min-h-[48px]">
                  <span className="text-label-bold-sm text-fg-default">이미지 업로드</span>
                </div>
                <UploadArea />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="bg-[#f8f9fa] border-b border-[#dee2e6] px-4 py-3 flex items-center gap-2 min-h-[48px]">
                  <span className="text-label-bold-sm text-fg-default">비디오 업로드</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
                </div>
                <UploadArea />
              </div>
            </div>
          </div>

          {/* ── 작업 참고사항 — sentinel + sticky 카드 ── */}
          {hasInnerInfo && (
            <>
              {/* sentinel: 이 div가 헤더(100px) 위로 사라질 때 isInfoStuck = true */}
              <div ref={sentinelRef} className="h-0" />

              <div className={cn(
                'sticky z-10 bg-white overflow-hidden top-[100px]',
                isInfoStuck
                  ? 'rounded-none border-b border-[rgba(0,0,0,0.24)]'
                  : 'rounded-t-xl border-t border-l border-r border-border-default',
              )}>
                {/* 타이틀 행 (접기/펼치기) */}
                <button
                  onClick={() => setInfoSectionCollapsed(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 border-b border-[#dee2e6] hover:bg-[#f8f9fa] transition-colors"
                >
                  <span className="text-[16px] font-semibold text-[#212529] leading-6 tracking-[-0.3px]">작업 참고사항</span>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={cn('text-[#868e96] transition-transform', infoSectionCollapsed && 'rotate-180')}
                    aria-hidden="true"
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* 인포박스 내용 */}
                {!infoSectionCollapsed && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-[#fff4f8]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#ff558f] shrink-0 mt-0.5" aria-hidden="true">
                      <path d="M8 2.5L14.5 13.5H1.5L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="8" cy="11" r=".75" fill="currentColor" />
                    </svg>
                    <div className="min-w-0 flex flex-col gap-1">
                      {hasGumseongpum && (
                        <p className="text-[14px] font-bold text-[#ff558f] leading-5 tracking-[-0.3px]">
                          구성품만 옵션이 포함된 패키지입니다
                        </p>
                      )}
                      <div className="text-[12px] font-semibold text-[#868e96] leading-4 tracking-[-0.3px] flex flex-col gap-0.5">
                        {hasGumseongpum && gumseongpumPkgs.map((p, i) => {
                          const additionalOpts = p.packageList.filter((l: string) => l !== '구성품만')
                          return (
                            <Fragment key={i}>
                              {additionalOpts.length > 0 && <p>{additionalOpts.join(' / ')}</p>}
                              {p.userNote && <p>유저 요청사항 / {p.userNote}</p>}
                            </Fragment>
                          )
                        })}
                        {notePackages.length > 0 && (
                          <p>유저 요청사항 / {notePackages.map(p => p.userNote).join(' / ')}</p>
                        )}
                        {adminMemo && (
                          <p>관리자 메모 / {adminMemo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── 패키지 카드들 ── */}
          <div className="space-y-3 mb-4">
            {/* 📦 기본 패키지 #1 카드 */}
            <PackageWorkCard
              cardLabel="📦 기본 패키지 #1"
              packages={request.packages}
              getItemQty={(pkgIdx, prodIdx) => qtys[pkgIdx]?.[prodIdx] ?? 0}
              totalAllocations={totalAllocations}
              allPkgAllocations={allPkgAllocations}
              onUpdateQty={updateQty}
              showInfobox
              connectedTop={hasInnerInfo && !isInfoStuck}
            />

            {/* 추가 패키지 카드들 */}
            {addedPkgs.map((ap: AddedPkg, idx: number) => (
              <PackageWorkCard
                key={ap.id}
                cardLabel={`📦 추가 패키지 #${idx + 2}`}
                packages={request.packages}
                getItemQty={(pkgIdx, prodIdx) => ap.qtys[`${pkgIdx}-${prodIdx}`] ?? 0}
                totalAllocations={totalAllocations}
                allPkgAllocations={allPkgAllocations}
                showItem={(pkgIdx, prodIdx) => (`${pkgIdx}-${prodIdx}` in ap.qtys)}
                onUpdateQty={(pkgIdx, prodIdx, val) => updateAddedQty(ap.id, pkgIdx, prodIdx, val)}
                showInfobox
                onDelete={() => setDeleteTarget({ id: ap.id, label: `추가 패키지 #${idx + 2}` })}
              />
            ))}
          </div>

          {/* ── 패키징 특이사항 입력 (항상 최하단) ── */}
          <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
            <div className="px-4 py-3 border-b border-border-default">
              <h2 className="text-[18px] font-bold text-fg-default leading-7 tracking-tight">패키징 특이사항 입력</h2>
            </div>
            <AdmRow label="유저 안내 메세지">
              <input
                value={userMessage}
                onChange={e => setUserMessage(e.target.value)}
                placeholder="해당 내용은 유저에게 안내되므로 영어로 작성해주세요"
                className="w-full h-10 px-4 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
              />
            </AdmRow>
            <AdmRow label="관리자 메모">
              <textarea
                value={adminMemo}
                onChange={e => setAdminMemo(e.target.value)}
                placeholder="해당 내용은 관리자용으로만 기록됩니다"
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default resize-none"
              />
            </AdmRow>
            <AdmRow label="매입 앨범 수량" noBorder>
              <input
                value={albumQty}
                onChange={e => setAlbumQty(e.target.value)}
                placeholder="매입될 앨범 수량을 입력해주세요"
                className="w-full h-10 px-4 rounded-lg border border-border-default bg-bg-subtle text-body-regular-md text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-accent-brand1-default"
              />
            </AdmRow>
          </div>

        </div>
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 sticky bottom-0 bg-bg-default border-t border-border-default px-6 py-4">
        <div className="flex justify-end gap-3">
          <Link href="/packaging?tab=started">
            <Button size="xl" variant="outline" color="default">취소</Button>
          </Link>
          <Button
            size="xl"
            color="brand1"
            onClick={() => {
              const hasRemaining = request.packages.some((pkg, pkgIdx) =>
                pkg.productList.some((prod, prodIdx) =>
                  (totalAllocations[pkgIdx]?.[prodIdx] ?? 0) < prod.qty
                )
              )
              if (hasRemaining) {
                setShowUnallocatedWarning(true)
              } else {
                router.push('/packaging?tab=completed')
              }
            }}
          >
            패키징 완료 처리
          </Button>
        </div>
      </div>

      {/* 패키지 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <DeletePackageDialog
          label={deleteTarget.label}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            setAddedPkgs(prev => prev.filter(ap => ap.id !== deleteTarget.id))
            setDeleteTarget(null)
          }}
        />
      )}

      {/* 수량 미할당 경고 다이얼로그 */}
      {showUnallocatedWarning && (
        <UnallocatedWarningDialog
          onCancel={() => setShowUnallocatedWarning(false)}
          onConfirm={() => {
            setShowUnallocatedWarning(false)
            router.push('/packaging?tab=completed')
          }}
        />
      )}
    </>
  )

  // 추가 패키지 수량 변경
  function updateAddedQty(addedId: number, pkgIdx: number, prodIdx: number, value: string) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0) return
    const key = `${pkgIdx}-${prodIdx}`
    setAddedPkgs(prev => prev.map(ap =>
      ap.id !== addedId ? ap : { ...ap, qtys: { ...ap.qtys, [key]: num } }
    ))
  }
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
  getItemQty: (pkgIdx: number, prodIdx: number) => number
  totalAllocations: PackageQtys
  allPkgAllocations: PkgAllocationEntry[]
  showItem?: (pkgIdx: number, prodIdx: number) => boolean
  onUpdateQty: (pkgIdx: number, prodIdx: number, value: string) => void
  showInfobox?: boolean
  onDelete?: () => void
  connectedTop?: boolean
}

function PackageWorkCard({ cardLabel, packages, getItemQty, totalAllocations, allPkgAllocations, showItem, onUpdateQty, showInfobox = true, onDelete, connectedTop }: PackageWorkCardProps) {
  return (
    <div className={cn(
      'bg-bg-default border border-border-default overflow-hidden',
      connectedTop ? 'rounded-b-xl rounded-t-none border-t-0' : 'rounded-xl',
    )}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between px-4 py-[8px] bg-[#f8f9fa] border-b border-[#dee2e6] min-h-[48px]">
        <span className="text-[16px] font-semibold text-[#212529] leading-6 tracking-[-0.3px]">{cardLabel}</span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#ff3434] bg-white shrink-0 hover:bg-red-50 transition-colors"
            aria-label="패키지 삭제"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 5h12M7 5V3.5h4V5M14 5l-.75 9.5H4.75L4 5" stroke="#ff3434" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.5 8.5v4M10.5 8.5v4" stroke="#ff3434" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── 입력 폼: 3열 × 2행 ── */}
      <PackageInputForm />

      {/* ── 패키지 내 상품 목록 ── */}
      <ProductTable
        packages={packages}
        getItemQty={getItemQty}
        totalAllocations={totalAllocations}
        allPkgAllocations={allPkgAllocations}
        currentPkgLabel={cardLabel}
        showItem={showItem}
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
  const labelCls = 'w-[100px] shrink-0 bg-[#f8f9fa] border-r border-[#e9ecef] px-4 flex items-center gap-1.5 min-h-[48px]'
  const inputCls = 'w-full h-10 px-4 rounded-lg border border-[#dee2e6] bg-[#f8f9fa] text-[16px] text-fg-default placeholder:text-[#868e96] focus:outline-none focus:border-fg-accent-brand1-default'

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
          <div className="w-[100px] shrink-0 bg-[#f8f9fa] border-r border-[#e9ecef] px-4 flex items-center min-h-[56px]">
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
            <span className="text-[14px] font-semibold text-[#212529] leading-5 tracking-[-0.3px] whitespace-nowrap">가로(cm)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
          </div>
          <div className="flex-1 p-4">
            <input value={width} onChange={e => setWidth(e.target.value)}
              placeholder="w" className={inputCls} />
          </div>
        </div>
        <div className="flex flex-1 border-r border-border-default">
          <div className={labelCls}>
            <span className="text-[14px] font-semibold text-[#212529] leading-5 tracking-[-0.3px] whitespace-nowrap">세로(cm)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
          </div>
          <div className="flex-1 p-4">
            <input value={depth} onChange={e => setDepth(e.target.value)}
              placeholder="h" className={inputCls} />
          </div>
        </div>
        <div className="flex flex-1">
          <div className={labelCls}>
            <span className="text-[14px] font-semibold text-[#212529] leading-5 tracking-[-0.3px] whitespace-nowrap">길이(cm)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fg-accent-brand1-default shrink-0" />
          </div>
          <div className="flex-1 p-4">
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
  getItemQty: (pkgIdx: number, prodIdx: number) => number
  totalAllocations: PackageQtys
  allPkgAllocations: PkgAllocationEntry[]
  currentPkgLabel: string
  showItem?: (pkgIdx: number, prodIdx: number) => boolean
  onUpdateQty: (pkgIdx: number, prodIdx: number, value: string) => void
  showInfobox?: boolean
}

// 패키징 옵션 정렬 순서
const OPTION_ORDER: Record<string, number> = { '합포장': 0, '구성품만': 1, 'POB만': 2, '전체': 3 }

function ProductTable({ packages, getItemQty, totalAllocations, allPkgAllocations, currentPkgLabel, showItem, onUpdateQty, showInfobox = true }: ProductTableProps) {
  const [collapsed, setCollapsed] = useState(false)

  // ── 패키징 옵션 순서(합포장→구성품만→POB만)로 정렬 후 rowData 빌드 ──────────
  type RowData = {
    pkgOrigIdx: number
    pkg: SubPackage
    prodOrigIdx: number
    product: ProductItem
    isFirstInOption: boolean
    isFirstInPkg: boolean
    optionRowSpan: number
    pkgRowSpan: number
  }

  const rows = useMemo<RowData[]>(() => {
    // 정렬된 (origIdx, pkg) 배열
    const sorted = packages
      .map((pkg, origIdx) => ({ pkg, origIdx }))
      .sort((a, b) => (OPTION_ORDER[a.pkg.packagingOption] ?? 99) - (OPTION_ORDER[b.pkg.packagingOption] ?? 99))

    // 옵션 그룹별 visible 행 수 계산
    const optionVisibleCount = new Map<string, number>()
    for (const { pkg, origIdx } of sorted) {
      const cnt = pkg.productList.filter((_, pi) => !showItem || showItem(origIdx, pi)).length
      optionVisibleCount.set(pkg.packagingOption, (optionVisibleCount.get(pkg.packagingOption) ?? 0) + cnt)
    }

    const result: RowData[] = []
    const seenOptions = new Set<string>()

    for (const { pkg, origIdx } of sorted) {
      const visibleProds = pkg.productList
        .map((prod, prodIdx) => ({ prod, prodIdx }))
        .filter(({ prodIdx }) => !showItem || showItem(origIdx, prodIdx))

      if (visibleProds.length === 0) continue

      const isFirstInOption = !seenOptions.has(pkg.packagingOption)
      seenOptions.add(pkg.packagingOption)

      visibleProds.forEach(({ prod, prodIdx }, visIdx) => {
        result.push({
          pkgOrigIdx: origIdx,
          pkg,
          prodOrigIdx: prodIdx,
          product: prod,
          isFirstInOption: isFirstInOption && visIdx === 0,
          isFirstInPkg: visIdx === 0,
          optionRowSpan: optionVisibleCount.get(pkg.packagingOption) ?? 1,
          pkgRowSpan: visibleProds.length,
        })
      })
    }
    return result
  }, [packages, showItem])

  return (
    <div>
      {/* 섹션 헤더 (접기/펼치기) */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#f8f9fa] border-b border-[#dee2e6] hover:bg-[#f1f3f5] transition-colors"
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

          {/* HTML table — 패키징 옵션별 rowSpan */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa]">
                  <th className="w-[160px] px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-left font-normal">패키징 옵션</th>
                  <th className="w-[152px] px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-left font-normal">패키지 및 패키지 번호</th>
                  <th className="px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-left font-normal">패키지 내 상품 목록</th>
                  <th className="w-[200px] px-3 py-2.5 border border-border-default text-label-md text-fg-subtle text-center font-normal">패키징 수량</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="border border-border-default bg-white px-4 py-4 text-center">
                      <p className="text-[14px] text-[#868e96] leading-5 tracking-[-0.3px]">패키지 내 포장된 상품이 없습니다.</p>
                    </td>
                  </tr>
                )}
                {rows.map(({ pkgOrigIdx, pkg, prodOrigIdx, product, isFirstInOption, isFirstInPkg, optionRowSpan, pkgRowSpan }) => {
                  const isOptionPkg    = pkg.packagingOption === '구성품만' || pkg.packagingOption === 'POB만'
                  const parentProduct  = isOptionPkg
                    ? pkg.productList.find(p => !p.isPob && p.qty === 0)
                    : pkg.productList.find(p => !p.isPob)
                  const originalQty    = product.qty
                  const currentQty     = getItemQty(pkgOrigIdx, prodOrigIdx)
                  const totalAllocated = totalAllocations[pkgOrigIdx]?.[prodOrigIdx] ?? 0
                  const isZeroed       = isOptionPkg && !product.isPob && originalQty === 0
                  const badge          = getBadge(originalQty, totalAllocated)
                  // 분할포장: 여러 패키지에 수량이 나뉜 경우
                  const pkgBreakdown = allPkgAllocations
                    .map(p => ({ label: p.label, qty: p.getQty(pkgOrigIdx, prodOrigIdx) }))
                    .filter(p => p.qty > 0)
                  const isPkgSplit = pkgBreakdown.length > 1

                  return (
                    <tr key={`${pkgOrigIdx}-${prodOrigIdx}`}>
                      {/* 패키징 옵션 — 옵션 그룹 첫 행만, optionRowSpan 만큼 */}
                      {isFirstInOption && (
                        <td
                          rowSpan={optionRowSpan}
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

                      {/* 패키지 코드 — 패키지 첫 행만, pkgRowSpan 만큼 */}
                      {isFirstInPkg && (
                        <td
                          rowSpan={pkgRowSpan}
                          className="w-[152px] border border-border-default px-3 py-3 text-center align-middle"
                        >
                          <p className="text-[12px] font-bold text-fg-default font-mono leading-5">{pkg.packageCode}</p>
                          <p className="text-[11px] text-fg-subtle leading-4">({pkg.packageAlias})</p>
                        </td>
                      )}

                      {/* 상품 정보 */}
                      <td className="border border-border-default px-4 py-3 align-middle">
                        <div className="flex flex-col justify-center gap-0.5">
                          {product.isPob && parentProduct && (
                            <p className="text-[12px] text-[#868e96] leading-4 truncate">
                              {parentProduct.name}
                            </p>
                          )}
                          <div className="flex items-baseline gap-1 flex-wrap text-[14px] leading-5 tracking-[-0.3px]">
                            {product.isPob && <span className="text-[#212529] shrink-0">•</span>}
                            <span className={cn('text-[#212529]', product.isPob ? 'font-normal' : 'font-semibold')}>
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
                            {badge?.type === 'over' && (
                              <Badge size="sm" type="round" color="green">
                                요청 반영 / {badge.excess}개
                              </Badge>
                            )}
                            {isPkgSplit ? (
                              <Badge size="sm" type="round" color="yellow">
                                ✂️ 분할 포장 / {pkgBreakdown.map(p => `${p.label.replace(/^📦 /, '')} · ${p.qty}개`).join(' , ')}
                                {totalAllocated < originalQty && ` / ${originalQty - totalAllocated}개 남음`}
                              </Badge>
                            ) : (
                              <>
                                {badge?.type === 'split' && totalAllocated === 0 && originalQty > 0 && (
                                  <Badge size="sm" type="round" color="yellow">미할당</Badge>
                                )}
                                {badge?.type === 'split' && totalAllocated > 0 && (
                                  <Badge size="sm" type="round" color="yellow">
                                    ✂️ 분할 포장 / {badge.remaining}개 남음
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 포장 수량 입력 */}
                      <td className="w-[200px] border border-border-default px-4 py-[14px] align-middle">
                        <input
                          type="number"
                          min={0}
                          value={currentQty}
                          onChange={e => onUpdateQty(pkgOrigIdx, prodOrigIdx, e.target.value)}
                          className="w-full h-8 px-4 rounded-lg border border-[#dee2e6] bg-[#f8f9fa] text-[14px] text-[#212529] text-center focus:outline-none focus:border-border-accent-brand1-default transition-colors leading-5 tracking-[-0.3px]"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── 패키지 삭제 확인 다이얼로그 ──────────────────────────────────────────────

function DeletePackageDialog({ label, onCancel, onConfirm }: {
  label: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.16)] w-[400px] max-w-[calc(100vw-32px)] flex flex-col overflow-hidden">
        <div className="pt-[20px] px-[20px]">
          <p className="text-[24px] font-bold text-[#212529] leading-[40px] tracking-[-0.3px]">정말 삭제하시겠어요?</p>
        </div>
        <div className="p-[20px]">
          <p className="text-[16px] text-[#212529] leading-[24px] tracking-[-0.3px]">
            작성된 정보는 저장되지 않습니다.<br />
            <span className="font-semibold">{label}</span>를 삭제하시겠어요?
          </p>
        </div>
        <div className="p-[20px]">
          <div className="flex gap-[12px]">
            <button
              onClick={onCancel}
              className="flex-1 h-[56px] flex items-center justify-center rounded-[8px] border border-[#dee2e6] text-[18px] font-bold text-[#212529] tracking-[-0.3px] hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-[56px] flex items-center justify-center rounded-[8px] bg-[#ff3434] text-[18px] font-bold text-white tracking-[-0.3px] hover:bg-[#e62e2e] transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 수량 미할당 경고 다이얼로그 ──────────────────────────────────────────────

function UnallocatedWarningDialog({ onCancel, onConfirm }: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.16)] w-[400px] max-w-[calc(100vw-32px)] flex flex-col overflow-hidden">
        <div className="pt-[20px] px-[20px]">
          <p className="text-[24px] font-bold text-[#212529] leading-[40px] tracking-[-0.3px]">남아있는 상품이 있습니다.</p>
        </div>
        <div className="p-[20px]">
          <p className="text-[16px] text-[#212529] leading-[24px] tracking-[-0.3px]">
            패키지에 할당되지 않은 상품이 있습니다.<br />
            패키징 완료 처리를 할까요?
          </p>
        </div>
        <div className="p-[20px]">
          <div className="flex gap-[12px]">
            <button
              onClick={onCancel}
              className="flex-1 h-[56px] flex items-center justify-center rounded-[8px] border border-[#dee2e6] text-[18px] font-bold text-[#212529] tracking-[-0.3px] hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-[56px] flex items-center justify-center rounded-[8px] bg-[#ff558f] text-[18px] font-bold text-white tracking-[-0.3px] hover:bg-[#e64d82] transition-colors"
            >
              패키징 완료 처리
            </button>
          </div>
        </div>
      </div>
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
