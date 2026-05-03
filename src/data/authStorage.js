const USERS_KEY = 'guc_projecthub_users'
const CURRENT_USER_KEY = 'guc_projecthub_current_user'

const demoUsers = [
  {
    firstName: 'Demo',
    lastName: 'Student',
    email: 'student@guc.edu.eg',
    password: '123456',
    role: 'student',
    major: 'Computer Science',
    graduationYear: '2026',
  },
  {
    firstName: 'Demo',
    lastName: 'Instructor',
    email: 'instructor@guc.edu.eg',
    password: '123456',
    role: 'instructor',
  },
  {
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@guc.edu.eg',
    password: '123456',
    role: 'admin',
  },
  {
    companyName: 'Demo Company',
    email: 'company@example.com',
    password: '123456',
    role: 'employer',
    status: 'pending verification',
  },
]

function seedDemoUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers))
    return demoUsers
  }

  try {
    const users = JSON.parse(raw)
    if (!Array.isArray(users) || users.length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers))
      return demoUsers
    }
    return users
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers))
    return demoUsers
  }
}

function getUsers() {
  return seedDemoUsers()
}

function saveUser(user) {
  const users = getUsers()
  const existingIndex = users.findIndex(
    (entry) =>
      entry.email.toLowerCase() === user.email.toLowerCase() &&
      entry.role === user.role,
  )

  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return user
}

function findUserByEmail(email) {
  const users = getUsers()
  return users.find((entry) => entry.email.toLowerCase() === email.toLowerCase())
}

function loginUser(email, password, role) {
  const users = getUsers()
  const user = users.find(
    (entry) =>
      entry.email.toLowerCase() === email.toLowerCase() &&
      entry.password === password &&
      entry.role === role,
  )

  if (!user) {
    return null
  }

  const currentUser = {
    email: user.email,
    role: user.role,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    companyName: user.companyName ?? '',
    status: user.status ?? '',
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser))
  return currentUser
}

function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY)
    return null
  }
}
function getEmployerProfile(email) {
  const key = `employer_profile_${email.toLowerCase()}`
  const raw = localStorage.getItem(key)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

function saveEmployerProfile(email, profile) {
  const key = `employer_profile_${email.toLowerCase()}`
  localStorage.setItem(key, JSON.stringify(profile))
}
export { 
  seedDemoUsers,
   getUsers,
    saveUser, 
    findUserByEmail,
     loginUser, 
     logoutUser, 
     getCurrentUser, 
     getEmployerProfile, 
     saveEmployerProfile }