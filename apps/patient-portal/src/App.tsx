import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  CreditCard,
  Bell,
  User,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  RefreshCw,
  LogOut,
  ChevronRight,
  Download,
  Building2,
  Stethoscope,
  Pill,
  Heart,
  QrCode,
  ShieldCheck,
  Check,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Receipt,
  Sparkles,
  Printer,
} from 'lucide-react';
import type {
  PatientPortalProfile,
  PatientDashboardDto,
  AppointmentEntity,
  BillingInvoiceEntity,
  PatientNotificationEntity,
  PrescriptionEntity,
  LabReportEntity,
  AvailableSlotsResponse,
  PatientMedicalRecordsResponse,
  AppointmentType,
  PaymentMethod,
} from '@medikiosk/shared-types';
import {
  patientLogin,
  patientRegister,
  getPatientDashboard,
  getPatientProfile,
  updatePatientProfile,
  getPatientAppointments,
  bookPatientAppointment,
  reschedulePatientAppointment,
  cancelPatientAppointment,
  getAvailableAppointmentSlots,
  getPatientPrescriptions,
  getPatientLabReports,
  getPatientMedicalRecords,
  getPatientBillingInvoices,
  payPatientInvoice,
  getPatientNotifications,
  markPatientNotificationRead,
  markAllPatientNotificationsRead,
} from '@medikiosk/api-client';

type TabType = 'dashboard' | 'appointments' | 'records' | 'prescriptions' | 'billing' | 'notifications' | 'profile';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medikiosk_patient_token'));
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [profile, setProfile] = useState<PatientPortalProfile | null>(null);
  const [dashboard, setDashboard] = useState<PatientDashboardDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentEntity[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionEntity[]>([]);
  const [labReports, setLabReports] = useState<LabReportEntity[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<PatientMedicalRecordsResponse | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoiceEntity[]>([]);
  const [notifications, setNotifications] = useState<PatientNotificationEntity[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotsResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState('aarav.sharma@medikiosk.local');
  const [loginPassword, setLoginPassword] = useState('MediKiosk@123');

  // Register Form State
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'B+',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<AppointmentEntity | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<AppointmentEntity | null>(null);
  const [showPayModal, setShowPayModal] = useState<BillingInvoiceEntity | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<BillingInvoiceEntity | null>(null);
  const [showRxModal, setShowRxModal] = useState<PrescriptionEntity | null>(null);
  const [showLabModal, setShowLabModal] = useState<LabReportEntity | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Booking Form
  const [bookForm, setBookForm] = useState({
    departmentId: '',
    doctorId: '',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    type: 'IN_PERSON' as AppointmentType,
    reason: '',
    notes: '',
  });

  // Reschedule Form
  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: '',
    timeSlot: '11:00 AM',
    reason: '',
  });

  // Cancel Form
  const [cancelReason, setCancelReason] = useState('');

  // Payment Form
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('patient@okhdfcbank');

  // Edit Profile Form
  const [editProfileData, setEditProfileData] = useState({
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Load Data
  const loadPortalData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dash, appts, rx, labs, bills, notifs, slots] = await Promise.all([
        getPatientDashboard().catch(() => null),
        getPatientAppointments().catch(() => []),
        getPatientPrescriptions().catch(() => []),
        getPatientLabReports().catch(() => []),
        getPatientBillingInvoices().catch(() => []),
        getPatientNotifications().catch(() => []),
        getAvailableAppointmentSlots().catch(() => null),
      ]);

      if (dash) {
        setDashboard(dash);
        setProfile(dash.patient);
        setEditProfileData({
          phone: dash.patient.phone ?? '',
          email: dash.patient.email ?? '',
          address: dash.patient.address ?? '',
          bloodGroup: dash.patient.bloodGroup ?? '',
          emergencyContact: dash.patient.emergencyContact ?? '',
          emergencyPhone: dash.patient.emergencyPhone ?? '',
        });
      }
      setAppointments(appts);
      setPrescriptions(rx);
      setLabReports(labs);
      setInvoices(bills);
      setNotifications(notifs);
      setAvailableSlots(slots);
      if (slots && slots.departments.length > 0 && !bookForm.departmentId) {
        setBookForm((prev) => ({
          ...prev,
          departmentId: slots.departments[0].id,
          doctorId: slots.doctors[0]?.id ?? '',
        }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPortalData();
    }
  }, [token]);

  const showNotificationToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Login Handler
  const handleLogin = async (e?: React.FormEvent, isDemo = false, demoId?: string) => {
    if (e) e.preventDefault();
    setActionLoading(true);
    try {
      const res = await patientLogin({
        identifier: isDemo ? demoId || 'demo-patient-001' : loginIdentifier,
        password: isDemo ? undefined : loginPassword,
        isDemo,
      });
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showNotificationToast(`Welcome back, ${res.patient.fullName}!`);
    } catch (err: any) {
      showNotificationToast(err.message || 'Login failed. Please check your credentials.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await patientRegister(regForm);
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showNotificationToast(`Account registered successfully! Welcome, ${res.patient.fullName}.`);
    } catch (err: any) {
      showNotificationToast(err.message || 'Registration failed.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('medikiosk_patient_token');
    setToken(null);
    setProfile(null);
    setDashboard(null);
    setActiveTab('dashboard');
  };

  // Book Appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.reason.trim()) {
      showNotificationToast('Please describe your symptoms or reason for visit.', true);
      return;
    }
    setActionLoading(true);
    try {
      const created = await bookPatientAppointment(bookForm);
      setAppointments((prev) => [created, ...prev]);
      setShowBookModal(false);
      setBookForm((prev) => ({ ...prev, reason: '', notes: '' }));
      showNotificationToast('Appointment booked & confirmed successfully!');
      loadPortalData();
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to book appointment.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule Appointment
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRescheduleModal) return;
    setActionLoading(true);
    try {
      const updated = await reschedulePatientAppointment(showRescheduleModal.id, rescheduleForm);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setShowRescheduleModal(null);
      showNotificationToast('Appointment rescheduled successfully!');
      loadPortalData();
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to reschedule appointment.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async () => {
    if (!showCancelModal) return;
    if (!cancelReason.trim()) {
      showNotificationToast('Please provide a reason for cancellation.', true);
      return;
    }
    setActionLoading(true);
    try {
      const cancelled = await cancelPatientAppointment(showCancelModal.id, { reason: cancelReason });
      setAppointments((prev) => prev.map((a) => (a.id === cancelled.id ? cancelled : a)));
      setShowCancelModal(null);
      setCancelReason('');
      showNotificationToast('Appointment has been cancelled.');
      loadPortalData();
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to cancel appointment.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Pay Invoice
  const handlePayInvoice = async () => {
    if (!showPayModal) return;
    setActionLoading(true);
    try {
      const paid = await payPatientInvoice(showPayModal.id, {
        paymentMethod,
        transactionReference: `UPI-${Date.now().toString().slice(-8)}`,
      });
      setInvoices((prev) => prev.map((inv) => (inv.id === paid.id ? paid : inv)));
      setShowPayModal(null);
      setShowReceiptModal(paid);
      showNotificationToast(`Payment of ₹${paid.netAmount.toFixed(2)} received successfully!`);
      loadPortalData();
    } catch (err: any) {
      showNotificationToast(err.message || 'Payment processing failed.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Mark All Notifications Read
  const handleMarkAllNotifsRead = async () => {
    try {
      await markAllPatientNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showNotificationToast('All notifications marked as read.');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updated = await updatePatientProfile(editProfileData);
      setProfile(updated);
      setShowEditProfileModal(false);
      showNotificationToast('Profile information updated successfully!');
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to update profile.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // If not authenticated, render Login & Registration Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col justify-between">
        {/* Header */}
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-lg shadow-emerald-500/10">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                MediKiosk
              </span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Patient Portal
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ABDM & FHIR R4 Compliant Healthcare System
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-black/30 p-1 mb-6 border border-white/5">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  authMode === 'login' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  authMode === 'register' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                New Patient
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email / Phone / Patient ID
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    placeholder="e.g. aarav.sharma@medikiosk.local or 9999900001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Sign In to Patient Portal
                </button>

                {/* 1-Click Demo Logins */}
                <div className="pt-4 border-t border-white/10">
                  <div className="text-xs font-medium text-slate-400 mb-2.5 flex items-center justify-between">
                    <span>⚡ Quick 1-Click Demo Profiles</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Instant Access</span>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleLogin(undefined, true, 'demo-patient-001')}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="font-semibold text-emerald-300 group-hover:text-emerald-200">Aarav Sharma (39M)</div>
                        <div className="text-[11px] text-slate-400">Cardiology Patient • Active Rx & Appointments</div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-white">Sign In &rarr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin(undefined, true, 'demo-patient-002')}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="font-semibold text-teal-300 group-hover:text-teal-200">Priya Verma (32F)</div>
                        <div className="text-[11px] text-slate-400">General Medicine • Lab Reports Ready</div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-white">Sign In &rarr;</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="10-digit number"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="name@email.com"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Gender</label>
                    <select
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                      className="w-full px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Blood Group</label>
                    <select
                      value={regForm.bloodGroup}
                      onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                      className="w-full px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Birth Date</label>
                    <input
                      type="date"
                      value={regForm.dateOfBirth}
                      onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                      className="w-full px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Create Password *</label>
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg transition-all flex items-center justify-center gap-2 mt-3"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Register & Create Digital ABHA Profile
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-slate-500 border-t border-white/10">
          MediKiosk Hospital Management System • Smart Kiosks, Doctor Stations & Integrated Patient Portal
        </footer>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">MediKiosk</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Patient Portal
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              AIIMS New Delhi — OPD Digital Care
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications Trigger */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick Profile Pill */}
          <div
            onClick={() => setActiveTab('profile')}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              {profile?.fullName ? profile.fullName.charAt(0) : 'P'}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">{profile?.fullName ?? 'Patient'}</div>
              <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                {profile?.abhaId ? profile.abhaId.slice(0, 12) + '...' : 'ABDM Linked'}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-header Tabs */}
      <nav className="bg-white border-b border-slate-200 px-6 py-2 overflow-x-auto flex items-center gap-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'appointments', label: 'Appointments', icon: Calendar, badge: appointments.filter(a => a.status === 'CONFIRMED').length },
          { id: 'records', label: 'Medical Records', icon: FileText },
          { id: 'prescriptions', label: 'Prescriptions & Labs', icon: Pill, badge: prescriptions.length },
          { id: 'billing', label: 'Billing & Payments', icon: CreditCard, badge: invoices.filter(i => i.status === 'PENDING').length },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
          { id: 'profile', label: 'My Health ID & ABHA', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Toast Notifications */}
      {errorMsg && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
            &times;
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-medium">Syncing health records with AIIMS Hospital Network...</p>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Hero Patient Welcome Card */}
                <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-80 h-full bg-white/5 skew-x-12 pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-2">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified ABDM Patient Profile
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight">Namaste, {profile?.fullName}!</h1>
                      <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                        Welcome to your unified clinical portal. View live doctor consultations, book OPD tokens,
                        track pharmacy prescriptions, and access verified hospital test reports.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowBookModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-md transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Book Appointment
                      </button>
                      <button
                        onClick={() => setActiveTab('records')}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Medical History
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    onClick={() => setActiveTab('appointments')}
                    className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Upcoming Visits</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{dashboard?.counts.appointments ?? 0}</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      {dashboard?.upcomingAppointment ? 'Next visit scheduled' : 'No upcoming visits'}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('prescriptions')}
                    className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Prescriptions</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Pill className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{dashboard?.counts.prescriptions ?? 0}</div>
                    <div className="text-[11px] text-blue-600 font-medium mt-1">Active medication schedules</div>
                  </div>

                  <div
                    onClick={() => setActiveTab('prescriptions')}
                    className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Lab Reports</span>
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{labReports.length}</div>
                    <div className="text-[11px] text-purple-600 font-medium mt-1">Verified pathology tests</div>
                  </div>

                  <div
                    onClick={() => setActiveTab('billing')}
                    className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Pending Invoices</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-amber-600">{dashboard?.counts.pendingInvoices ?? 0}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">Online UPI / Card payments</div>
                  </div>
                </div>

                {/* Next Appointment Card & Vitals Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Next Appointment Detailed Widget */}
                  <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <h2 className="font-bold text-sm text-slate-900">Next Scheduled Appointment</h2>
                      </div>
                      <button
                        onClick={() => setShowBookModal(true)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        + Book New
                      </button>
                    </div>

                    {dashboard?.upcomingAppointment ? (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                              {dashboard.upcomingAppointment.status}
                            </span>
                            <h3 className="font-bold text-base text-slate-900">
                              {dashboard.upcomingAppointment.reason}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {dashboard.upcomingAppointment.doctorName
                                ? `Consultant: ${dashboard.upcomingAppointment.doctorName}`
                                : 'Specialist Assigned'}
                              {' • '}
                              {dashboard.upcomingAppointment.departmentName ?? 'OPD Department'}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-bold text-emerald-800">
                              {new Date(dashboard.upcomingAppointment.appointmentDate).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-xs font-semibold text-slate-600 flex items-center sm:justify-end gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              {dashboard.upcomingAppointment.timeSlot}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            Location: {dashboard.upcomingAppointment.facilityName ?? 'AIIMS Main OPD Block'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setShowRescheduleModal(dashboard.upcomingAppointment);
                                setRescheduleForm({
                                  appointmentDate: dashboard.upcomingAppointment!.appointmentDate.split('T')[0],
                                  timeSlot: dashboard.upcomingAppointment!.timeSlot,
                                  reason: '',
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-medium"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => setShowCancelModal(dashboard.upcomingAppointment)}
                              className="px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">No active appointments scheduled</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Book an OPD consultation in seconds</p>
                        <button
                          onClick={() => setShowBookModal(true)}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-all"
                        >
                          Book OPD Appointment
                        </button>
                      </div>
                    )}

                    {/* Recent Timeline Activity */}
                    <div className="mt-5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                        Recent Clinical Activity
                      </h3>
                      <div className="space-y-2">
                        {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
                          dashboard.recentActivity.map((act) => (
                            <div
                              key={act.id}
                              className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div>
                                  <div className="font-semibold text-slate-800">{act.title}</div>
                                  <div className="text-[11px] text-slate-500">{act.description}</div>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(act.date).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400">No recorded activity yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vitals Summary & ABHA Quick Card */}
                  <div className="space-y-6">
                    {/* Vitals */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <h2 className="font-bold text-sm text-slate-900">Recorded Vitals</h2>
                        </div>
                        <span className="text-[10px] text-slate-400">Latest Kiosk Scan</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase">Blood Pressure</div>
                          <div className="text-base font-bold text-slate-900 mt-0.5">120/80</div>
                          <div className="text-[10px] text-emerald-600 font-medium">Normal</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase">Heart Rate</div>
                          <div className="text-base font-bold text-slate-900 mt-0.5">72 bpm</div>
                          <div className="text-[10px] text-emerald-600 font-medium">Resting</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase">SpO2 Oxygen</div>
                          <div className="text-base font-bold text-slate-900 mt-0.5">98%</div>
                          <div className="text-[10px] text-emerald-600 font-medium">Optimal</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase">Blood Group</div>
                          <div className="text-base font-bold text-emerald-700 mt-0.5">{profile?.bloodGroup ?? 'B+'}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Verified</div>
                        </div>
                      </div>
                    </div>

                    {/* ABHA Digital Card Preview */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
                          ABHA • Digital Health ID
                        </span>
                        <QrCode className="w-5 h-5 text-indigo-300" />
                      </div>
                      <div className="text-base font-bold">{profile?.fullName}</div>
                      <div className="text-xs text-indigo-200/80 font-mono mt-1 tracking-wider">
                        {profile?.abhaId ?? '91-4821-1001-2001'}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-200/70">
                        <span>DOB: {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '14 Mar 1985'}</span>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="text-white hover:text-emerald-300 font-semibold flex items-center gap-1"
                        >
                          View Card &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. APPOINTMENTS VIEW */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Hospital Appointments & Tokens</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Book new OPD appointments, reschedule upcoming sessions, or review past consultation history.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBookModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" /> Book New Appointment
                  </button>
                </div>

                {/* Appointments List */}
                <div className="space-y-3">
                  {appointments.length > 0 ? (
                    appointments.map((appt) => {
                      const isUpcoming = appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED' || appt.status === 'RESCHEDULED';
                      return (
                        <div
                          key={appt.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                isUpcoming
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : appt.status === 'COMPLETED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isUpcoming
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : appt.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {appt.status}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs font-medium text-slate-600">
                                  {appt.type.replace('_', ' ')}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm text-slate-900 mt-1">{appt.reason}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {appt.doctorName ? `Doctor: ${appt.doctorName}` : 'General OPD Doctor'}
                                {' • '}
                                {appt.departmentName ?? 'General OPD'}
                                {' • '}
                                {appt.facilityName ?? 'AIIMS New Delhi'}
                              </p>
                              {appt.notes && (
                                <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded-md inline-block">
                                  Notes: {appt.notes}
                                </p>
                              )}
                              {appt.cancellationReason && (
                                <p className="text-[11px] text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md inline-block">
                                  Cancellation reason: {appt.cancellationReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="text-left md:text-right">
                              <div className="text-sm font-bold text-slate-900">
                                {new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="text-xs font-semibold text-emerald-700 flex items-center md:justify-end gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {appt.timeSlot}
                              </div>
                            </div>

                            {isUpcoming && (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => {
                                    setShowRescheduleModal(appt);
                                    setRescheduleForm({
                                      appointmentDate: appt.appointmentDate.split('T')[0],
                                      timeSlot: appt.timeSlot,
                                      reason: '',
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => setShowCancelModal(appt)}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="font-bold text-sm text-slate-700">No appointments recorded yet</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        You can book in-person OPD clinics or follow-up reviews directly through the hospital network.
                      </p>
                      <button
                        onClick={() => setShowBookModal(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md shadow-emerald-500/20"
                      >
                        Book First Appointment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. MEDICAL RECORDS & TIMELINE */}
            {activeTab === 'records' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Personal Health & Medical Records</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified longitudinal health record verified by AIIMS New Delhi and ABDM Digital Care.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Timeline */}
                  <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    <h2 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" /> Clinical History & Timeline
                    </h2>

                    <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {[
                        {
                          title: 'Cardiology Super-Specialist Review',
                          date: '1 Sep 2026',
                          department: 'Cardiology OPD',
                          desc: 'Reported episodic chest tightness on exertion. ECG recorded normal sinus rhythm. Prescribed Tab. Atorvastatin 20mg & Ramipril 2.5mg.',
                          doctor: 'Dr. Rohan Mehta',
                        },
                        {
                          title: 'MediKiosk Intake & Vitals Assessment',
                          date: '1 Sep 2026',
                          department: 'OPD Intake Kiosk #014',
                          desc: 'Patient verified via RFID Card. Chief complaint: Chest discomfort. Automated vitals: BP 130/84 mmHg, SpO2 98%, HR 76 bpm.',
                          doctor: 'Automated Kiosk Terminal',
                        },
                        {
                          title: 'Annual Comprehensive Health Checkup',
                          date: '12 May 2026',
                          department: 'General Medicine',
                          desc: 'Routine annual physical exam and fasting metabolic screening. Advised active exercise and low-glycemic dietary balance.',
                          doctor: 'Dr. Rajesh Sharma',
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="relative pl-8">
                          <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                {item.department}
                              </span>
                              <span className="text-xs text-slate-500">{item.date}</span>
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 mt-2">{item.title}</h3>
                            <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Attending: {item.doctor}</span>
                              <span className="text-emerald-600 font-medium">Verified Record</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: ABDM Card & Summary */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-emerald-300" />
                        </div>
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                          Digital Health Card
                        </span>
                      </div>
                      <div className="text-xl font-bold">{profile?.fullName}</div>
                      <div className="text-xs text-emerald-200 font-mono mt-1">
                        ABHA ID: {profile?.abhaId ?? '91-4821-1001-2001'}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/15 space-y-1.5 text-xs text-emerald-100/90">
                        <div className="flex justify-between">
                          <span className="text-emerald-200/60">Phone:</span>
                          <span>{profile?.phone ?? '+91 99999 00001'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-200/60">Blood Group:</span>
                          <span className="font-bold">{profile?.bloodGroup ?? 'B+'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-200/60">Facility:</span>
                          <span>AIIMS New Delhi</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      <h3 className="font-bold text-sm text-slate-900 mb-2">Ayushman Bharat Digital Mission</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Your health record is securely indexed on the national health registry. Consent is required
                        before clinical records are shared with any external hospital.
                      </p>
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Consent status: Active & Granted</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PRESCRIPTIONS & LAB REPORTS */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Prescriptions & Diagnostic Lab Reports</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View verified prescriptions issued by hospital doctors and access pathology biomarker test reports.
                  </p>
                </div>

                {/* Dual Section Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Prescriptions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-emerald-600" /> Active Prescriptions
                      </h2>
                      <span className="text-xs text-slate-500">{prescriptions.length} Records</span>
                    </div>

                    {prescriptions.length > 0 ? (
                      prescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                Diagnosis: {rx.diagnosis}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Prescribed by: <span className="font-semibold text-slate-800">{rx.doctorName ?? 'Consultant Physician'}</span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(rx.prescriptionDate).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Medicines list */}
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                            {rx.medications.map((m, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                                <div>
                                  <span className="font-bold text-slate-900">{m.name}</span>{' '}
                                  <span className="text-slate-500">({m.dosage})</span>
                                  <div className="text-[11px] text-emerald-700">{m.instructions}</div>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">
                                    {m.frequency}
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{m.duration}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-500 italic text-[11px]">
                              {rx.instructions ?? 'Take medications as prescribed.'}
                            </span>
                            <button
                              onClick={() => setShowRxModal(rx)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Rx
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                        No active prescriptions found.
                      </div>
                    )}
                  </div>

                  {/* Lab Reports */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" /> Pathology & Lab Reports
                      </h2>
                      <span className="text-xs text-slate-500">{labReports.length} Reports</span>
                    </div>

                    {labReports.map((lab) => (
                      <div
                        key={lab.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                              {lab.category}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 mt-1">{lab.title}</h3>
                            <p className="text-xs text-slate-500">{lab.facilityName ?? 'AIIMS Central Lab'}</p>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(lab.testDate).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Parameters table */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-200">
                                <th className="pb-1.5 font-semibold">Test Parameter</th>
                                <th className="pb-1.5 font-semibold">Value</th>
                                <th className="pb-1.5 font-semibold">Reference</th>
                                <th className="pb-1.5 font-semibold text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60">
                              {lab.parameters.map((param, pidx) => (
                                <tr key={pidx} className="py-1.5">
                                  <td className="py-1 font-medium text-slate-800">{param.name}</td>
                                  <td className="py-1 font-bold text-slate-900">
                                    {param.value} <span className="text-[10px] text-slate-400 font-normal">{param.unit}</span>
                                  </td>
                                  <td className="py-1 text-[11px] text-slate-500">{param.referenceRange}</td>
                                  <td className="py-1 text-right">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        param.status === 'NORMAL'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {param.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 text-[11px]">{lab.doctorNotes}</span>
                          <button
                            onClick={() => setShowLabModal(lab)}
                            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. BILLING & INVOICES */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Billing & Payment History</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review itemized hospital invoices, pay outstanding OPD charges securely, and download receipts.
                  </p>
                </div>

                {/* Invoices List */}
                <div className="space-y-3">
                  {invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-mono font-bold text-slate-600">
                              #{inv.invoiceNumber}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 mt-1">{inv.description}</h3>
                          <p className="text-xs text-slate-500">
                            Department: {inv.department ?? 'General OPD'}
                            {inv.paymentMethod && ` • Paid via ${inv.paymentMethod}`}
                            {inv.transactionReference && ` • Ref: ${inv.transactionReference}`}
                          </p>
                          {/* Itemized preview */}
                          {inv.items && inv.items.length > 0 && (
                            <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg space-y-1">
                              {inv.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{item.description}</span>
                                  <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="text-left md:text-right">
                            <div className="text-xs text-slate-400">Total Net Amount</div>
                            <div className="text-xl font-bold text-slate-900">₹{inv.netAmount.toFixed(2)}</div>
                          </div>

                          {inv.status === 'PENDING' ? (
                            <button
                              onClick={() => setShowPayModal(inv)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay Now
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowReceiptModal(inv)}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Download Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                      No invoices recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. NOTIFICATIONS CENTER */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Notifications & Alerts</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time clinical updates, appointment reminders, and lab result alerts.
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllNotifsRead}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                          notif.read ? 'bg-white' : 'bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              notif.type.includes('APPOINTMENT')
                                ? 'bg-blue-100 text-blue-700'
                                : notif.type.includes('BILL')
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-900">{notif.title}</h3>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 inline-block">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {!notif.read && (
                          <button
                            onClick={async () => {
                              await markPatientNotificationRead(notif.id);
                              setNotifications((prev) =>
                                prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
                              );
                            }}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">No notifications at this time.</div>
                  )}
                </div>
              </div>
            )}

            {/* 7. PROFILE & ABHA HEALTH ID */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Patient Profile & Digital Health ID</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official demographic profile, emergency contacts, and ABDM verified health card.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: ABHA Card */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-300" />
                          <span className="font-bold text-xs uppercase tracking-wider text-emerald-200">
                            National Health Authority
                          </span>
                        </div>
                        <QrCode className="w-6 h-6 text-emerald-300" />
                      </div>

                      <div className="my-3">
                        <div className="text-xl font-bold text-white">{profile?.fullName}</div>
                        <div className="text-xs text-emerald-200 font-mono mt-1 tracking-wider">
                          {profile?.abhaId ?? '91-4821-1001-2001'}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-emerald-100/80 pt-3 border-t border-white/10">
                        <div className="flex justify-between">
                          <span className="text-emerald-300/70">Gender / DOB:</span>
                          <span>
                            {profile?.gender ?? 'Male'},{' '}
                            {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '14/03/1985'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-300/70">Blood Group:</span>
                          <span className="font-bold">{profile?.bloodGroup ?? 'B+'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-300/70">Mobile:</span>
                          <span>{profile?.phone ?? '+91 9999900001'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowEditProfileModal(true)}
                      className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold text-xs text-slate-700 flex items-center justify-center gap-2"
                    >
                      Edit Profile & Contacts
                    </button>
                  </div>

                  {/* Right: Demographic Details Table */}
                  <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                      Demographic & Registration Information
                    </h2>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Full Legal Name</span>
                        <span className="font-bold text-slate-800 text-sm">{profile?.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">ABHA Health ID</span>
                        <span className="font-mono font-bold text-slate-800">{profile?.abhaId ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Phone Number</span>
                        <span className="font-medium text-slate-800">{profile?.phone ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Email Address</span>
                        <span className="font-medium text-slate-800">{profile?.email ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Residential Address</span>
                        <span className="font-medium text-slate-800">{profile?.address ?? 'New Delhi, India'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Blood Group</span>
                        <span className="font-bold text-emerald-700">{profile?.bloodGroup ?? 'B+'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Emergency Contact</span>
                        <span className="font-medium text-slate-800">{profile?.emergencyContact ?? 'Family Member'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Emergency Phone</span>
                        <span className="font-medium text-slate-800">{profile?.emergencyPhone ?? '+91 98100 98100'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: Book Appointment */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Schedule OPD Appointment</h3>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Specialty *</label>
                <select
                  value={bookForm.departmentId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const firstDoc = availableSlots?.doctors.find((d) => d.departmentId === deptId);
                    setBookForm({
                      ...bookForm,
                      departmentId: deptId,
                      doctorId: firstDoc?.id ?? '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                >
                  {availableSlots?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor (Optional)</label>
                <select
                  value={bookForm.doctorId}
                  onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Any Available Specialist</option>
                  {availableSlots?.doctors
                    .filter((doc) => !bookForm.departmentId || doc.departmentId === bookForm.departmentId)
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookForm.appointmentDate}
                    onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={bookForm.timeSlot}
                    onChange={(e) => setBookForm({ ...bookForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                  >
                    {availableSlots?.slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit / Symptoms *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest tightness, blood pressure review, routine checkup"
                  value={bookForm.reason}
                  onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Any previous medications or existing health conditions..."
                  value={bookForm.notes}
                  onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm & Generate OPD Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reschedule Appointment */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Reschedule Appointment</h3>
              <button onClick={() => setShowRescheduleModal(null)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleReschedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Consultation Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleForm.appointmentDate}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, appointmentDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Time Slot *</label>
                <select
                  value={rescheduleForm.timeSlot}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                >
                  {availableSlots?.slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Rescheduling</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule conflict"
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md"
                >
                  Update Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Appointment */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Cancel Appointment</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your appointment for{' '}
              <span className="font-semibold text-slate-900">{showCancelModal.reason}</span> on{' '}
              {new Date(showCancelModal.appointmentDate).toLocaleDateString()} at {showCancelModal.timeSlot}?
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Feeling better, unable to travel"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelAppointment}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 shadow-md"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pay Invoice Checkout */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Hospital Checkout & Payment</h3>
              </div>
              <button onClick={() => setShowPayModal(null)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Invoice Number:</span>
                <span className="font-mono font-bold text-slate-800">#{showPayModal.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Description:</span>
                <span className="font-medium text-slate-800">{showPayModal.description}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 mt-3 pt-2 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="text-emerald-700">₹{showPayModal.netAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR Code', icon: QrCode },
                  { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
                  { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard },
                  { id: 'NET_BANKING', label: 'Net Banking', icon: Building2 },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        paymentMethod === m.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">UPI Virtual ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400">Supported apps: Google Pay, PhonePe, Paytm, BHIM</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPayModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePayInvoice}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md flex items-center gap-1.5"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Pay ₹{showPayModal.netAmount.toFixed(2)} Securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Payment Receipt */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Hospital Payment Receipt</h3>
              <p className="text-xs text-slate-500">AIIMS New Delhi — Digital Healthcare Billing</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-mono font-bold text-slate-800">REC-{showReceiptModal.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Patient Name:</span>
                <span className="font-semibold text-slate-800">{profile?.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold text-slate-800">{showReceiptModal.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Transaction Ref:</span>
                <span className="font-mono text-slate-800">{showReceiptModal.transactionReference}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold text-slate-900 pt-2">
                <span>Amount Paid:</span>
                <span className="text-emerald-700">₹{showReceiptModal.netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReceiptModal(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Prescription Print Preview */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">AIIMS Hospital e-Prescription</h3>
                <p className="text-xs text-slate-500">Department of Cardiology & Internal Medicine</p>
              </div>
              <button onClick={() => setShowRxModal(null)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>Patient: <span className="font-bold text-slate-800">{profile?.fullName}</span></div>
                <div>Date: <span className="font-bold text-slate-800">{new Date(showRxModal.prescriptionDate).toLocaleDateString()}</span></div>
                <div>Diagnosis: <span className="font-bold text-slate-800">{showRxModal.diagnosis}</span></div>
                <div>Doctor: <span className="font-bold text-slate-800">{showRxModal.doctorName ?? 'Senior Consultant'}</span></div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-emerald-800">
                  Rx Medications & Dosage
                </div>
                {showRxModal.medications.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 flex justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{m.name} ({m.dosage})</div>
                      <div className="text-slate-500 text-[11px]">{m.instructions}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-700">{m.frequency}</div>
                      <div className="text-slate-400 text-[10px]">{m.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRxModal(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Lab Report Viewer */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{showLabModal.title}</h3>
                <p className="text-xs text-slate-500">{showLabModal.facilityName ?? 'AIIMS Pathology Services'}</p>
              </div>
              <button onClick={() => setShowLabModal(null)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2">
                <div>Patient: <span className="font-bold text-slate-900">{profile?.fullName}</span></div>
                <div>Test Date: <span className="font-bold text-slate-900">{new Date(showLabModal.testDate).toLocaleDateString()}</span></div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="p-2">Biomarker</th>
                      <th className="p-2">Observed</th>
                      <th className="p-2">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showLabModal.parameters.map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-slate-800">{p.name}</td>
                        <td className="p-2 font-bold text-slate-900">{p.value} {p.unit}</td>
                        <td className="p-2 text-slate-500">{p.referenceRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                Doctor's Observation: {showLabModal.doctorNotes ?? 'Values within expected parameters.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLabModal(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Profile */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Update Profile Details</h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editProfileData.phone}
                  onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editProfileData.email}
                  onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editProfileData.address}
                  onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editProfileData.emergencyContact}
                    onChange={(e) => setEditProfileData({ ...editProfileData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={editProfileData.emergencyPhone}
                    onChange={(e) => setEditProfileData({ ...editProfileData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
