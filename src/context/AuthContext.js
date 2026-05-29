import React, { createContext, useContext, useState } from "react";

export const USERS = {
  employee: {
    id: "emp_001",
    name: "Riya Sharma",
    email: "employee@atomquest.com",
    role: "employee",
    managerId: "mgr_001",
    department: "Engineering",
    avatar: "RS",
  },
  manager: {
    id: "mgr_001",
    name: "Arjun Mehta",
    email: "manager@atomquest.com",
    role: "manager",
    department: "Engineering",
    avatar: "AM",
  },
  admin: {
    id: "adm_001",
    name: "Priya Nair",
    email: "admin@atomquest.com",
    role: "admin",
    department: "HR",
    avatar: "PN",
  },
};

// All employees the manager manages
export const TEAM_MEMBERS = [
  { id: "emp_001", name: "Riya Sharma", managerId: "mgr_001", department: "Engineering" },
  { id: "emp_002", name: "Karan Patel", managerId: "mgr_001", department: "Engineering" },
  { id: "emp_003", name: "Sneha Joshi", managerId: "mgr_001", department: "Engineering" },
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const login = (role) => setCurrentUser(USERS[role]);
  const logout = () => setCurrentUser(null);
  const switchRole = (role) => setCurrentUser(USERS[role]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
