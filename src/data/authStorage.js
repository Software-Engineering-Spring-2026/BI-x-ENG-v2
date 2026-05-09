const USERS_KEY = 'guc_projecthub_users';
const CURRENT_USER_KEY = 'guc_projecthub_currentUser'; 



// --- GLOBAL DATABASE (localStorage) ---

export const seedDemoUsers = () => {
  if (!localStorage.getItem(USERS_KEY)) {
  const demoUsers = [
  {
    firstName: 'Ahmed',
    lastName: 'Mohamed',
    email: 'ahmed@student.guc.edu.eg',
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
] ;
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  }
};

export const getUsers = () => {
  seedDemoUsers();
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (userObj) => {
  const users = getUsers();
  users.push(userObj);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

// --- EMPLOYER SPECIFIC PROFILES (localStorage) ---

export const getEmployerProfile = (email) => {
  const key = `employer_profile_${email.toLowerCase()}`;
  const profile = localStorage.getItem(key);
  return profile ? JSON.parse(profile) : null;
};

export const saveEmployerProfile = (email, profileData) => {
  const key = `employer_profile_${email.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(profileData));
};

// --- ISOLATED TAB SESSIONS (sessionStorage) ---

export const loginUser = (email, password, role) => {
  const users = getUsers();
  const user = users.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password && 
    u.role === role
  );
  
  if (user) {
    // Saves the session ONLY to the current tab
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getCurrentUser = () => {
  // Reads the session ONLY from the current tab
  const user = sessionStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const logoutUser = () => {
  // Clears the session ONLY from the current tab
  sessionStorage.removeItem(CURRENT_USER_KEY);
};