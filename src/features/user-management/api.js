const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const MOCK_USERS = [
  {
    id: 1,
    name: '김길동',
    email: 'operator01@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '생산관리팀',
    companyName: 's_map',
    phoneNumber: '010-1234-5678',
  },
  {
    id: 2,
    name: '이서윤',
    email: 'executive01@example.com',
    role: 'EXECUTIVE',
    status: 'ACTIVE',
    department: '경영지원팀',
    companyName: 's_map',
    phoneNumber: '010-2345-6789',
  },
  {
    id: 3,
    name: '박민준',
    email: 'manager01@example.com',
    role: 'MANUFACTURING_MANAGER',
    status: 'ACTIVE',
    department: '제조관리팀',
    companyName: 's_map',
    phoneNumber: '010-3456-7890',
  },
  {
    id: 4,
    name: '서버관리자',
    email: 'ad@sk.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: '시스템관리팀',
    companyName: 's_map',
    phoneNumber: '010-4567-8901',
  },
  {
    id: 5,
    name: '정하늘',
    email: 'operator02@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '생산1팀',
    companyName: 's_map',
    phoneNumber: '010-5678-9012',
  },
  {
    id: 6,
    name: '최유진',
    email: 'operator03@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '생산2팀',
    companyName: 's_map',
    phoneNumber: '010-6789-0123',
  },
  {
    id: 7,
    name: '강민호',
    email: 'operator04@example.com',
    role: 'OPERATOR',
    status: 'SUSPENDED',
    department: '조립팀',
    companyName: 's_map',
    phoneNumber: '010-7890-1234',
  },
  {
    id: 8,
    name: '윤서연',
    email: 'operator05@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '검수팀',
    companyName: 's_map',
    phoneNumber: '010-8901-2345',
  },
  {
    id: 9,
    name: '임성준',
    email: 'operator06@example.com',
    role: 'OPERATOR',
    status: 'BANNED',
    department: '포장팀',
    companyName: 's_map',
    phoneNumber: '010-9012-3456',
  },
  {
    id: 10,
    name: '오지현',
    email: 'operator07@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '생산3팀',
    companyName: 's_map',
    phoneNumber: '010-1122-3344',
  },
  {
    id: 11,
    name: '문서준',
    email: 'operator08@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '자재관리팀',
    companyName: 's_map',
    phoneNumber: '010-2233-4455',
  },
  {
    id: 12,
    name: '한지민',
    email: 'operator09@example.com',
    role: 'OPERATOR',
    status: 'WITHDRAWN',
    department: '출하팀',
    companyName: 's_map',
    phoneNumber: '010-3344-5566',
  },
  {
    id: 13,
    name: '류지호',
    email: 'operator10@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '설비운영팀',
    companyName: 's_map',
    phoneNumber: '010-4455-6677',
  },
  {
    id: 14,
    name: '신미래',
    email: 'operator11@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '품질관리팀',
    companyName: 's_map',
    phoneNumber: '010-5566-7788',
  },
  {
    id: 15,
    name: '배성훈',
    email: 'operator12@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '생산4팀',
    companyName: 's_map',
    phoneNumber: '010-6677-8899',
  },
  {
    id: 16,
    name: '김도현',
    email: 'operator13@example.com',
    role: 'OPERATOR',
    status: 'BANNED',
    department: '라인관리팀',
    companyName: 's_map',
    phoneNumber: '010-7788-9900',
  },
  {
    id: 17,
    name: '이수진',
    email: 'manager02@example.com',
    role: 'MANUFACTURING_MANAGER',
    status: 'ACTIVE',
    department: '제조기획팀',
    companyName: 's_map',
    phoneNumber: '010-8899-0011',
  },
  {
    id: 18,
    name: '최지현',
    email: 'manager03@example.com',
    role: 'MANUFACTURING_MANAGER',
    status: 'ACTIVE',
    department: '제조관리팀',
    companyName: 's_map',
    phoneNumber: '010-9900-1122',
  },
  {
    id: 19,
    name: '한상호',
    email: 'manager04@example.com',
    role: 'MANUFACTURING_MANAGER',
    status: 'SUSPENDED',
    department: '공정관리팀',
    companyName: 's_map',
    phoneNumber: '010-1010-2020',
  },
  {
    id: 20,
    name: '박지은',
    email: 'executive02@example.com',
    role: 'EXECUTIVE',
    status: 'ACTIVE',
    department: '전략기획팀',
    companyName: 's_map',
    phoneNumber: '010-2020-3030',
  },
  {
    id: 21,
    name: '조은별',
    email: 'executive03@example.com',
    role: 'EXECUTIVE',
    status: 'ACTIVE',
    department: '운영총괄팀',
    companyName: 's_map',
    phoneNumber: '010-3030-4040',
  },
  {
    id: 22,
    name: '장우진',
    email: 'admin02@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: '시스템관리팀',
    companyName: 's_map',
    phoneNumber: '010-4040-5050',
  },
  {
    id: 23,
    name: '남가람',
    email: 'operator14@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '안전관리팀',
    companyName: 's_map',
    phoneNumber: '010-5050-6060',
  },
  {
    id: 24,
    name: '홍서아',
    email: 'operator15@example.com',
    role: 'OPERATOR',
    status: 'ACTIVE',
    department: '생산지원팀',
    companyName: 's_map',
    phoneNumber: '010-6060-7070',
  },
]

let nextUserId = Math.max(...MOCK_USERS.map(user => user.id)) + 1

export async function registerUser(payload) {
  await sleep(300)

  const user = {
    id: nextUserId++,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    status: 'ACTIVE',
    department: payload.department,
    companyName: payload.companyName,
    phoneNumber: payload.phoneNumber,
  }

  MOCK_USERS.unshift(user)

  return {
    success: true,
    code: 'USER_REGISTERED',
    message: '사용자가 등록되었습니다.',
    data: { ...user },
  }
}

export async function fetchUsers({ page = 0, size = 10, search = '', role = '', status = '' } = {}) {
  await sleep(250)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch =
      !normalizedSearch ||
      user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.department.toLowerCase().includes(normalizedSearch) ||
      user.companyName.toLowerCase().includes(normalizedSearch)
    const matchesRole = !role || user.role === role
    const matchesStatus = !status || user.status === status

    return matchesSearch && matchesRole && matchesStatus
  })

  const pageNumber = Math.max(Number(page), 0)
  const pageSize = Math.max(Number(size), 1)
  const totalElements = filteredUsers.length
  const totalPages = Math.ceil(totalElements / pageSize)
  const safePageNumber = totalPages === 0 ? 0 : Math.min(pageNumber, totalPages - 1)
  const start = safePageNumber * pageSize
  const content = filteredUsers.slice(start, start + pageSize).map(user => ({ ...user }))

  return {
    success: true,
    code: 'USER_LIST_FETCHED',
    message: '사용자 목록을 조회했습니다.',
    data: {
      totalElements,
      totalPages,
      pageable: {
        unpaged: false,
        pageNumber: safePageNumber,
        paged: true,
        pageSize,
        offset: start,
        sort: {
          unsorted: true,
          sorted: false,
          empty: true,
        },
      },
      numberOfElements: content.length,
      first: safePageNumber === 0,
      last: totalPages === 0 || safePageNumber >= totalPages - 1,
      size: pageSize,
      content,
      number: safePageNumber,
      sort: {
        unsorted: true,
        sorted: false,
        empty: true,
      },
      empty: content.length === 0,
    },
  }
}

export async function deleteUser(userId) {
  await sleep(220)

  const targetIndex = MOCK_USERS.findIndex(user => user.id === userId)

  if (targetIndex === -1) {
    const error = new Error('삭제할 사용자를 찾을 수 없습니다.')
    error.status = 404
    throw error
  }

  const [deletedUser] = MOCK_USERS.splice(targetIndex, 1)

  return {
    success: true,
    code: 'USER_DELETED',
    message: '사용자가 삭제되었습니다.',
    data: { ...deletedUser },
  }
}
