import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Lock, User, Building2, Phone, AlertCircle, CheckCircle2, Loader, Eye, EyeOff, Trash2, Info } from 'lucide-react';
import { supabase, adminCreateUser } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CreateUserForm {
  email: string;
  password: string;
  name: string;
  department: string;
  contact: string;
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    name: '',
    department: '',
    contact: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch existing users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, department')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!form.email || !form.password || !form.name || !form.department) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return false;
    }

    if (form.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return false;
    }

    if (!form.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }

    return true;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      setMessage({
        type: 'error',
        text: 'Only admins can create user accounts'
      });
      return;
    }

    setLoading(true);

    try {
      // Log current user info for debugging
      console.log('Current user:', currentUser);
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', form.email.toLowerCase());

      if (!checkError && existingUser && existingUser.length > 0) {
        setMessage({ type: 'error', text: 'User with this email already exists' });
        setLoading(false);
        return;
      }

      console.log('Creating user in Supabase Auth & public tables');

      // Call programmatic user creation utility
      await adminCreateUser(
        form.email.toLowerCase(),
        form.password,
        {
          name: form.name,
          role: 'teacher',
          department: form.department,
        },
        form.contact
      );

      setMessage({
        type: 'success',
        text: `✓ Teacher account created successfully!\n\nEmail: ${form.email}\n\nThe teacher can now log in immediately using their email and the password you set.`
      });

      setForm({ email: '', password: '', name: '', department: '', contact: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create user account. Check browser console for details.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      // Delete from teachers table first
      const { error: teacherError } = await supabase
        .from('teachers')
        .delete()
        .eq('user_id', userId);

      if (teacherError) throw teacherError;

      // Delete from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) throw userError;

      setMessage({ type: 'success', text: 'Teacher deleted successfully' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: 'Failed to delete teacher' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">User Management</h1>
          </div>
          <p className="text-slate-600">Create and manage teacher accounts</p>
        </div>

        {/* Admin Status Info */}
        {currentUser && (
          <div className={`mb-6 p-4 rounded-lg border flex items-gap-2 ${
            currentUser.role === 'admin'
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <Info className={`w-5 h-5 flex-shrink-0 ${
              currentUser.role === 'admin' ? 'text-green-600' : 'text-yellow-600'
            }`} />
            <div className="ml-3">
              <p className={`font-semibold ${
                currentUser.role === 'admin' ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Logged in as: <strong>{currentUser.name}</strong> ({currentUser.role})
              </p>
              {currentUser.role !== 'admin' && (
                <p className="text-yellow-700 text-sm mt-1">
                  ⚠ You must be an admin to create user accounts
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Teacher</h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="teacher@hudur.edu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <select
                      name="department"
                      value={form.department}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    >
                      <option value="">Select Department</option>
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="English">English</option>
                      <option value="Technology">Technology</option>
                      <option value="Humanities">Humanities</option>
                      <option value="Commerce">Commerce</option>
                    </select>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="contact"
                      value={form.contact}
                      onChange={handleInputChange}
                      placeholder="+966-XX-XXXX"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <div className={`p-3 rounded-lg flex items-gap-2 ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <p className={`text-sm ml-2 whitespace-pre-wrap ${
                      message.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Teacher
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Teachers List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Active Teachers</h2>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                  <p className="ml-3 text-slate-600">Loading teachers...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No teachers created yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-between justify-between hover:border-slate-300 transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{user.name}</h3>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                            {user.department}
                          </span>
                          <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-medium">
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete teacher"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Creating Teachers</h3>
          <p className="text-blue-800 text-sm">
            Creating a teacher here automatically registers them in Supabase Authentication and creates their database profiles. They can immediately log in with their email and password.
          </p>
        </div>
      </div>
    </div>
  );
}
