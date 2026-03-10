'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { CancelPackagingDialog } from '@/components/admin/dialogs/CancelPackagingDialog'
import { MOCK_PACKAGING_ITEMS, type PackagingItem } from '@/lib/mockData'

type Tab = 'requested' | 'started' | 'completed' | 'held'

const tabs: { id: Tab; label: string }[] = [
  { id: 'requested', label: '패키징 요청' },
  { id: 'started',   label: '패키징 시작' },
  { id: 'completed', label: '패키징 완료' },
  { id: 'held',      label: '보류' },
]

export function PackagingListContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get('tab') ?? 'started') as Tab

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [cancelTarget, setCancelTarget] = useState<PackagingItem | null>(null)

  const items = MOCK_PACKAGING_ITEMS.filter(i => i.status === activeTab)

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(items.map(i => i.requestId)) : new Set())
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

  const allChecked = items.length > 0 && selectedIds.size === items.length
  const hasSelection = selectedIds.size > 0

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
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-fg-subtle">패키징 요청 ID</label>
              <input
                className="h-9 px-3 rounded-lg border border-border-default text-body-regular-md bg-bg-default text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-inverse-subtle"
                placeholder="요청 ID 입력"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-fg-subtle">유저 ID</label>
              <input
                className="h-9 px-3 rounded-lg border border-border-default text-body-regular-md bg-bg-default text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-inverse-subtle"
                placeholder="유저 ID 입력"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-fg-subtle">패키지 번호</label>
              <input
                className="h-9 px-3 rounded-lg border border-border-default text-body-regular-md bg-bg-default text-fg-default placeholder:text-fg-subtlest focus:outline-none focus:border-border-inverse-subtle"
                placeholder="패키지 번호 입력"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button size="md" variant="outline" color="default">검색 초기화</Button>
            <Button size="md" color="brand1">조회하기</Button>
          </div>
        </div>

        {/* Table panel */}
        <div className="bg-bg-default rounded-xl border border-border-default overflow-hidden">
          {/* Table toolbar - row 1 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" color="default">대분류 연결</Button>
              <span className="text-body-bold-md text-fg-default">
                {items.length}개의 {tabs.find(t => t.id === activeTab)?.label} 목록
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" color="red" isDisabled={!hasSelection}
                onClick={() => {
                  const first = items.find(i => selectedIds.has(i.requestId))
                  if (first) setCancelTarget(first)
                }}>
                패키징 요청 취소
              </Button>
              <Button size="sm" variant="outline" color="default" isDisabled={!hasSelection}>
                패키징 보류
              </Button>
              <Button size="sm" color="brand1" isDisabled={!hasSelection}>
                패키징 완료 처리
              </Button>
            </div>
          </div>

          {/* Table toolbar - row 2 (downloads) */}
          <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border-default bg-bg-subtle">
            <Button size="sm" variant="outline" color="default">패키징 라벨 다운받기</Button>
            <Button size="sm" variant="outline" color="default">폐기 라벨 다운받기</Button>
            <Button size="sm" variant="outline" color="default">피킹 리스트 다운받기</Button>
            <Button size="sm" variant="outline" color="default">패키징 지시서 다운받기</Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
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
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">수량</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">패키징 요청 일시</th>
                  <th className="px-3 py-3 text-label-bold-sm text-fg-subtle whitespace-nowrap">관리자 메모</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.requestId} className="border-b border-border-default last:border-0 hover:bg-bg-subtle transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.requestId)}
                        onChange={() => toggleOne(item.requestId)}
                        className="w-4 h-4 rounded accent-pink-500"
                      />
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm font-mono whitespace-nowrap">
                      <Link href={`/packaging/${item.requestId}`} className="text-fg-accent-brand1-default hover:underline">
                        {item.requestId}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-default max-w-[120px] truncate">
                      {item.userId}
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-default whitespace-nowrap">
                      <div>{item.packageCode}</div>
                      <div className="text-fg-subtle">{item.packageAlias}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge size="sm" color={item.packagingOption === '합포장' ? 'brand1' : 'gray'}>
                        {item.packagingOption}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-default max-w-[180px]">
                      {item.packageList.map((pkg, i) => (
                        <div key={i} className="text-fg-subtle text-label-sm">{pkg}</div>
                      ))}
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-default max-w-[200px]">
                      {item.productList.map((prod, i) => (
                        <div key={i} className="text-label-sm">
                          <span className="text-fg-default">• {prod.name}</span>
                          <span className="text-fg-subtle"> / {prod.qty}개</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-default font-mono whitespace-nowrap">
                      {item.storageLocation}
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-default text-right">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-default whitespace-nowrap">
                      <div>{item.requestedAt}</div>
                      <div className="text-fg-subtle">{item.daysSince}</div>
                    </td>
                    <td className="px-3 py-3 text-body-regular-sm text-fg-subtle max-w-[160px] truncate">
                      {item.adminMemo || '-'}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-fg-subtle text-body-regular-md">
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
          packageCode={cancelTarget.packageCode}
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => {
            setCancelTarget(null)
            setSelectedIds(new Set())
          }}
        />
      )}
    </>
  )
}
