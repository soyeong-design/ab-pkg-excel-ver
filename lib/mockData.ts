export type PackagingStatus = 'requested' | 'started' | 'completed' | 'held'
export type PackagingOption = '합포장' | '구성품만' | 'POB만' | '전체'

export interface ProductItem {
  name: string
  qty: number
  isPob?: boolean
}

export interface PackagingItem {
  requestId: string
  userId: string
  packageCode: string
  packageAlias: string
  packagingOption: PackagingOption
  packageList: string[]
  userNote?: string
  productList: ProductItem[]
  storageLocation: string
  adminRecord: string
  quantity: number
  requestedAt: string
  daysSince: string
  adminMemo: string
  status: PackagingStatus
}

export const MOCK_PACKAGING_ITEMS: PackagingItem[] = [
  {
    requestId: '2601121705000105',
    userId: 'gaellealienordalpos',
    packageCode: 'yTgP27Oc9Q',
    packageAlias: '잉어7314',
    packagingOption: '합포장',
    packageList: ['구성품만', '전체 (앨범, 포스터, 포토북 제외)'],
    userNote: 'the signed album plus all the pobs and the signed polaroid.',
    productList: [
      { name: '[PRE-ORDER] 82MAJOR - 2026 SPEC CALENDAR [우리의 계절]', qty: 2 },
      { name: '특전포카', qty: 5, isPob: true },
      { name: '사인 폴라로이드', qty: 5, isPob: true },
    ],
    storageLocation: 'C-03-04',
    adminRecord: '배송 대행 주문 :w5tr0p & 530695155834 CD앨범 5EA',
    quantity: 12,
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '',
    status: 'started',
  },
  {
    requestId: '2601121705000106',
    userId: 'xeKSHrJgyi',
    packageCode: 'xFWIcTLtkc',
    packageAlias: '잉어320',
    packagingOption: '구성품만',
    packageList: ['포토카드만'],
    userNote: 'only the photocard, no album needed.',
    productList: [
      { name: '이달의 소녀 LOONA 아르테미스 굿즈 일괄', qty: 5 },
    ],
    storageLocation: 'D-06-05',
    adminRecord: '배송 대행 주문 :w5tr0p & 536196821031 포카앨범 18EA',
    quantity: 5,
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '-배송 대행 주문 :w5tr0p',
    status: 'started',
  },
  {
    requestId: '2601121705000107',
    userId: 'w4UipEnPE3',
    packageCode: 'x3Vv9sYvqY',
    packageAlias: '잉어4102',
    packagingOption: 'POB만',
    packageList: ['POB만'],
    productList: [
      { name: 'Card-shaped photos printed with portraits', qty: 3 },
      { name: '포토카드, 특전, 시즌그리팅 등 구성품 세트', qty: 2, isPob: true },
      { name: '특전 증명사진', qty: 1, isPob: true },
    ],
    storageLocation: 'F-01-02',
    adminRecord: '배송 대행 주문 :UUxNSA & 521289468740 포카앨범 2ea',
    quantity: 6,
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '',
    status: 'started',
  },
  {
    requestId: '2601121705000108',
    userId: 'x3outluhFQ',
    packageCode: 'w4UipEnPE3',
    packageAlias: '잉어2276',
    packagingOption: '합포장',
    packageList: ['구성품만', 'POB만'],
    productList: [
      { name: 'Card-shaped photos printed with portraits', qty: 3 },
      { name: '포토카드, 특전 등 구성품 세트', qty: 2, isPob: true },
      { name: 'film prints', qty: 1 },
    ],
    storageLocation: 'D-06-05',
    adminRecord: '배송 대행 주문 :UUxNSA & 255738076974 포카앨범 12EA',
    quantity: 6,
    requestedAt: '2026-01-26',
    daysSince: '(D+1)',
    adminMemo: '배송 대행 주문 :UUxNSA',
    status: 'started',
  },
  {
    requestId: '2601121705000109',
    userId: 'w4UipEnPE3',
    packageCode: 'xMajOvcGXb',
    packageAlias: '목련3469',
    packagingOption: 'POB만',
    packageList: ['POB만'],
    productList: [
      { name: '루네이트 (LUN8) - 2nd SINGLE ALBUM [LOST] (META)', qty: 0 },
      { name: 'POB: photocard', qty: 12, isPob: true },
    ],
    storageLocation: 'D-06-05',
    adminRecord: '',
    quantity: 12,
    requestedAt: '2026-01-25',
    daysSince: '(D+2)',
    adminMemo: '',
    status: 'started',
  },
  {
    requestId: '2601121705000110',
    userId: 'gaellealienordalpos',
    packageCode: 'zRqTm18kXa',
    packageAlias: '잉어5512',
    packagingOption: '합포장',
    packageList: ['전체'],
    productList: [
      { name: '82MAJOR 사인앨범', qty: 1 },
      { name: '포토카드 세트', qty: 3 },
    ],
    storageLocation: 'A-01-02',
    adminRecord: '구매 대행 주문',
    quantity: 4,
    requestedAt: '2026-01-24',
    daysSince: '(D+3)',
    adminMemo: '',
    status: 'requested',
  },
  {
    requestId: '2601121705000101',
    userId: 'completedUser01',
    packageCode: 'cPkgAbc123',
    packageAlias: '목련1001',
    packagingOption: '구성품만',
    packageList: ['포토카드만'],
    productList: [{ name: 'LOONA 포토카드', qty: 5 }],
    storageLocation: 'B-02-03',
    adminRecord: '완료 처리됨',
    quantity: 5,
    requestedAt: '2026-01-20',
    daysSince: '(D+7)',
    adminMemo: '패키징 완료',
    status: 'completed',
  },
  {
    requestId: '2601121705000102',
    userId: 'heldUser01',
    packageCode: 'hPkgXyz789',
    packageAlias: '잉어2222',
    packagingOption: '합포장',
    packageList: ['전체'],
    productList: [{ name: '사인앨범', qty: 2 }, { name: 'POB 포카', qty: 3, isPob: true }],
    storageLocation: 'E-04-01',
    adminRecord: '주소 확인 필요',
    quantity: 5,
    requestedAt: '2026-01-22',
    daysSince: '(D+5)',
    adminMemo: '유저 연락 대기 중',
    status: 'held',
  },
]

export const ADDITIONAL_PACKAGES = [
  { id: 'pkg-2', label: '📦 추가 패키지 #2', selected: true },
  { id: 'pkg-3', label: '📦 추가 패키지 #3', selected: false },
]
