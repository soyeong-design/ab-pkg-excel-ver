export type PackagingStatus = 'requested' | 'started' | 'completed' | 'held'
export type PackagingOption = '합포장' | '구성품만' | 'POB만' | '전체'

export interface ProductItem {
  name: string
  qty: number
  isPob?: boolean
}

// Legacy type — used by detail page
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

// New grouped type — used by list page
export interface SubPackage {
  packageCode: string
  packageAlias: string
  packagingOption: PackagingOption
  packageList: string[]
  userNote?: string
  productList: ProductItem[]
  storageLocation: string
  adminRecord: string
}

export interface PackagingRequest {
  requestId: string
  userId: string
  packages: SubPackage[]
  requestedAt: string
  daysSince: string
  adminMemo: string
  status: PackagingStatus
}

export const MOCK_PACKAGING_REQUESTS: PackagingRequest[] = [
  {
    requestId: '2601121705000105',
    userId: 'gaellealienordalpos',
    packages: [
      {
        packageCode: 'xFWIcTLtkc',
        packageAlias: '잉어320',
        packagingOption: '합포장',
        packageList: ['구성품만'],
        productList: [
          { name: '이달의 소녀 LOONA 아르테미스 ARTMS 츄 CHU UUU 굿즈 일괄', qty: 5 },
        ],
        storageLocation: 'D-06-05',
        adminRecord: '배송 대행 주문 :w5tr0p & 536196821031 포카앨범 18EA, 포토카드 18EA',
      },
      {
        packageCode: 'xeKSHrJgyi',
        packageAlias: '잉어4102',
        packagingOption: '합포장',
        packageList: ['전체 (앨범, 포스터, 포토북 제외)'],
        productList: [
          { name: '[PRE-ORDER] 82MAJOR - 2026 SPEC CALENDAR [우리의 계절]', qty: 2 },
          { name: '특전포카', qty: 5, isPob: true },
          { name: '특전포카2', qty: 5, isPob: true },
          { name: '사인 폴라로이드', qty: 5, isPob: true },
        ],
        storageLocation: 'C-03-04',
        adminRecord: '배송 대행 주문 :w5tr0p & 530695155834 CD앨범 5EA, 사인포토북 1EA, 포토카드 16EA',
      },
      {
        packageCode: 'w4UipEnPE3',
        packageAlias: '잉어3551',
        packagingOption: '구성품만',
        packageList: ['구성품만', '전체 (앨범, 포스터, 포토북 제외)'],
        userNote: 'the signed album plus all the pobs and the signed polaroid.',
        productList: [
          { name: 'Card-shaped photos printed with portraits', qty: 5 },
          { name: '12/11 1:1 영상통화 EVENT] 루네이트 (LUN8) - 2nd SINGLE ALBUM [LOST]', qty: 0 },
          { name: '포토카드, 특전 등 구성품 세트', qty: 3, isPob: true },
        ],
        storageLocation: 'D-06-05',
        adminRecord: '배송 대행 주문 :w5tr0p & 536196821031 포카앨범 18EA, 포토카드 18EA',
      },
    ],
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '',
    status: 'started',
  },
  {
    requestId: '2601121705000106',
    userId: 'gaellealienordalpos',
    packages: [
      {
        packageCode: 'x3Vv9sYvqY',
        packageAlias: '잉어4102',
        packagingOption: '구성품만',
        packageList: ['구성품만'],
        productList: [
          { name: 'Card-shaped photos printed with portraits', qty: 3 },
          { name: '루네이트 (LUN8) - 2nd SINGLE ALBUM [LOST] (DAY Ver. / LIGHT Ver.) (META)', qty: 0 },
          { name: '포토카드, 특전, 시즌그리팅 등 구성품 세트', qty: 2, isPob: true },
          { name: '특전 증명사진', qty: 1, isPob: true },
        ],
        storageLocation: 'F-01-02',
        adminRecord: '배송 대행 주문 :UUxNSA & 521289468740 포카앨범 2ea, 포토카드 3ea',
      },
      {
        packageCode: 'x3outluhFQ',
        packageAlias: '잉어2276',
        packagingOption: '구성품만',
        packageList: ['구성품만', 'POB만'],
        userNote: 'the signed album plus all the pobs and the signed polaroid.',
        productList: [
          { name: '12/24 1:1 영상통화 EVENT] 루네이트 (LUN8) - 2nd SINGLE ALBUM [LOST]', qty: 0 },
          { name: '포토카드, 특전 등 구성품 세트', qty: 2, isPob: true },
          { name: 'Card-shaped photos printed with portraits', qty: 3 },
          { name: 'film prints', qty: 1 },
        ],
        storageLocation: 'D-06-05',
        adminRecord: '배송 대행 주문 :UUxNSA & 255738076974 포카앨범 12EA(사인앨범 1EA 포함), 포토카드 13EA, 사인앨범 1EA',
      },
      {
        packageCode: 'w4UipEnPE3',
        packageAlias: '잉어1382',
        packagingOption: '구성품만',
        packageList: ['구성품만'],
        productList: [
          { name: '루네이트 (LUN8) - 2nd SINGLE ALBUM [LOST] (DAY Ver. / LIGHT Ver.) (META)', qty: 0 },
          { name: '포토카드, 특전 등 구성품 세트', qty: 3, isPob: true },
          { name: 'Card-shaped photos printed with portraits', qty: 3 },
        ],
        storageLocation: 'D-06-05',
        adminRecord: '배송 대행 주문 :w5tr0p & 536196821031 포카앨범 18EA, 포토카드 18EA',
      },
    ],
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '',
    status: 'started',
  },
  {
    requestId: '2601121705000107',
    userId: 'gaellealienordalpos',
    packages: [
      {
        packageCode: 'w4UipEnPE3',
        packageAlias: '잉어5719',
        packagingOption: '구성품만',
        packageList: ['구성품만'],
        productList: [
          { name: '[10/19 1:1 VIDEO CALL FANSIGN] LUN8(루네이트) - 2nd SINGLE ALBUM [LOST]', qty: 0 },
          { name: '포토카드, 특전 등 구성품 세트', qty: 5, isPob: true },
          { name: 'Card-shaped photos printed with portraits', qty: 3 },
        ],
        storageLocation: 'D-06-05',
        adminRecord: '배송 대행 주문 :UUxNSA & 511201386616 / CD앨범 5EA, 특전포카 6EA',
      },
      {
        packageCode: 'w4UipEnPE3',
        packageAlias: '잉어1715',
        packagingOption: 'POB만',
        packageList: ['POB만'],
        userNote: 'the signed album plus all the pobs and the signed polaroid.',
        productList: [
          { name: '[준우][1/11 포토 이벤트] 루네이트 (LUN8) - 2nd SINGLE ALBUM [LOST]', qty: 0 },
          { name: 'POB: photocard', qty: 12, isPob: true },
        ],
        storageLocation: 'D-06-05',
        adminRecord: '-',
      },
    ],
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '-배송 대행 주문 :w5tr0p',
    status: 'started',
  },
  {
    requestId: '2601121705000108',
    userId: 'gaellealienordalpos',
    packages: [
      {
        packageCode: 'xMajOvcGXb',
        packageAlias: '가재3469',
        packagingOption: '구성품만',
        packageList: ['구성품만', '전체 (앨범, 포스터, 포토북 제외)'],
        userNote: '주소 수정 완료, 확인 후 처리 바랍니다. 이전 주소로 발송하지 마세요.',
        productList: [
          { name: 'P1Harmony OFFICIAL LIGHT STICK ver. 2 CUSTOM MASK', qty: 1 },
          { name: '일반 / 5개', qty: 5 },
        ],
        storageLocation: 'C-03-04',
        adminRecord: '배송 대행 주문 :w5tr0p & 530695155834 CD앨범 5EA, 사인포토북 1EA, 포토카드 16EA',
      },
      {
        packageCode: 'tpAWEvfbmo',
        packageAlias: '가재1044',
        packagingOption: '합포장',
        packageList: ['합포장'],
        productList: [
          { name: '[I ONE] XLOVE 엑스러브', qty: 2 },
          { name: '해모지', qty: 1, isPob: true },
          { name: '포토카드 (달마시안)', qty: 1, isPob: true },
          { name: '포토카드 (달마시안)', qty: 1, isPob: true },
        ],
        storageLocation: 'F-01-02',
        adminRecord: '배송 대행 주문 :w5tr0p & 540691090201 82메이저 앨범 10개',
      },
    ],
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '',
    status: 'started',
  },
  {
    requestId: '2601121705000109',
    userId: 'gaellealienordalpos',
    packages: [
      {
        packageCode: 'xMajOvcGXb',
        packageAlias: '잉어3469',
        packagingOption: '합포장',
        packageList: ['합포장'],
        productList: [
          { name: '[2/5 1:1 PHOTO EVENT] 베리베리 (VERIVERY) - 상글4집 [Lost and Found] (Light ver.)', qty: 2 },
          { name: '특전포카', qty: 1, isPob: true },
        ],
        storageLocation: 'F-01-02',
        adminRecord: '배송 대행 주문 :w5tr0p & 540691090201 82메이저 앨범 10개',
      },
      {
        packageCode: 'x5SaIc8wAM',
        packageAlias: '잠미3333',
        packagingOption: '합포장',
        packageList: ['합포장'],
        productList: [
          { name: '[박치로우] 최림우 (CHUEL LI YU) - Single Album [SWEET DREAM] 발매기념 LUCKY DRAW EVENT', qty: 5 },
        ],
        storageLocation: 'D-06-05',
        adminRecord: '배송 대행 주문 :w5tr0p & 536196821031 포카앨범 18EA, 포토카드 18EA',
      },
    ],
    requestedAt: '2026-01-27',
    daysSince: '(D+0)',
    adminMemo: '',
    status: 'started',
  },
  // requested status
  {
    requestId: '2601121705000110',
    userId: 'gaellealienordalpos',
    packages: [
      {
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
      },
    ],
    requestedAt: '2026-01-24',
    daysSince: '(D+3)',
    adminMemo: '',
    status: 'requested',
  },
  // completed status
  {
    requestId: '2601121705000101',
    userId: 'completedUser01',
    packages: [
      {
        packageCode: 'cPkgAbc123',
        packageAlias: '목련1001',
        packagingOption: '구성품만',
        packageList: ['포토카드만'],
        productList: [{ name: 'LOONA 포토카드', qty: 5 }],
        storageLocation: 'B-02-03',
        adminRecord: '완료 처리됨',
      },
    ],
    requestedAt: '2026-01-20',
    daysSince: '(D+7)',
    adminMemo: '패키징 완료',
    status: 'completed',
  },
  // held status
  {
    requestId: '2601121705000102',
    userId: 'heldUser01',
    packages: [
      {
        packageCode: 'hPkgXyz789',
        packageAlias: '잉어2222',
        packagingOption: '합포장',
        packageList: ['전체'],
        productList: [
          { name: '사인앨범', qty: 2 },
          { name: 'POB 포카', qty: 3, isPob: true },
        ],
        storageLocation: 'E-04-01',
        adminRecord: '주소 확인 필요',
      },
    ],
    requestedAt: '2026-01-22',
    daysSince: '(D+5)',
    adminMemo: '유저 연락 대기 중',
    status: 'held',
  },
]

// Legacy flat list — used by detail page routing
export const MOCK_PACKAGING_ITEMS: PackagingItem[] = MOCK_PACKAGING_REQUESTS.flatMap(req =>
  req.packages.map((pkg, i) => ({
    requestId: i === 0 ? req.requestId : `${req.requestId}-${i + 1}`,
    userId: req.userId,
    packageCode: pkg.packageCode,
    packageAlias: pkg.packageAlias,
    packagingOption: pkg.packagingOption,
    packageList: pkg.packageList,
    userNote: pkg.userNote,
    productList: pkg.productList,
    storageLocation: pkg.storageLocation,
    adminRecord: pkg.adminRecord,
    quantity: pkg.productList.reduce((s, p) => s + p.qty, 0),
    requestedAt: req.requestedAt,
    daysSince: req.daysSince,
    adminMemo: req.adminMemo,
    status: req.status,
  }))
)

export const ADDITIONAL_PACKAGES = [
  { id: 'pkg-2', label: '📦 추가 패키지 #2', selected: true },
  { id: 'pkg-3', label: '📦 추가 패키지 #3', selected: false },
]
