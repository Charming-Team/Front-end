const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

let nextUserId = 1

export async function registerUser(payload) {
  await sleep(300)

  return {
    success: true,
    code: 'USER_REGISTERED',
    message: '사용자가 등록되었습니다.',
    data: {
      id: nextUserId++,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      department: payload.department,
      companyName: payload.companyName,
      phoneNumber: payload.phoneNumber,
    },
  }
}
