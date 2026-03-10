'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { CancelPackagingDialog } from '@/components/admin/dialogs/CancelPackagingDialog'
import { MOCK_PACKAGING_REQUESTS, type PackagingRequest } from '@/lib/mockData'

type Tab = 'requested' | 'started' | 'completed' | 'held'

const tabs: { id: Tab; label: string }[] = [
  { id: 'requested', label: '패키징 요청' },
  { id: 'started',   label: '패키징 시작' },
  { id: 'completed', label: '패키징 완료' },
  { id: 'held',      label: '보류' },
]

function downloadExcel(requests: PackagingRequest[]) {
  const rows = requests.flatMap(req =>
    req.packages.map(pkg => ({
      requestId: req.requestId,
      packageCode: pkg.packageCode,
      packageAlias: pkg.packageAlias,
      requestedAt: req.requestedAt,
      daysSince: req.daysSince,
    }))
  )

  const xmlRows = rows.map(r =>
    `  <Row>
    <Cell><Data ss:Type="String">${r.requestId}</Data></Cell>
    <Cell><Data ss:Type="String">${r.packageCode} (${r.packageAlias})</Data></Cell>
    <Cell><Data ss:Type="String">${r.requestedAt} ${r.daysSince}</Data></Cell>
  </Row>`
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="패키징목록">
  <Table>
  <Row>
    <Cell><Data ss:Type="String">패키징 요청 ID</Data></Cell>
    <Cell><Data ss:Type="String">패키지 번호</Data></Cell>
    <Cell><Data ss:Type="String">패키징 요청 일시</Data></Cell>
  </Row>
${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `패키징목록_${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export function PackagingListContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get('tab') ?? 'started') as Tab

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [cancelTarget, setCancelTarget] = useState<PackagingRequest | null>(null)
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set())
  const [searchOpen, setSearchOpen] = useState(true)

  const allRequests = MOCK_PACKAGING_REQUESTS.filter(
    r => r.status === activeTab && !cancelledIds.has(r.requestId)
  )

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(allRequests.map(r => r.requestId)) : new Set())
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleTabChange(tab: Tab) {
    setSelectedIds(new Set())
    router.push(`/packaging?tab=${tab}`)
  }

  const allChecked = allRequests.length > 0 && selectedIds.size === allRequests.length
  const hasSelection = selectedIds.size > 0
  const selectedRequests = allRequests.filter(r => selectedIds.has(r.requestId))

  return (
    <>
      {/* Page header */}
      <div className="border-b border-border-default bg-bg-default px-6 py-4">
        <div className="flex items-center gap-2 text-label-sm text-fg-subtle mb-1">
          <span>패키징 내역</span>
          <span>›</span>
          <span>패키징 처리</span>
          <span>›</span>
          <span className="text-fg-default font-medium">패키징 시작</span>
        </div>
        <h1 className="text-heading-lg text-fg-default">패키징 처리</h1>
      </div>

      {/* Tabs */}
      <div className="bg-bg-default border-b border-border-default px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'px-4 py-3 text-label-bold-md border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-fg-accent-brand1-default text-fg-accent-brand1-default'
                  : 'border-transparent text-fg-subtle hover:text-fg-default',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-4">
        {/* Search panel */}
        <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            onClick={() => setSearchOpen(v => !v)}
          >
            <span className="text-body-bold-md text-fg-default">검색</span>
            <svg
              width="20" height="20" viewBox="0 0 20 20" fill="none"
              className={cn('text-fg-subtle transition-transform', searchOpen ? 'rotate-180' : '')}
            >
              <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {searchOpen && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-label-md text-fg-default whitespace-nowrap w-16 shrink-0">검색어</span>
                <input
                  className="flex-1 h-10 px-3 rounded-lg border border-border-default text-body-regular-md bg-bg-default text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-inverse-subtle"
                  placeholder="패키지 요청번호, 패키지 번호 등을 입력하세요"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="md" variant="outline" color="default">검색 초기화</Button>
                <Button size="md" color="brand1" leftIcon={
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }>조회하기</Button>
              </div>
            </div>
          )}
        </div>

        {/* Table panel */}
        <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
          {/* Toolbar row 1 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <span className="text-body-bold-md text-fg-default">
                <span className="text-fg-accent-brand1-default">{allRequests.length}</span>
                개의 {tabs.find(t => t.id === activeTab)?.label} 목록
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="outline" color="red"
                isDisabled={!hasSelection}
                onClick={() => {
                  const first = allRequests.find(r => selectedIds.has(r.requestId))
                  if (first) setCancelTarget(first)
                }}
              >
                패키징 요청 취소
              </Button>
              <Button size="sm" variant="outline" color="red" isDisabled={!hasSelection}>
                패키징 보류
              </Button>
              <Button size="sm" color="brand1" isDisabled={!hasSelection}>
                패키징 완료 처리
              </Button>
            </div>
          </div>

          {/* Toolbar row 2 */}
          <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border-default bg-bg-subtle">
            <Button
              size="sm" variant="outline" color="default"
              onClick={() => hasSelection && downloadExcel(selectedRequests)}
              isDisabled={!hasSelection}
            >
              패키징 라벨 다운받기
            </Button>
            <Button size="sm" variant="outline" color="default">폐기 라벨 다운받기</Button>
            <Button size="sm" variant="outline" color="default">피킹 리스트 다운받기</Button>
            <Button size="sm" variant="outline" color="default">패키징 지시서 다운받기</Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-default bg-bg-subtle">
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={e => toggleAll(e.target.checked)}
                      className="w-4 h-4 rounded accent-pink-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">패키징 요청 ID</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">유저 ID</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">패키지 번호</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">패키징 옵션</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">패키징 될 패키지 목록</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">패키지 내 상품 목록</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">보관 장소</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">관리자 기록</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">수량</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">패키징 요청 일시</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap text-center">관리자 메모</th>
                </tr>
              </thead>
              <tbody>
                {allRequests.map(req => {
                  const isSelected = selectedIds.has(req.requestId)
                  const pkgCount = req.packages.length
                  const totalQty = req.packages.reduce(
                    (s, pkg) => s + pkg.productList.reduce((ps, p) => ps + p.qty, 0), 0
                  )

                  return req.packages.map((pkg, pkgIndex) => {
                    const isFirst = pkgIndex === 0
                    const isLast = pkgIndex === pkgCount - 1

                    return (
                      <tr
                        key={`${req.requestId}-${pkgIndex}`}
                        className={cn(
                          'border-b border-border-default hover:bg-bg-subtle transition-colors',
                          isSelected && 'bg-bg-accent-brand1-subtlest',
                          isLast && 'border-b-2 border-border-default',
                        )}
                      >
                        {/* Rowspan cells — only on first sub-row */}
                        {isFirst && (
                          <>
                            <td rowSpan={pkgCount} className="px-4 py-3 align-top border-r border-border-default text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOne(req.requestId)}
                                className="w-4 h-4 rounded accent-pink-500"
                              />
                            </td>
                            <td rowSpan={pkgCount} className="px-3 py-3 align-top text-body-regular-sm border-r border-border-default min-w-[128px]">
                              <Link
                                href={`/packaging/${req.requestId}`}
                                className="text-fg-accent-brand1-default hover:underline font-mono text-xs"
                              >
                                {req.requestId}
                              </Link>
                            </td>
                            <td rowSpan={pkgCount} className="px-3 py-3 align-top text-body-regular-sm text-fg-default border-r border-border-default max-w-[160px]">
                              <div className="break-all text-xs">{req.userId}</div>
                            </td>
                            <td rowSpan={pkgCount} className="px-3 py-3 align-top border-r border-border-default min-w-[140px]">
                              <div className="font-mono text-xs text-fg-default">{req.packageNumber}</div>
                              <div className="text-fg-subtle text-label-sm">({req.packageNumberAlias})</div>
                            </td>
                          </>
                        )}

                        {/* 패키징 옵션 — option text + packageList details + userNote */}
                        <td className="px-3 py-3 text-body-regular-sm min-w-[180px]">
                          <div className="text-label-bold-sm text-fg-default">{pkg.packagingOption}</div>
                          {pkg.packageList.map((p, i) => (
                            <div key={i} className="text-[12px] text-fg-subtle leading-4">{p}</div>
                          ))}
                          {pkg.userNote && (
                            <div className="text-[12px] text-fg-accent-brand1-default leading-4 mt-0.5">
                              <span className="font-semibold">- 유저 요청사항: </span>
                              <span>{pkg.userNote}</span>
                            </div>
                          )}
                        </td>

                        {/* 패키징 될 패키지 목록 — individual package code per sub-row */}
                        <td className="px-3 py-3 text-body-regular-sm min-w-[152px]">
                          <div className="font-mono text-xs text-fg-default">{pkg.packageCode}</div>
                          <div className="text-fg-subtle text-label-sm">({pkg.packageAlias})</div>
                        </td>

                        {/* 패키지 내 상품 목록 */}
                        <td className="px-3 py-3 text-body-regular-sm min-w-[280px]">
                          {pkg.productList.map((prod, i) => (
                            <div key={i} className="flex gap-1 items-baseline text-[13px] leading-5">
                              <span className={cn(
                                'flex-1 min-w-0',
                                prod.isPob ? 'text-fg-subtle' : 'text-fg-default',
                              )}>
                                {prod.isPob ? '-' : '•'} {prod.name}
                              </span>
                              <span className="text-fg-accent-brand1-default shrink-0 whitespace-nowrap">
                                / {prod.qty}개
                              </span>
                            </div>
                          ))}
                        </td>

                        {/* 보관 장소 */}
                        <td className="px-3 py-3 text-body-regular-sm text-fg-default whitespace-nowrap text-xs">
                          {pkg.storageLocation}
                        </td>

                        {/* 관리자 기록 */}
                        <td className="px-3 py-3 text-body-regular-sm text-fg-subtle max-w-[150px] text-xs">
                          {pkg.adminRecord || '-'}
                        </td>

                        {/* 수량 / 요청일시 / 메모 — only on last sub-row */}
                        {isLast ? (
                          <>
                            <td className="px-3 py-3 text-body-regular-sm whitespace-nowrap">
                              <div className="text-label-sm text-fg-subtle">총 패키지 수</div>
                              <div className="text-fg-accent-brand1-default text-label-bold-sm">
                                {pkgCount}개 {req.daysSince}
                              </div>
                              <div className="text-label-sm text-fg-subtle mt-1">총 상품 수량</div>
                              <div className="text-fg-accent-brand1-default text-label-bold-sm">{totalQty}개</div>
                            </td>
                            <td className="px-3 py-3 text-body-regular-sm whitespace-nowrap">
                              <div className="text-fg-default">{req.requestedAt}</div>
                            </td>
                            <td className="px-3 py-3 text-body-regular-sm text-fg-subtle max-w-[150px] text-xs">
                              {req.adminMemo || '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-3" />
                            <td className="px-3 py-3" />
                            <td className="px-3 py-3" />
                          </>
                        )}
                      </tr>
                    )
                  })
                })}

                {allRequests.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-fg-subtle text-body-regular-md">
                      해당 상태의 패키징 항목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
            <div className="flex items-center gap-2">
              <select className="h-8 px-2 rounded-lg border border-border-default text-label-md bg-bg-default text-fg-default">
                <option>10 / page</option>
                <option>20 / page</option>
                <option>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" color="default">← Previous</Button>
              {[1, 2, 3, 4, 5].map(n => (
                <Button key={n} size="sm" variant={n === 1 ? 'solid' : 'outline'} color={n === 1 ? 'brand1' : 'default'}>
                  {n}
                </Button>
              ))}
              <Button size="sm" variant="outline" color="default">Next →</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel dialog */}
      {cancelTarget && (
        <CancelPackagingDialog
          packageCode={cancelTarget.packages[0].packageCode}
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => {
            setCancelledIds(prev => new Set([...prev, cancelTarget.requestId]))
            setSelectedIds(prev => {
              const next = new Set(prev)
              next.delete(cancelTarget.requestId)
              return next
            })
            setCancelTarget(null)
          }}
        />
      )}
    </>
  )
}
