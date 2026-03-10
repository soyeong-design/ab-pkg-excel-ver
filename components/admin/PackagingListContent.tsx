'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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

  const optionBadgeColor = (opt: string) => {
    if (opt === '합포장') return 'brand1'
    if (opt === 'POB만') return 'brand2'
    return 'gray'
  }

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
        <div className="bg-bg-default rounded-xl border border-border-default p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-body-bold-md text-fg-default">검색</span>
          </div>
          <div className="w-full">
            <input
              className="w-full h-10 px-3 rounded-lg border border-border-default text-body-regular-md bg-bg-default text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-inverse-subtle"
              placeholder="패키징 요청 ID, 유저 ID, 패키지 번호 등을 입력하세요"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button size="md" variant="outline" color="default">검색 초기화</Button>
            <Button size="md" color="brand1" leftIcon={
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }>조회하기</Button>
          </div>
        </div>

        {/* Table panel */}
        <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
          {/* Toolbar row 1 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <span className="text-body-bold-md text-fg-default">
                {allRequests.length}개의 {tabs.find(t => t.id === activeTab)?.label} 목록
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
              <Button size="sm" variant="outline" color="brand1" isDisabled={!hasSelection}>
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
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={e => toggleAll(e.target.checked)}
                      className="w-4 h-4 rounded accent-pink-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">패키징 요청 ID</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">유저 ID</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">패키지 번호</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">패키징 옵션</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">패키징 될 패키지 목록</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">패키지 내 상품 목록</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">보관 장소</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">관리자 기록</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">수량</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">패키징 요청 일시</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">관리자 메모</th>
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
                            <td rowSpan={pkgCount} className="px-4 py-3 align-top border-r border-border-default">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOne(req.requestId)}
                                className="w-4 h-4 rounded accent-pink-500"
                              />
                            </td>
                            <td rowSpan={pkgCount} className="px-3 py-3 align-top text-body-regular-sm border-r border-border-default">
                              <Link
                                href={`/packaging/${req.requestId}`}
                                className="text-fg-accent-brand1-default hover:underline font-mono text-xs"
                              >
                                {req.requestId}
                              </Link>
                            </td>
                            <td rowSpan={pkgCount} className="px-3 py-3 align-top text-body-regular-sm text-fg-default border-r border-border-default max-w-[120px]">
                              <div className="break-all">{req.userId}</div>
                            </td>
                          </>
                        )}

                        {/* Per-package cells */}
                        <td className="px-3 py-3 text-body-regular-sm text-fg-default whitespace-nowrap">
                          <div className="font-mono text-xs">{pkg.packageCode}</div>
                          <div className="text-fg-subtle text-label-sm">({pkg.packageAlias})</div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge size="sm" color={optionBadgeColor(pkg.packagingOption) as 'brand1' | 'brand2' | 'gray'}>
                            {pkg.packagingOption}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-body-regular-sm max-w-[180px]">
                          {pkg.packageList.map((p, i) => (
                            <div key={i} className="text-fg-subtle text-label-sm">{p}</div>
                          ))}
                          {pkg.userNote && (
                            <div className="text-fg-accent-brand2-default text-label-sm mt-1">
                              - 유저 요청사항: {pkg.userNote}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-body-regular-sm max-w-[220px]">
                          {pkg.productList.map((prod, i) => (
                            <div key={i} className="text-label-sm flex gap-1">
                              <span className={prod.isPob ? 'text-fg-subtle' : 'text-fg-default'}>
                                • {prod.name}
                              </span>
                              <span className={prod.isPob ? 'text-fg-accent-brand1-default' : 'text-fg-accent-brand2-default'}>
                                / {prod.qty}개
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="px-3 py-3 text-body-regular-sm text-fg-default font-mono whitespace-nowrap text-xs">
                          {pkg.storageLocation}
                        </td>
                        <td className="px-3 py-3 text-body-regular-sm text-fg-subtle max-w-[160px]">
                          {pkg.adminRecord || '-'}
                        </td>

                        {/* 수량 / 요청일시 / 메모 — only on last sub-row */}
                        {isLast ? (
                          <>
                            <td className="px-3 py-3 text-body-regular-sm whitespace-nowrap">
                              <div className="text-label-sm text-fg-subtle">총 패키지 수</div>
                              <div className="text-fg-accent-brand1-default text-label-bold-sm">{pkgCount}개</div>
                              <div className="text-label-sm text-fg-subtle mt-1">총 상품 수량</div>
                              <div className="text-fg-accent-brand1-default text-label-bold-sm">{totalQty}개</div>
                            </td>
                            <td className="px-3 py-3 text-body-regular-sm whitespace-nowrap">
                              <div className="text-fg-default">{req.requestedAt}</div>
                              <div className="text-fg-accent-brand1-default">{req.daysSince}</div>
                            </td>
                            <td className="px-3 py-3 text-body-regular-sm text-fg-subtle max-w-[160px]">
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
