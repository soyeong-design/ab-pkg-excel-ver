'use client'

import { cn } from '@/lib/cn'
import {
  MOCK_RECEIVING_HISTORIES,
  type PackagingRequest,
  type ReceivingStatus,
} from '@/lib/mockData'

interface Props {
  request: PackagingRequest
  onClose: () => void
}

const TH = 'border border-[#dee2e6] bg-[#f8f9fa] px-4 py-2 text-[14px] font-semibold text-[#868e96] tracking-[-0.3px] whitespace-nowrap text-center align-middle'
const TD = 'border border-[#dee2e6] px-4 py-3 text-[13px] align-top'

function StatusBadge({ status }: { status: ReceivingStatus }) {
  if (status === 'shipping')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[14px] font-semibold tracking-[-0.3px] whitespace-nowrap bg-[#fff9eb] border-[#ffeec6] text-[#b74106]">
        배송 중
      </span>
    )
  if (status === 'arrived')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[14px] font-semibold tracking-[-0.3px] whitespace-nowrap bg-[#e2f2ff] border-[#c8e4ff] text-[#266ef1]">
        창고 도착
      </span>
    )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[14px] font-semibold tracking-[-0.3px] whitespace-nowrap bg-[#f6f2ff] border-[#eee8ff] text-[#8840ff]">
      입고 완료
    </span>
  )
}

export function OrderReceivingHistoryDialog({ request, onClose }: Props) {
  const history = MOCK_RECEIVING_HISTORIES[request.requestId]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center px-5 pt-5 pb-0 shrink-0">
          <h2 className="flex-1 text-[24px] font-bold leading-10 text-[#212529] tracking-[-0.3px] truncate">
            발주 · 입고 내역 확인
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#868e96] hover:text-[#212529] hover:bg-[#f8f9fa] transition-colors"
            aria-label="닫기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-10 space-y-4">
          {/* Selected package info box */}
          <div className="bg-[#f8f9fa] border border-[#dee2e6] rounded-xl px-4 py-3">
            <p className="text-[18px] font-bold leading-7 text-[#212529] tracking-[-0.3px]">
              📦️ {request.packageNumber} ({request.packageNumberAlias})
            </p>
            <p className="text-[14px] leading-5 tracking-[-0.3px] mt-1 text-[#ff558f]">
              <span className="font-semibold">패키징 요청 ID: </span>
              <span className="font-normal">{history?.packagingRequestUuid ?? request.requestId}</span>
            </p>
          </div>

          {/* No history fallback */}
          {!history && (
            <div className="border border-[#dee2e6] rounded-xl px-4 py-8 text-center text-[14px] text-[#868e96]">
              이 패키징 요청에 대한 발주 · 입고 내역이 없습니다.
            </div>
          )}

          {/* Per-ordered-item sections */}
          {history?.items.map((item, i) => (
            <div key={i} className="border border-[#dee2e6] rounded-xl overflow-hidden">
              {/* Section header */}
              <div className="border-b border-[#dee2e6] px-4 py-3 space-y-1">
                <p className="text-[18px] font-bold leading-7 text-[#212529] tracking-[-0.3px]">
                  📦️ {item.orderItemCode} ({item.orderItemAlias}) 발주 · 입고 내역
                </p>
                <p className="text-[14px] leading-5 text-[#868e96] tracking-[-0.3px]">
                  <span className="font-semibold">앨범버디 주문번호</span>
                  <span className="font-normal">: {item.albumbuddyOrderId}</span>
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={cn(TH, 'w-[112px]')}>패키징된<br />패키지 번호</th>
                      <th className={cn(TH, 'w-[112px]')}>패키지 번호</th>
                      <th className={cn(TH, 'w-[80px]')}>판매처</th>
                      <th className={cn(TH, 'min-w-[180px]')}>발주 상품 개수</th>
                      <th className={cn(TH, 'min-w-[160px]')}>패키지 내 상품</th>
                      <th className={cn(TH, 'min-w-[120px]')}>발주 구성품 개수</th>
                      <th className={cn(TH, 'min-w-[120px]')}>패키지 내 구성품</th>
                      <th className={cn(TH, 'w-[80px]')}>보관장소</th>
                      <th className={cn(TH, 'w-[88px]')}>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.incomingPackages.map((pkg, j) => {
                      const isAssignedToSelected = pkg.assignedToPackageCode === request.packageNumber
                      const isUnassigned = pkg.assignedToPackageCode === null
                      // Text color: primary if assigned to selected package, disabled otherwise
                      const rowTextCls = isAssignedToSelected ? 'text-[#212529]' : 'text-[#adb5bd]'

                      return (
                        <tr key={j}>
                          {/* 패키징된 패키지 번호 */}
                          <td className={cn(TD, 'min-w-[112px]')}>
                            {isUnassigned ? (
                              <span className="text-[13px] text-[#adb5bd]">해당 없음</span>
                            ) : (
                              <div className={cn('text-[13px] leading-5 tracking-[-0.3px]', isAssignedToSelected ? 'font-semibold text-[#212529]' : 'font-normal text-[#adb5bd]')}>
                                {pkg.assignedToPackageCode}
                                <br />
                                <span className="font-normal">({pkg.assignedToPackageAlias})</span>
                              </div>
                            )}
                          </td>

                          {/* 패키지 번호 */}
                          <td className={cn(TD, 'min-w-[112px]')}>
                            <div className={cn('text-[13px] leading-5 tracking-[-0.3px]', rowTextCls)}>
                              {pkg.packageCode}
                              <br />
                              ({pkg.packageAlias})
                            </div>
                          </td>

                          {/* 판매처 — rowspan on first row */}
                          {j === 0 && (
                            <td
                              rowSpan={item.incomingPackages.length}
                              className={cn(TD, 'w-[80px] text-center align-middle text-[13px] text-[#212529]')}
                            >
                              {item.vendor}
                            </td>
                          )}

                          {/* 발주 상품 개수 — rowspan on first row */}
                          {j === 0 && (
                            <td
                              rowSpan={item.incomingPackages.length}
                              className={cn(TD, 'align-middle')}
                            >
                              <div className="flex gap-1 items-start text-[13px] tracking-[-0.3px]">
                                <span className="flex-1 font-semibold text-[#212529] leading-5">
                                  {item.orderedProduct.name}
                                </span>
                                <span className="shrink-0 text-[#212529] whitespace-nowrap leading-5">
                                  / {item.orderedProduct.qty}개
                                </span>
                              </div>
                            </td>
                          )}

                          {/* 패키지 내 상품 */}
                          <td className={TD}>
                            <div className="flex gap-1 items-start text-[13px] tracking-[-0.3px]">
                              <span className={cn('flex-1 font-semibold leading-5', rowTextCls)}>
                                {pkg.productInPackage.name}
                              </span>
                              <span className="shrink-0 whitespace-nowrap leading-5 text-[#8840ff]">
                                / {pkg.productInPackage.qty}개
                              </span>
                            </div>
                          </td>

                          {/* 발주 구성품 개수 */}
                          <td className={TD}>
                            {pkg.orderComponents.length === 0 ? (
                              <span className={cn('text-[13px]', rowTextCls)}>-</span>
                            ) : (
                              pkg.orderComponents.map((c, k) => (
                                <div key={k} className="flex gap-1 items-center text-[12px] leading-4 tracking-[-0.3px] whitespace-nowrap">
                                  <span className={cn('font-semibold', isAssignedToSelected ? 'text-[#868e96]' : 'text-[#adb5bd]')}>- {c.name}</span>
                                  <span className="text-[#ff558f]">/</span>
                                  <span className="font-semibold text-[#ff558f]">{c.qty}개</span>
                                </div>
                              ))
                            )}
                          </td>

                          {/* 패키지 내 구성품 */}
                          <td className={TD}>
                            {pkg.packageComponents.length === 0 ? (
                              <span className={cn('text-[13px]', rowTextCls)}>-</span>
                            ) : (
                              pkg.packageComponents.map((c, k) => (
                                <div key={k} className="flex gap-1 items-center text-[12px] leading-4 tracking-[-0.3px] whitespace-nowrap">
                                  <span className={cn('font-semibold', isAssignedToSelected ? 'text-[#868e96]' : 'text-[#adb5bd]')}>- {c.name}</span>
                                  <span className="text-[#ff558f]">/</span>
                                  <span className="font-semibold text-[#ff558f]">{c.qty}개</span>
                                </div>
                              ))
                            )}
                          </td>

                          {/* 보관장소 */}
                          <td className={cn(TD, 'text-center align-middle whitespace-nowrap text-[13px]', rowTextCls)}>
                            {pkg.storageLocation}
                          </td>

                          {/* 상태 */}
                          <td className={cn(TD, 'text-center align-middle')}>
                            <StatusBadge status={pkg.status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
