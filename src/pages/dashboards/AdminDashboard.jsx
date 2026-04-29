import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
function AdminDashboard() {
const [activeTab, setActiveTab] = useState('statistics');
const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login"); 
   };
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-700">Admin Portal</h1>
      
          </div>
          <nav className="mt-2 flex flex-col gap-1 px-4 text-sm font-medium">
            <TabButton id="statistics" current={activeTab} set={setActiveTab} label="📊 Platform Stats" />
            <TabButton id="approvals" current={activeTab} set={setActiveTab} label="🏢 Company Approvals" />
            <TabButton id="users" current={activeTab} set={setActiveTab} label="👥 User Management" />
            <TabButton id="projects" current={activeTab} set={setActiveTab} label="📁 Projects & Portfolios" />
            <TabButton id="courses" current={activeTab} set={setActiveTab} label="📚 Courses & Instructors" />
            <TabButton id="notifications" current={activeTab} set={setActiveTab} label="🔔 Notifications & Appeals" />
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-200">
          {/* Req 4.0: Update forgotten password (Usually in profile/login, but good to link here) */}
          <button onClick={() => navigate('/forgot-password')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">
            Change Password
          </button>
          {/* Req 1.0: Log out */}
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mt-1">
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'statistics' && <StatisticsSection />}
        {activeTab === 'approvals' && <CompanyApprovalsSection />}
        {activeTab === 'users' && <UserManagementSection />}
        {activeTab === 'projects' && <ProjectsSection />}
        {activeTab === 'courses' && <CoursesSection />}
        {activeTab === 'notifications' && <NotificationsSection />}
      </main>
    </div>
  );
}

function StatisticsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Users" value="1,245" desc="Students, Employers, Instructors" />
        <StatCard title="Total Projects" value="432" desc="Active across all courses" />
        <StatCard title="Total Courses" value="56" desc="Registered in the system" />
      </div>
      <div className="mt-6 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h3 className="font-semibold text-lg">Internship Statistics (Admin/Employer View)</h3>
        <p className="text-sm text-slate-500 mt-2">Number of students doing internships over time goes here...</p>
      </div>
    </div>
  );
}

function CompanyApprovalsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Company Approvals</h2>
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-medium text-slate-700">Company Name</th>
              <th className="p-4 font-medium text-slate-700">Status</th>
              <th className="p-4 font-medium text-slate-700">Documents</th>
              <th className="p-4 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="p-4">TechCorp Gmbh</td>
              <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span></td>
              <td className="p-4">
                <button className="text-blue-600 hover:underline mr-3">View PDF</button>
                <button className="text-blue-600 hover:underline">Download</button>
              </td>
              <td className="p-4 flex gap-2">
                <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Accept</button>
                <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserManagementSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>
     
      <div className="flex gap-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
          + Create New Admin Account
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-4">
        <h3 className="font-semibold mb-4">User Directory (Mock)</h3>
        <ul className="space-y-3">
          <li className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
            <div>
              <p className="font-medium">Youssef Bahaa <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded ml-2">Student</span></p>
              <p className="text-sm text-slate-500">youssef.bahaa@student.guc.edu.eg</p>
            </div>
            <button className="text-red-600 text-sm border border-red-600 px-3 py-1 rounded hover:bg-red-50">Deactivate</button>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ProjectsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Projects & Portfolios</h2>
     
      <div className="flex gap-4">
        <input type="text" placeholder="Search projects by title..." className="border border-slate-300 p-2 rounded-lg w-1/3" />
        <input type="text" placeholder="Search portfolios by student..." className="border border-slate-300 p-2 rounded-lg w-1/3" />
        <button className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">Filter/Sort Options</button>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-4">
        <div className="bg-white p-6 border border-slate-200 rounded-xl">
          <h3 className="font-semibold text-red-600">Flagged Projects (Plagiarism/Rules)</h3>
          <p className="text-sm text-slate-500 mt-2">No projects currently flagged.</p>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-xl">
          <h3 className="font-semibold">Portfolio Directory</h3>
          <p className="text-sm text-slate-500 mt-2">Filter by Major or Skills to view results.</p>
        </div>
      </div>
    </div>
  );
}

function CoursesSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Courses & Instructors</h2>

      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
        + Create New Course
      </button>

      <div className="bg-white p-6 border border-slate-200 rounded-xl mt-4">
        <h3 className="font-semibold">Pending Link/Unlink Requests</h3>
        <p className="text-sm text-slate-500 mt-2">Dr. Smith requests to link to CSEN701.</p>
        <div className="mt-3 flex gap-2">
          <button className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium">Accept Link</button>
          <button className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium">Reject Link</button>
        </div>
      </div>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notifications & Appeals</h2>
      
      <div className="bg-white p-6 border border-slate-200 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Recent Notifications</h3>
          <button className="text-sm text-blue-600 hover:underline">Mark all as read</button>
        </div>
        <ul className="space-y-3">
          <li className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
            <strong>Appeal:</strong> Student "Alice" appealed a flagged project.
          </li>
        </ul>
      </div>
    </div>
  );
}


function TabButton({ id, current, set, label }) {
  const isActive = current === id;
  return (
    <button
      onClick={() => set(id)}
      className={`text-left px-4 py-2 rounded-lg transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, desc }) {
  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
  );
}

export default AdminDashboard;