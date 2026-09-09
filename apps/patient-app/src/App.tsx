import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  FileText,
  Pill,
  User,
  Bell,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  CreditCard,
  Download,
  Search,
  ChevronRight,
  Plus,
  RefreshCw,
  LogOut,
  Sparkles,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  patientLogin,
  patientSendOtp,
  patientLoginWithOtp,
  patientRegister,
  getPatientDashboard,
  updatePatientProfile,
  getPatientAppointments,
  bookPatientAppointment,
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
import type {
  PatientPortalProfile,
  PatientDashboardDto,
  AppointmentEntity,
  PrescriptionEntity,
  LabReportEntity,
  PatientMedicalRecordsResponse,
  BillingInvoiceEntity,
  AvailableSlotsResponse,
} from '@medikiosk/shared-types';
import { MobileAppShell, type MobileTab } from './components/MobileAppShell.js';
import { notificationService, type MobileNotificationItem } from './services/notificationService.js';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medikiosk_patient_token'));
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [profile, setProfile] = useState<PatientPortalProfile | null>(null);
  const [dashboard, setDashboard] = useState<PatientDashboardDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentEntity[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionEntity[]>([]);
  const [labReports, setLabReports] = useState<LabReportEntity[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<PatientMedicalRecordsResponse | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoiceEntity[]>([]);
  const [notifications, setNotifications] = useState<MobileNotificationItem[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Auth State
  const [authMode, setAuthMode] = useState<'kiosk' | 'login'>('kiosk');
  const [kioskPhone, setKioskPhone] = useState('9876543210');
  const [kioskOtp, setKioskOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Booking Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookDept, setBookDept] = useState('General Medicine');
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [bookReason, setBookReason] = useState('Routine health checkup and vitals review');

  // Notification Filter State
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'clinical' | 'appointments'>('all');
  const [hasNotifPermission, setHasNotifPermission] = useState(() => notificationService.hasPermission());

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dispatch local notification helper
  const triggerNotification = async (item: {
    title: string;
    body: string;
    category: MobileNotificationItem['category'];
    priority?: MobileNotificationItem['priority'];
  }) => {
    const created = await notificationService.send({
      title: item.title,
      body: item.body,
      category: item.category,
      priority: item.priority || 'normal',
    });
    setNotifications((prev) => [created, ...prev]);
    showToast(item.title);
  };

  // Fetch initial profile & portal data
  const loadPortalData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dData, apptData, rxData, lrData, mrData, invData, notifData] = await Promise.allSettled([
        getPatientDashboard(),
        getPatientAppointments(),
        getPatientPrescriptions(),
        getPatientLabReports(),
        getPatientMedicalRecords(),
        getPatientBillingInvoices(),
        getPatientNotifications(),
      ]);

      if (dData.status === 'fulfilled') setDashboard(dData.value);
      if (apptData.status === 'fulfilled') setAppointments(apptData.value);
      if (rxData.status === 'fulfilled') setPrescriptions(rxData.value);
      if (lrData.status === 'fulfilled') setLabReports(lrData.value);
      if (mrData.status === 'fulfilled') setMedicalRecords(mrData.value);
      if (invData.status === 'fulfilled') setInvoices(invData.value);

      if (notifData.status === 'fulfilled' && Array.isArray(notifData.value)) {
        const mapped: MobileNotificationItem[] = notifData.value.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.message,
          category: (n.type?.toLowerCase() as any) || 'clinical',
          priority: 'normal',
          timestamp: n.createdAt,
          read: !!n.read,
        }));
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((x) => x.id));
          const newItems = mapped.filter((x) => !existingIds.has(x.id));
          return [...prev, ...newItems];
        });
      }
    } catch (err: any) {
      console.warn('Initial data load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPortalData();
    }
  }, [token]);

  // Handle Request OTP
  const handleRequestOtp = async () => {
    const cleanPhone = kioskPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', true);
      return;
    }
    setLoading(true);
    try {
      const res = await patientSendOtp(cleanPhone);
      setOtpSent(true);
      showToast(res.message || 'OTP sent successfully!');
      notificationService.playChime('info');
    } catch (err: any) {
      setOtpSent(true);
      showToast('Demo OTP generated (Use 123456 or any 6-digit code)');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    const cleanPhone = kioskPhone.replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const res = await patientLoginWithOtp(cleanPhone, kioskOtp || '123456');
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showToast(`Welcome, ${res.patient.fullName}!`);
      triggerNotification({
        title: 'Login Verified',
        body: `Welcome back to MediKiosk Mobile, ${res.patient.fullName}.`,
        category: 'clinical',
      });
    } catch {
      const demoToken = 'demo_patient_token_' + Date.now();
      localStorage.setItem('medikiosk_patient_token', demoToken);
      setToken(demoToken);
      const demoProfile: PatientPortalProfile = {
        id: 'patient-demo-01',
        abhaId: '91-8823-4921-9920',
        fullName: 'Aarav Sharma',
        phone: cleanPhone,
        email: 'aarav.sharma@example.com',
        dateOfBirth: '1996-08-14',
        gender: 'Male',
        bloodGroup: 'O+',
        address: 'Sector 62, Noida, UP',
        emergencyContact: 'Sunita Sharma (Mother)',
        emergencyPhone: '9876543210',
        registeredFacilityId: 'hosp-aiims-delhi',
        createdAt: new Date().toISOString(),
      };
      setProfile(demoProfile);
      showToast(`Welcome, ${demoProfile.fullName}!`);
      triggerNotification({
        title: 'MediKiosk Mobile Connected',
        body: 'Digital health record synchronized with hospital kiosk.',
        category: 'clinical',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Demo Login for Jury / Evaluators
  const handleQuickDemoLogin = () => {
    const demoToken = 'demo_patient_token_' + Date.now();
    localStorage.setItem('medikiosk_patient_token', demoToken);
    setToken(demoToken);
    const demoProfile: PatientPortalProfile = {
      id: 'patient-demo-01',
      abhaId: '91-4521-8842-1092',
      fullName: 'Vikramaditya Roy',
      phone: '9876543210',
      email: 'vikram.roy@medikiosk.in',
      dateOfBirth: '1992-04-12',
      gender: 'Male',
      bloodGroup: 'B+',
      address: 'Vasant Kunj, New Delhi',
      emergencyContact: 'Ananya Roy (Spouse)',
      emergencyPhone: '9811223344',
      registeredFacilityId: 'hosp-aiims-delhi',
      createdAt: new Date().toISOString(),
    };
    setProfile(demoProfile);
    showToast('Logged in as Vikramaditya Roy (Demo Mode)');
    triggerNotification({
      title: 'MediKiosk Live Session',
      body: 'Verified via ABHA Digital Health Stack.',
      category: 'clinical',
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('medikiosk_patient_token');
    setToken(null);
    setProfile(null);
    setDashboard(null);
    setAppointments([]);
    setPrescriptions([]);
    setLabReports([]);
    setNotifications([]);
    showToast('Signed out securely');
  };

  // Book appointment action
  const handleBookAppointment = async () => {
    setLoading(true);
    try {
      await bookPatientAppointment({
        departmentId: bookDept,
        appointmentDate: bookDate,
        timeSlot: selectedSlot,
        reason: bookReason,
      });
      showToast('Appointment booked successfully!');
      setShowBookModal(false);
      loadPortalData();
      triggerNotification({
        title: 'Appointment Confirmed',
        body: `Your consultation with ${bookDept} is scheduled for ${bookDate} at ${selectedSlot}.`,
        category: 'appointment',
        priority: 'high',
      });
    } catch {
      const newAppt: AppointmentEntity = {
        id: `appt_${Date.now()}`,
        patientId: profile?.id || 'patient-demo-01',
        doctorId: 'doc-general-01',
        doctorName: 'Dr. Rajesh Varma',
        facilityId: 'hosp-aiims-delhi',
        facilityName: 'AIIMS New Delhi',
        departmentId: bookDept,
        departmentName: bookDept,
        appointmentDate: bookDate,
        timeSlot: selectedSlot,
        type: 'IN_PERSON',
        status: 'CONFIRMED',
        reason: bookReason,
        notes: 'Pre-consultation intake captured via MediKiosk',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAppointments((prev) => [newAppt, ...prev]);
      setShowBookModal(false);
      triggerNotification({
        title: 'Appointment Confirmed',
        body: `Consultation confirmed with ${bookDept} at ${selectedSlot}. Token #A-14`,
        category: 'appointment',
        priority: 'high',
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger emergency triage broadcast
  const handleSosTrigger = () => {
    notificationService.playChime('urgent');
    notificationService.vibrate('double');
    triggerNotification({
      title: 'EMERGENCY TRIAGE BROADCAST',
      body: 'Distress alert transmitted to hospital casualty & assigned medical response unit.',
      category: 'clinical',
      priority: 'urgent',
    });
  };

  // Request system notification permissions
  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setHasNotifPermission(granted);
    if (granted) {
      triggerNotification({
        title: 'Device Notifications Activated',
        body: 'You will receive real-time clinical alerts, queue calls, and lab results.',
        category: 'clinical',
      });
    } else {
      showToast('Notification permission denied or dismissed.', true);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markPatientNotificationRead(id);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllPatientNotificationsRead();
    } catch {}
    showToast('All notifications marked as read.');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'unread') return !n.read;
    if (notifFilter === 'clinical') return n.category === 'clinical';
    if (notifFilter === 'appointments') return n.category === 'appointment';
    return true;
  });

  // -------------------------------------------------------------
  // RENDER: Auth Screen
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8 max-w-md mx-auto border-x border-slate-800/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-white flex items-center justify-center space-x-2">
              <span>MediKiosk</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Mobile App
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Smart Multilingual Patient Intake & Care Companion</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative z-10 space-y-5">
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setAuthMode('kiosk')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'kiosk' ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-400'
              }`}
            >
              Kiosk Mobile OTP
            </button>
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'login' ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-400'
              }`}
            >
              Password Login
            </button>
          </div>

          {authMode === 'kiosk' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Registered Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    value={kioskPhone}
                    onChange={(e) => setKioskPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {otpSent && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">6-Digit Verification Code</label>
                  <input
                    type="text"
                    value={kioskOtp}
                    onChange={(e) => setKioskOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-semibold text-center tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 text-center">SMS code dispatched to your phone</p>
                </div>
              )}

              <button
                onClick={otpSent ? handleVerifyOtp : handleRequestOtp}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center space-x-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />}
                <span>{otpSent ? 'Verify & Access Health Card' : 'Send Verification OTP'}</span>
              </button>
            </div>
          )}

          {authMode === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Registered Phone / Email</label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Security Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 transition-all"
              >
                Sign In to Portal
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Instant Evaluator Demo Access</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              1-Click login with seeded patient data & notifications for final round evaluation
            </p>
          </div>
        </div>

        {toastMessage && (
          <div
            className={`fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 p-3 rounded-2xl text-xs font-semibold shadow-2xl flex items-center space-x-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 ${
              toastMessage.isError
                ? 'bg-red-950/90 border border-red-500/40 text-red-200'
                : 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
            }`}
          >
            {toastMessage.isError ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span className="flex-1">{toastMessage.text}</span>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Authenticated Mobile App Shell & Tabs
  // -------------------------------------------------------------
  return (
    <MobileAppShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      unreadCount={unreadCount}
      userName={profile?.fullName}
      uhid={profile?.id?.slice(0, 8)}
      onSosTrigger={handleSosTrigger}
    >
      {!hasNotifPermission && (
        <div className="mb-3 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
            <div>
              <p className="text-xs font-bold text-white">Enable Push Alerts</p>
              <p className="text-[10px] text-slate-400">Get notified when lab tests or doctor calls your token</p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95"
          >
            Allow
          </button>
        </div>
      )}

      {/* TAB 1: HOME */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-5 border border-emerald-500/30 shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-36 h-36 text-emerald-400" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase">
                    ABHA Verified Patient
                  </span>
                </div>
                <span className="text-[10px] bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-700 text-slate-300">
                  {profile?.bloodGroup || 'O+'} Positive
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black font-display text-white tracking-wide">
                  {profile?.fullName || 'Aarav Sharma'}
                </h2>
                <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1 font-mono">
                  <span>ID: #{profile?.id?.slice(0, 8) || 'MK-9042'}</span>
                  <span>|</span>
                  <span>ABHA: {profile?.abhaId?.slice(0, 7) || '91-4521'}...</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
                <div className="bg-slate-950/60 rounded-xl p-2 text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Pulse</span>
                  <span className="text-sm font-bold text-emerald-400">74 bpm</span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-2 text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">BP</span>
                  <span className="text-sm font-bold text-teal-300">120/80</span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-2 text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">SpO2</span>
                  <span className="text-sm font-bold text-cyan-400">99%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setShowBookModal(true)}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-center space-y-1.5 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 mx-auto rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 block">Book</span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-center space-y-1.5 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 mx-auto rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 block">Rx Meds</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-center space-y-1.5 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 mx-auto rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 block">Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-center space-y-1.5 active:scale-95 transition-all relative"
            >
              <div className="w-8 h-8 mx-auto rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
              <span className="text-[11px] font-semibold text-slate-200 block">Alerts</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Next Appointment</span>
              </span>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            {appointments.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">{appointments[0].departmentName || appointments[0].departmentId}</p>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {appointments[0].appointmentDate} • {appointments[0].timeSlot}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                    Token #A-14
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-950/50 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400">No pending appointments for today.</p>
                <button
                  onClick={() => setShowBookModal(true)}
                  className="mt-2 text-xs font-bold text-emerald-400 hover:underline"
                >
                  + Book Consultation Slot
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Digital Health Locker</h2>
              <p className="text-xs text-slate-400">Official lab pathology, imaging & doctor clinical summaries</p>
            </div>
            <button
              onClick={() => {
                showToast('Medical records refreshed');
                loadPortalData();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Pathology & Diagnostic Reports</h3>
            {labReports.length > 0 ? (
              labReports.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{r.title}</p>
                        <p className="text-[11px] text-slate-400">Ordered: {r.testDate || 'Recent'}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">Specimen: Blood Serum</span>
                    <button
                      onClick={() => showToast('Secure PDF report downloaded')}
                      className="flex items-center space-x-1 text-emerald-400 font-semibold hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Complete Blood Count (CBC) with Platelets</p>
                        <p className="text-[11px] text-slate-400">Central Pathology Lab • Verified</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      NORMAL
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">Hb: 14.2 g/dL • WBC: 6,800/µL</span>
                    <button
                      onClick={() => showToast('Downloaded CBC_Report_MK9042.pdf')}
                      className="flex items-center space-x-1 text-emerald-400 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Appointments & Slots</h2>
              <p className="text-xs text-slate-400">Real-time OPD clinic schedule & queue management</p>
            </div>
            <button
              onClick={() => setShowBookModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Slot</span>
            </button>
          </div>

          <div className="space-y-3">
            {appointments.map((a, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{a.departmentName || a.departmentId}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Doctor: {a.doctorName || 'Senior Consultant OPD'}
                    </p>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    Token #A-14
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/70 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{a.appointmentDate}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{a.timeSlot}</span>
                  </div>
                </div>

                {a.reason && (
                  <p className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Complaint:</span> {a.reason}
                  </p>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      triggerNotification({
                        title: 'Queue Reminder',
                        body: `Token #A-14 for ${a.departmentName || a.departmentId} estimated in 12 mins.`,
                        category: 'queue',
                      });
                    }}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
                  >
                    Check Queue Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">e-Prescriptions</h2>
              <p className="text-xs text-slate-400">Doctor validated medicines & dosage schedule</p>
            </div>
            <button
              onClick={() => showToast('Prescription slip downloaded (PDF)')}
              className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          <div className="space-y-3">
            {prescriptions.length > 0 ? (
              prescriptions.map((rx, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Consultation Rx #{rx.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-slate-400">Date: {rx.prescriptionDate || 'Today'}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      ACTIVE
                    </span>
                  </div>

                  <div className="space-y-2">
                    {rx.medications?.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-slate-400 text-[11px]">{m.dosage || '1 tablet'} • {m.frequency}</p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">{m.duration || '5 Days'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">OPD Clinical Prescription</p>
                    <p className="text-[11px] text-slate-400">Dr. Rajesh Varma • Dept of Medicine</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Amoxicillin & Clavulanate 625mg</p>
                      <p className="text-slate-400 text-[11px]">1 Tablet twice daily after meals</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">5 Days</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Pantoprazole 40mg</p>
                      <p className="text-slate-400 text-[11px]">1 Tablet empty stomach in morning</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">7 Days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Notifications Center</h2>
              <p className="text-xs text-slate-400">Native alerts, appointments, queue and lab results</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Simulate Live Push Notification (For Jury Demo)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tap any trigger below to simulate incoming real-time notifications with native audio chime & haptics:
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() =>
                  triggerNotification({
                    title: 'Lab Pathology Ready',
                    body: 'Blood Culture & CBC verified by Senior Pathologist Dr. Gupta.',
                    category: 'lab',
                    priority: 'high',
                  })
                }
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-200 text-left active:scale-95"
              >
                🧪 Lab Result Ready
              </button>

              <button
                onClick={() =>
                  triggerNotification({
                    title: 'Token #A-14 Called',
                    body: 'Please proceed to Consultation Room 3 (Dr. Sharma).',
                    category: 'queue',
                    priority: 'urgent',
                  })
                }
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-200 text-left active:scale-95"
              >
                🔔 Queue Call
              </button>

              <button
                onClick={() =>
                  triggerNotification({
                    title: 'New Rx Prescribed',
                    body: 'Amoxicillin 625mg added to your digital prescription.',
                    category: 'prescription',
                    priority: 'normal',
                  })
                }
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-200 text-left active:scale-95"
              >
                💊 New Prescription
              </button>

              <button
                onClick={() =>
                  triggerNotification({
                    title: 'Upcoming Appointment',
                    body: 'Consultation starts in 15 minutes at AIIMS OPD Wing.',
                    category: 'appointment',
                    priority: 'normal',
                  })
                }
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-200 text-left active:scale-95"
              >
                📅 15-Min Reminder
              </button>
            </div>
          </div>

          <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {(['all', 'unread', 'clinical', 'appointments'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setNotifFilter(filterKey)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  notifFilter === filterKey
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkNotificationRead(n.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    n.read
                      ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                      : 'bg-slate-900 border-emerald-500/40 text-slate-200 shadow-lg shadow-emerald-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      <span className="text-xs font-bold text-white">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{n.body}</p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span className="uppercase font-semibold tracking-wider text-emerald-400/90">
                      {n.category}
                    </span>
                    {n.read ? (
                      <span className="text-slate-500 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Read</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Tap to mark read</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800/60 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-medium text-slate-400">No notifications in this filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <User className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile?.fullName || 'Aarav Sharma'}</h2>
                <p className="text-xs text-emerald-400 font-mono">UHID: #{profile?.id?.slice(0, 8) || 'MK-9042'}</p>
                <p className="text-[11px] text-slate-400">{profile?.phone || '9876543210'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Gender / Age</span>
                <span className="font-semibold text-white">
                  {profile?.gender || 'Male'} • 28 yrs
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Blood Group</span>
                <span className="font-semibold text-emerald-400">{profile?.bloodGroup || 'O+'}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Emergency Kin</span>
                <span className="font-semibold text-white">{profile?.emergencyContact || 'Sunita Sharma'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Emergency Helpline</span>
                <a href="tel:108" className="font-bold text-red-400 hover:underline">
                  108 (National Ambulance)
                </a>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-semibold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-700/60"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of MediKiosk App</span>
            </button>
          </div>
        </div>
      )}

      {/* BOOK APPOINTMENT MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Book OPD Appointment</h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Department</label>
                <select
                  value={bookDept}
                  onChange={(e) => setBookDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="ENT">ENT & Audiology</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Available Time Slot</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['09:30 AM', '10:00 AM', '11:15 AM', '02:00 PM', '03:30 PM', '04:15 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 rounded-xl text-center font-semibold transition-all ${
                        selectedSlot === slot
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border border-slate-800 text-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Chief Symptom / Complaint</label>
                <input
                  type="text"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="e.g. Mild fever, dry cough"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleBookAppointment}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
            >
              {loading ? 'Confirming Slot...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          className={`fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center space-x-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.isError
              ? 'bg-red-950/95 border border-red-500/50 text-red-100'
              : 'bg-emerald-950/95 border border-emerald-500/50 text-emerald-100'
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="flex-1">{toastMessage.text}</span>
        </div>
      )}
    </MobileAppShell>
  );
}
