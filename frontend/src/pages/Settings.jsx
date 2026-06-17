import React, { useState, useEffect, useContext } from 'react';
import API from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { Settings, Save, ShieldAlert, CheckCircle, Info, Lock, Users, UserPlus, Trash2, AlertTriangle, Download, X, Key } from 'lucide-react';

const SettingsPage = () => {
  const { user: currentUser } = useContext(AuthContext);

  // Business Profile states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Security password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // User management states
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState(null);

  // Status notifications
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // PWA state
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // New session states
  const [showConfirmLogoutSelf, setShowConfirmLogoutSelf] = useState(false);
  const [showConfirmLogoutAll, setShowConfirmLogoutAll] = useState(false);
  const [loggingOutSelf, setLoggingOutSelf] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Password reset modal states for operators
  const [selectedPassUser, setSelectedPassUser] = useState(null);
  const [modalNewPass, setModalNewPass] = useState('');
  const [modalConfirmPass, setModalConfirmPass] = useState('');
  const [modalSavingPass, setModalSavingPass] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/auth/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users list', err);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get('/settings/profile');
        if (data) {
          setName(data.name);
          setContact(data.contact);
          setAddress(data.address);
        }
      } catch (err) {
        setProfileError('Failed to load business profile settings');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
    fetchUsers();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to PWA prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim() || !contact.trim() || !address.trim()) {
      setProfileError('All profile fields are required');
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await API.put('/settings/profile', { name, contact, address });
      setName(data.name);
      setContact(data.contact);
      setAddress(data.address);
      setProfileSuccess('Business profile updated successfully!');
      
      // Proactively trigger update event to trigger reload in sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update business profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }

    setSavingPass(true);
    try {
      await API.put('/auth/password', { oldPassword, newPassword });
      setPassSuccess('Admin password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogoutSelf = async () => {
    setPassError('');
    setPassSuccess('');
    setLoggingOutSelf(true);
    try {
      await API.put('/auth/logout-self');
      setPassSuccess('Logged out from all devices successfully! Redirecting...');
      setShowConfirmLogoutSelf(false);
      setTimeout(() => {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to logout from all devices');
      setShowConfirmLogoutSelf(false);
    } finally {
      setLoggingOutSelf(false);
    }
  };

  const handleLogoutAll = async () => {
    setPassError('');
    setPassSuccess('');
    setLoggingOutAll(true);
    try {
      await API.put('/auth/logout-all');
      setPassSuccess('All operators logged out from all devices! Redirecting...');
      setShowConfirmLogoutAll(false);
      setTimeout(() => {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to force logout all users');
      setShowConfirmLogoutAll(false);
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleModalSavePassword = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!modalNewPass || !modalConfirmPass) {
      setModalError('Both password fields are required');
      return;
    }

    if (modalNewPass !== modalConfirmPass) {
      setModalError('Passwords do not match');
      return;
    }

    if (modalNewPass.length < 6) {
      setModalError('Password must be at least 6 characters long');
      return;
    }

    setModalSavingPass(true);
    try {
      const { data } = await API.put('/auth/users/password', {
        userId: selectedPassUser._id,
        newPassword: modalNewPass
      });
      setModalSuccess(data.message || 'Password changed successfully!');
      setModalNewPass('');
      setModalConfirmPass('');
      
      if (selectedPassUser.username === currentUser.username) {
        setTimeout(() => {
          localStorage.removeItem('userInfo');
          window.location.href = '/login';
        }, 1500);
      } else {
        setTimeout(() => {
          setSelectedPassUser(null);
          setModalSuccess('');
        }, 2000);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update user password');
    } finally {
      setModalSavingPass(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword) {
      setUserError('All fields (name, username, password) are required');
      return;
    }

    setSavingUser(true);
    try {
      const { data } = await API.post('/auth/users', {
        name: newUserName,
        username: newUserUsername.toLowerCase().trim(),
        password: newUserPassword,
      });
      setUsers((prev) => [data, ...prev]);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setUserSuccess('Admin user registered successfully!');
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setUserError('');
    setUserSuccess('');
    try {
      await API.delete(`/auth/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setDeleteConfirmUserId(null);
      setUserSuccess('Admin user deleted successfully!');
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to delete user');
      setDeleteConfirmUserId(null);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-wide">System Settings</h2>
        <p className="text-sm text-slate-500">Configure business profiles shown on bills, and update security credentials.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Profile Management */}
        <div className="glass-panel p-6 border border-slate-200/60 bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings size={18} className="text-primary-700" />
            <h3 className="font-bold text-slate-800 text-[15px]">Business Invoice Profile</h3>
          </div>

          {profileError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0" />
              <span>{profileSuccess} (Refreshing page...)</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                className="glass-input-no-icon w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Contact Number
              </label>
              <input
                type="text"
                required
                className="glass-input-no-icon w-full font-sans"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Business Address (Editable field)
              </label>
              <textarea
                required
                rows="3"
                className="glass-input-no-icon w-full text-sm resize-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-xs text-slate-500 flex gap-2">
              <Info size={16} className="text-slate-400 shrink-0" />
              <span>These details appear on printed invoices, ledger heads, and dashboard titles.</span>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary w-full py-2.5 text-sm font-semibold"
            >
              <Save size={16} />
              {savingProfile ? 'Saving profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Admin Security Password Modification */}
        <div className="glass-panel p-6 border border-slate-200/60 bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock size={18} className="text-primary-700" />
            <h3 className="font-bold text-slate-800 text-[15px]">Security & Authentication</h3>
          </div>

          {passError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              {passSuccess}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                className="glass-input-no-icon w-full"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="border-t border-slate-50 pt-3 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className="glass-input-no-icon w-full"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  className="glass-input-no-icon w-full"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl bg-orange-50 border border-orange-200/60 p-3 text-xs text-orange-700 flex gap-2">
              <ShieldAlert size={16} className="text-orange-500 shrink-0" />
              <span>Keep your credentials secure. Changing this password will require relogging in later sessions.</span>
            </div>

            <button
              type="submit"
              disabled={savingPass}
              className="btn-primary bg-primary-800 hover:bg-primary-950 w-full py-2.5 text-sm font-semibold"
            >
              <Save size={16} />
              {savingPass ? 'Modifying security...' : 'Change Password'}
            </button>
          </form>

          {/* Device Session Control */}
          <div className="border-t border-slate-100 pt-4 mt-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-650 text-red-600" /> Session & Device Management
            </h4>
            
            <div className="space-y-3">
              {showConfirmLogoutSelf ? (
                <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-xs space-y-2 animate-fadeIn">
                  <p className="text-orange-800 font-medium">Are you sure you want to log out from all devices? You will be logged out of this session as well.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleLogoutSelf}
                      disabled={loggingOutSelf}
                      className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold text-[11px]"
                    >
                      {loggingOutSelf ? 'Logging out...' : 'Yes, Log Out'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmLogoutSelf(false)}
                      className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmLogoutSelf(true)}
                  className="w-full btn-secondary text-red-600 hover:text-red-700 border-red-200/50 hover:bg-red-50 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  Logout Current User from All Devices
                </button>
              )}

              {showConfirmLogoutAll ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs space-y-2 animate-fadeIn">
                  <p className="text-red-800 font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle size={14} className="text-red-600" /> Critical Action
                  </p>
                  <p className="text-red-700 font-medium">This will immediately invalidate all operators' login sessions on all devices. Everyone will need to log back in.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleLogoutAll}
                      disabled={loggingOutAll}
                      className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px]"
                    >
                      {loggingOutAll ? 'Invalidating...' : 'Confirm Force Logout All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmLogoutAll(false)}
                      className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmLogoutAll(true)}
                  className="w-full btn-danger py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                >
                  Logout All Users from All Devices
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Management Section */}
      <div className="glass-panel p-6 border border-slate-200/60 bg-white space-y-4 mt-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users size={18} className="text-primary-700" />
          <h3 className="font-bold text-slate-800 text-[15px]">Admin Operator Management</h3>
        </div>

        {userError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {userError}
          </div>
        )}
        {userSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle size={14} className="shrink-0" />
            <span>{userSuccess}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Add Admin form */}
          <form onSubmit={handleCreateUser} className="space-y-4 md:col-span-1 border-r border-slate-100 pr-0 md:pr-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <UserPlus size={14} /> Add New Operator
            </h4>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                className="glass-input-no-icon w-full py-1.5 text-xs"
                placeholder="e.g. Ali Raza"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                required
                className="glass-input-no-icon w-full py-1.5 text-xs"
                placeholder="e.g. aliraza"
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="glass-input-no-icon w-full py-1.5 text-xs"
                placeholder="Min 6 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={savingUser}
              className="btn-primary w-full py-2 text-xs font-semibold"
            >
              <Save size={14} />
              {savingUser ? 'Adding operator...' : 'Register Operator'}
            </button>
          </form>

          {/* Admins List */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Registered Administrators
            </h4>

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
              {users.map((u) => (
                <div key={u._id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{u.name}</p>
                    <p className="text-slate-400 text-[10px]">@{u.username}</p>
                  </div>
                  
                  {/* Operations Column */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPassUser(u);
                        setModalError('');
                        setModalSuccess('');
                      }}
                      className="rounded p-1 text-slate-400 hover:text-primary-750 hover:bg-slate-100 transition-colors"
                      title="Update Password"
                    >
                      <Key size={14} />
                    </button>

                    {currentUser?.username === u.username ? (
                      <span className="text-[9px] font-bold uppercase text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100">
                        Me
                      </span>
                    ) : deleteConfirmUserId === u._id ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
                        <AlertTriangle size={13} className="text-orange-600" />
                        <span className="text-[9px] text-orange-700 font-semibold">Checks invoices. Delete?</span>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUserId(null)}
                          className="bg-white border border-slate-200 text-slate-500 font-bold text-[9px] px-2 py-0.5 rounded"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmUserId(u._id)}
                        className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove Operator"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal Overlay */}
      {selectedPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5">
                <Lock size={16} className="text-primary-700" />
                Change Password: {selectedPassUser.name}
              </h3>
              <button
                onClick={() => setSelectedPassUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleModalSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className="glass-input-no-icon w-full text-sm"
                  placeholder="At least 6 characters"
                  value={modalNewPass}
                  onChange={(e) => setModalNewPass(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  className="glass-input-no-icon w-full text-sm"
                  placeholder="Retype password"
                  value={modalConfirmPass}
                  onChange={(e) => setModalConfirmPass(e.target.value)}
                />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-[11px] text-slate-500 flex gap-2">
                <Info size={14} className="text-slate-400 shrink-0" />
                <span>
                  {selectedPassUser.username === currentUser.username 
                    ? "Changing your own password will require you to log back in immediately." 
                    : "This will update the operator's password and terminate their active sessions on other devices."}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={modalSavingPass}
                  className="btn-primary py-2 px-4 text-xs font-semibold bg-primary-700 hover:bg-primary-850"
                >
                  {modalSavingPass ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPassUser(null)}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className="glass-panel p-6 border border-emerald-250 bg-emerald-50/20 space-y-4 animate-fadeIn mt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-md shadow-emerald-600/10">
              <Download size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-[15px]">Install AgroStock App</h3>
              <p className="text-xs text-slate-500 mt-0.5">Install the application on your home screen or desktop for fast, offline-capable access.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn-primary bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-semibold px-6 self-start flex items-center gap-2"
          >
            <Download size={14} />
            Install Desktop/Mobile App
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
