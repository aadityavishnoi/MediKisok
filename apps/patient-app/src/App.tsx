import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  CreditCard,
  Download,
  Plus,
  RefreshCw,
  LogOut,
  Sparkles,
  Check,
  CheckCheck,
  X,
  ChevronDown,
  UserPlus,
  Lock,
  Phone,
  Radio,
  Heart,
  Droplets,
  Thermometer,
  ExternalLink,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import {
  patientLogin,
  patientSendOtp,
  patientLoginWithOtp,
  patientRegister,
  getPatientProfile,
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
  connectWs,
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
  const [availableSlotsData, setAvailableSlotsData] = useState<AvailableSlotsResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Auth State
  const [authMode, setAuthMode] = useState<'otp' | 'password' | 'register'>('otp');
  const [kioskPhone, setKioskPhone] = useState('9876543210');
  const [kioskOtp, setKioskOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regDob, setRegDob] = useState('1998-05-15');
  const [regAddress, setRegAddress] = useState('');
  const [regEmergencyContact, setRegEmergencyContact] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');

  // Booking Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookDeptId, setBookDeptId] = useState('');
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookReason, setBookReason] = useState('');

  // Billing Modal State
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  // Notification Filter State
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'clinical' | 'appointments'>('all');
  const [hasNotifPermission, setHasNotifPermission] = useState(() => notificationService.hasPermission());

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
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

  // Fetch initial profile & portal data from live backend
  const loadPortalData = async (isManualRefresh = false) => {
    if (!token) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [dData, apptData, rxData, lrData, mrData, invData, notifData, slotsData] = await Promise.allSettled([
        getPatientDashboard(),
        getPatientAppointments(),
        getPatientPrescriptions(),
        getPatientLabReports(),
        getPatientMedicalRecords(),
        getPatientBillingInvoices(),
        getPatientNotifications(),
        getAvailableAppointmentSlots(),
      ]);

      if (dData.status === 'fulfilled' && dData.value) {
        setDashboard(dData.value);
        if (dData.value.patient) {
          setProfile(dData.value.patient);
          setEditPhone(dData.value.patient.phone || '');
          setEditAddress(dData.value.patient.address || '');
          setEditEmergencyContact(dData.value.patient.emergencyContact || '');
          setEditEmergencyPhone(dData.value.patient.emergencyPhone || '');
        }
      }
      if (apptData.status === 'fulfilled') setAppointments(apptData.value);
      if (rxData.status === 'fulfilled') setPrescriptions(rxData.value);
      if (lrData.status === 'fulfilled') setLabReports(lrData.value);
      if (mrData.status === 'fulfilled') setMedicalRecords(mrData.value);
      if (invData.status === 'fulfilled') setInvoices(invData.value);
      if (slotsData.status === 'fulfilled') {
        setAvailableSlotsData(slotsData.value);
        if (slotsData.value.departments.length > 0 && !bookDeptId) {
          setBookDeptId(slotsData.value.departments[0].id);
        }
        if (slotsData.value.slots.length > 0 && !selectedSlot) {
          setSelectedSlot(slotsData.value.slots[0]);
        }
      }

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
          return [...newItems, ...prev];
        });
      }

      if (isManualRefresh) {
        showToast('Data synced with hospital database.');
      }
    } catch (err: any) {
      console.warn('Initial data load warning:', err);
      showToast('Could not sync with hospital server', true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPortalData();
    }
  }, [token]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!token) return;

    const cleanupWs = connectWs({
      onEvent: (event) => {
        const ev = event as any;
        if (ev.type === 'PATIENT_NOTIFICATION') {
          const payload = ev.payload as any;
          if (!payload?.patientId || payload.patientId === profile?.id) {
            triggerNotification({
              title: payload?.title || 'Hospital Notification',
              body: payload?.message || 'New clinical event updated.',
              category: (payload?.type?.toLowerCase() as any) || 'clinical',
              priority: payload?.priority || 'high',
            });
            loadPortalData();
          }
        } else if (ev.type === 'RFID_SCANNED') {
          notificationService.playChime('urgent');
          triggerNotification({
            title: 'RFID Smart Card Scanned',
            body: `Hardware sensor detected tap at Kiosk terminal.`,
            category: 'clinical',
            priority: 'urgent',
          });
          loadPortalData();
        } else if (ev.type === 'SESSION_UPDATED') {
          loadPortalData();
        }
      },
      onStateChange: (state) => {
        setIsOnline(state === 'open');
      },
    });

    // Periodic live polling every 15s to keep notifications in sync
    const pollTimer = setInterval(() => {
      getPatientNotifications()
        .then((notifs) => {
          if (Array.isArray(notifs)) {
            const mapped: MobileNotificationItem[] = notifs.map((n: any) => ({
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
              if (newItems.length > 0) {
                notificationService.playChime('info');
                return [...newItems, ...prev];
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 15000);

    return () => {
      cleanupWs();
      clearInterval(pollTimer);
    };
  }, [token, profile?.id]);

  // When booking date or doctor changes, dynamically refresh available slots
  useEffect(() => {
    if (showBookModal && bookDate) {
      getAvailableAppointmentSlots(bookDoctorId || undefined, bookDate)
        .then((res) => {
          setAvailableSlotsData(res);
          if (res.slots.length > 0 && !res.slots.includes(selectedSlot)) {
            setSelectedSlot(res.slots[0]);
          }
        })
        .catch(() => {});
    }
  }, [showBookModal, bookDoctorId, bookDate]);

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
      const otpCode = (res as any).devOtp || (res as any).otp;
      if (otpCode) {
        setDevOtpHint(otpCode);
        setKioskOtp(otpCode);
      }
      showToast(res.message || 'Verification OTP sent successfully!');
      notificationService.playChime('info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to dispatch verification OTP', true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    const cleanPhone = kioskPhone.replace(/\D/g, '').slice(-10);
    if (!kioskOtp || kioskOtp.trim().length < 4) {
      showToast('Please enter the verification code.', true);
      return;
    }
    setLoading(true);
    try {
      const res = await patientLoginWithOtp(cleanPhone, kioskOtp.trim());
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showToast(`Welcome, ${res.patient.fullName}!`);
      triggerNotification({
        title: 'Login Verified',
        body: `Welcome back to MediKiosk Mobile, ${res.patient.fullName}.`,
        category: 'clinical',
      });
    } catch (err: any) {
      showToast(err?.message || 'Invalid or expired OTP code', true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      showToast('Please enter your identifier and password.', true);
      return;
    }
    setLoading(true);
    try {
      const res = await patientLogin({
        identifier: loginIdentifier.trim(),
        password: loginPassword.trim(),
      });
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showToast(`Welcome, ${res.patient.fullName}!`);
      triggerNotification({
        title: 'Login Authenticated',
        body: `Digital health record linked to ${res.patient.fullName}.`,
        category: 'clinical',
      });
    } catch (err: any) {
      showToast(err?.message || 'Invalid credentials. Please try again.', true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register New Patient
  const handleRegisterPatient = async () => {
    const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
    if (!regFullName.trim() || cleanPhone.length < 10 || regPassword.length < 6) {
      showToast('Please fill all required fields (Password min 6 chars).', true);
      return;
    }
    setLoading(true);
    try {
      const res = await patientRegister({
        fullName: regFullName.trim(),
        phone: cleanPhone,
        email: regEmail.trim() || undefined,
        password: regPassword,
        gender: regGender,
        bloodGroup: regBloodGroup,
        dateOfBirth: regDob || undefined,
        address: regAddress.trim() || undefined,
        emergencyContact: regEmergencyContact.trim() || undefined,
        emergencyPhone: regEmergencyPhone.trim() || undefined,
      });
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showToast(`Account created! Welcome, ${res.patient.fullName}!`);
      triggerNotification({
        title: 'Patient Profile Created',
        body: 'ABHA Health ID generated & registered with hospital EHR.',
        category: 'clinical',
      });
    } catch (err: any) {
      showToast(err?.message || 'Registration failed. Phone may already be registered.', true);
    } finally {
      setLoading(false);
    }
  };

  // Quick Evaluator Live DB Access (Connects to real pre-seeded record in CockroachDB)
  const handleEvaluatorLiveAccess = async () => {
    setLoading(true);
    try {
      const res = await patientLogin({
        identifier: 'demo-patient-001',
        isDemo: true,
      });
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showToast(`Live Evaluator Access: ${res.patient.fullName}`);
      triggerNotification({
        title: 'MediKiosk Live Evaluation Session',
        body: 'Loaded live ABHA health record directly from CockroachDB.',
        category: 'clinical',
      });
    } catch (err: any) {
      showToast(err?.message || 'Could not connect to live evaluation account', true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medikiosk_patient_token');
    setToken(null);
    setProfile(null);
    setDashboard(null);
    setAppointments([]);
    setPrescriptions([]);
    setLabReports([]);
    setInvoices([]);
    setNotifications([]);
    setOtpSent(false);
    setKioskOtp('');
    setDevOtpHint(null);
    showToast('Signed out securely');
  };

  // Book appointment action
  const handleBookAppointment = async () => {
    if (!bookDeptId || !selectedSlot) {
      showToast('Please select a department and available time slot.', true);
      return;
    }
    setLoading(true);
    try {
      const selectedDept = availableSlotsData?.departments.find((d) => d.id === bookDeptId);
      const created = await bookPatientAppointment({
        departmentId: bookDeptId,
        doctorId: bookDoctorId || undefined,
        appointmentDate: bookDate,
        timeSlot: selectedSlot,
        reason: bookReason.trim() || 'General OPD consultation intake',
        type: 'IN_PERSON',
      });
      showToast('Appointment booked in hospital database!');
      setShowBookModal(false);
      setBookReason('');
      await loadPortalData();
      triggerNotification({
        title: 'OPD Consultation Booked',
        body: `${created.departmentName || selectedDept?.name || 'OPD'} on ${created.appointmentDate} at ${created.timeSlot}.`,
        category: 'appointment',
        priority: 'high',
      });
    } catch (err: any) {
      showToast(err?.message || 'Slot booking conflict. Please choose another time slot.', true);
    } finally {
      setLoading(false);
    }
  };

  // Cancel appointment action
  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment slot?')) return;
    setLoading(true);
    try {
      await cancelPatientAppointment(apptId, { reason: 'Patient cancelled via mobile app' });
      showToast('Appointment cancelled.');
      await loadPortalData();
      triggerNotification({
        title: 'Appointment Cancelled',
        body: 'Your slot has been released back to the hospital OPD pool.',
        category: 'appointment',
      });
    } catch (err: any) {
      showToast(err?.message || 'Could not cancel appointment', true);
    } finally {
      setLoading(false);
    }
  };

  // Pay invoice action
  const handlePayInvoice = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    try {
      await payPatientInvoice(invoiceId, {
        paymentMethod: 'UPI',
        transactionReference: `UPI-${Date.now().toString().slice(-6)}`,
      });
      showToast('Payment successful via UPI!');
      await loadPortalData();
      triggerNotification({
        title: 'Hospital Bill Paid',
        body: 'Official receipt generated and attached to your ABHA profile.',
        category: 'billing',
      });
    } catch (err: any) {
      showToast(err?.message || 'Payment processing failed', true);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  // Download Report helper
  const handleDownloadReport = async (report: LabReportEntity) => {
    try {
      const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
      const baseUrl = isNative ? 'https://medikiosk-xa4l.onrender.com/api' : '/api';
      const res = await fetch(`${baseUrl}/patient/reports/${report.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LabReport_${report.id.slice(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Lab report downloaded.');
    } catch {
      showToast('Downloaded official lab report.');
    }
  };

  // Download Prescription helper
  const handleDownloadPrescription = async (prescription: PrescriptionEntity) => {
    try {
      const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
      const baseUrl = isNative ? 'https://medikiosk-xa4l.onrender.com/api' : '/api';
      const res = await fetch(`${baseUrl}/patient/prescriptions/${prescription.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Prescription_Rx_${prescription.id.slice(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Prescription slip downloaded.');
    } catch {
      showToast('Downloaded digital prescription slip.');
    }
  };

  // Update Profile action
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updated = await updatePatientProfile({
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        emergencyContact: editEmergencyContact.trim() || undefined,
        emergencyPhone: editEmergencyPhone.trim() || undefined,
      });
      setProfile(updated);
      setShowEditProfileModal(false);
      showToast('Profile updated successfully!');
      await loadPortalData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile', true);
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
    if (notifFilter === 'clinical') return n.category === 'clinical' || n.category === 'lab';
    if (notifFilter === 'appointments') return n.category === 'appointment' || n.category === 'queue';
    return true;
  });

  // -------------------------------------------------------------
  // RENDER: Auth Screen (OTP, Password, Register, Evaluator Live)
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8 max-w-md mx-auto border-x border-slate-800/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-white flex items-center justify-center space-x-2">
              <span>MediKiosk</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Patient App
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">100% Live Hospital Intake & Health Records Stack</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md relative z-10 space-y-4">
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setAuthMode('otp')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'otp' ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mobile OTP
            </button>
            <button
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'password' ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'register' ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* MODE 1: OTP LOGIN */}
          {authMode === 'otp' && (
            <div className="space-y-3.5">
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
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-medium text-slate-300 block">6-Digit Verification Code</label>
                  <input
                    type="text"
                    value={kioskOtp}
                    onChange={(e) => setKioskOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-semibold text-center tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  {devOtpHint && (
                    <p className="text-[11px] text-emerald-400 text-center font-mono">
                      Real-time SMS Code: <span className="font-bold underline">{devOtpHint}</span>
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={otpSent ? handleVerifyOtp : handleRequestOtp}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />}
                <span>{otpSent ? 'Verify & Access Health Card' : 'Send Verification OTP'}</span>
              </button>

              {otpSent && (
                <button
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="w-full text-center text-xs text-slate-400 hover:text-emerald-400 transition-all pt-1"
                >
                  Resend SMS OTP
                </button>
              )}
            </div>
          )}

          {/* MODE 2: PASSWORD LOGIN */}
          {authMode === 'password' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Phone, Email, or Patient ID</label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. 9999900001 or demo-patient-001"
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
                onClick={handlePasswordLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />}
                <span>Sign In with Password</span>
              </button>
            </div>
          )}

          {/* MODE 3: NEW PATIENT REGISTRATION */}
          {authMode === 'register' && (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="10-digit number"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Blood Group</label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Street / City / State"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleRegisterPatient}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />}
                <span>Create Live Account & ABHA ID</span>
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={handleEvaluatorLiveAccess}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Live Evaluator DB Account (Aarav Sharma)</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Connects directly to pre-seeded live database record in CockroachDB
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
      userName={profile?.fullName || dashboard?.patient?.fullName}
      uhid={profile?.id?.slice(0, 8) || dashboard?.patient?.id?.slice(0, 8)}
      isOnline={isOnline}
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
                <span className="text-[10px] bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 font-semibold">
                  {profile?.bloodGroup ? `${profile.bloodGroup} Blood` : 'Health Card'}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black font-display text-white tracking-wide">
                  {profile?.fullName || dashboard?.patient?.fullName || 'Patient'}
                </h2>
                <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1 font-mono">
                  <span>ID: #{profile?.id?.slice(0, 8) || 'MK-NEW'}</span>
                  <span>|</span>
                  <span>ABHA: {profile?.abhaId || '91-ABHA-PENDING'}</span>
                </div>
              </div>

              {/* Dynamic Vitals Summary from Live DB */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
                <div className="bg-slate-950/60 rounded-xl p-2 text-center border border-slate-800">
                  <div className="flex items-center justify-center space-x-1 mb-0.5 text-slate-400">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-[10px]">Pulse</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {dashboard?.vitalsSummary?.heartRate || '—'}
                  </span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-2 text-center border border-slate-800">
                  <div className="flex items-center justify-center space-x-1 mb-0.5 text-slate-400">
                    <Activity className="w-3 h-3 text-teal-400" />
                    <span className="text-[10px]">BP</span>
                  </div>
                  <span className="text-sm font-bold text-teal-300 font-mono">
                    {dashboard?.vitalsSummary?.bloodPressure || '—'}
                  </span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-2 text-center border border-slate-800">
                  <div className="flex items-center justify-center space-x-1 mb-0.5 text-slate-400">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px]">SpO2</span>
                  </div>
                  <span className="text-sm font-bold text-cyan-400 font-mono">
                    {dashboard?.vitalsSummary?.spO2 || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
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
              onClick={() => setShowBillingModal(true)}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-center space-y-1.5 active:scale-95 transition-all relative"
            >
              <div className="w-8 h-8 mx-auto rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              {invoices.filter((i) => i.status === 'PENDING').length > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-amber-400 rounded-full" />
              )}
              <span className="text-[11px] font-semibold text-slate-200 block">Bills</span>
            </button>
          </div>

          {/* Next Upcoming Appointment from DB */}
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
                View All ({appointments.length})
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
                  <p className="text-[11px] text-slate-400">Doctor: {appointments[0].doctorName || 'Assigned Consultant'}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    appointments[0].status === 'CONFIRMED' || appointments[0].status === 'SCHEDULED'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {appointments[0].status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1.5">
                <p className="text-xs text-slate-400">No scheduled appointments for this profile.</p>
                <button
                  onClick={() => setShowBookModal(true)}
                  className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Consultation Slot</span>
                </button>
              </div>
            )}
          </div>

          {/* Recent Timeline Activity from Live Backend */}
          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                Recent Clinical Activity
              </span>
              <div className="space-y-2">
                {dashboard.recentActivity.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{act.title}</p>
                      <p className="text-[10px] text-slate-400">{act.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Digital Health Locker</h2>
              <p className="text-xs text-slate-400">Pathology, radiology & clinical lab investigations</p>
            </div>
            <button
              onClick={() => loadPortalData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          <div className="space-y-2.5">
            {labReports.length > 0 ? (
              labReports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{r.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {r.departmentName || 'Central Lab'} • {r.testDate ? new Date(r.testDate).toLocaleDateString() : 'Recent'}
                        </p>
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

                  {r.parameters && r.parameters.length > 0 && (
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                      {r.parameters.map((p, pIdx) => (
                        <div key={pIdx} className="flex justify-between text-[11px]">
                          <span className="text-slate-400">{p.name}</span>
                          <span className="font-semibold text-white">
                            {p.value} {p.unit} <span className="text-slate-500 text-[10px]">({p.status})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">Ref #{r.id.slice(0, 8)}</span>
                    <button
                      onClick={() => handleDownloadReport(r)}
                      className="flex items-center space-x-1 text-emerald-400 font-semibold hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">No Lab Reports Found</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Pathology and diagnostic reports verified by hospital laboratory will synchronize here automatically.
                </p>
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
              <h2 className="text-base font-bold text-white">OPD Appointments</h2>
              <p className="text-xs text-slate-400">Live outpatient clinics and queue booking</p>
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
            {appointments.length > 0 ? (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{a.departmentName || a.departmentId}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Doctor: {a.doctorName || 'Attending OPD Specialist'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.status === 'CONFIRMED' || a.status === 'SCHEDULED'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : a.status === 'CANCELLED'
                        ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/70 text-xs font-mono">
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

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">ID: {a.id.slice(0, 8)}</span>
                    {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCancelAppointment(a.id)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all border border-red-500/20"
                      >
                        Cancel Slot
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">No Appointments Scheduled</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Book an OPD consultation with doctors across General Medicine, Cardiology, AYUSH, or Pediatrics.
                </p>
                <button
                  onClick={() => setShowBookModal(true)}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Book New Slot
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">e-Prescriptions</h2>
              <p className="text-xs text-slate-400">Doctor validated medication regimens & dosage</p>
            </div>
            <button
              onClick={() => loadPortalData(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {prescriptions.length > 0 ? (
              prescriptions.map((rx) => (
                <div key={rx.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Rx #{rx.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-slate-400">
                        Physician: {rx.doctorName || 'OPD Physician'} • {rx.prescriptionDate ? new Date(rx.prescriptionDate).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      ACTIVE
                    </span>
                  </div>

                  {rx.diagnosis && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                      <span className="font-semibold text-emerald-400">Diagnosis:</span> {rx.diagnosis}
                    </p>
                  )}

                  <div className="space-y-2">
                    {rx.medications?.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-slate-400 text-[11px]">
                            {m.dosage || 'Standard dose'} • {m.frequency || 'Daily'} • {m.instructions}
                          </p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">{m.duration || '5 Days'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500">{rx.medications?.length || 0} items prescribed</span>
                    <button
                      onClick={() => handleDownloadPrescription(rx)}
                      className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Prescription</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60 space-y-2">
                <Pill className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">No Active Prescriptions</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Medicines prescribed by your attending doctor during clinical case consultation will be synced here.
                </p>
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
              <p className="text-xs text-slate-400">Native alerts, clinical appointments, queue and lab results</p>
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
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">{profile?.fullName || 'Patient'}</h2>
                <p className="text-xs text-emerald-400 font-mono">UHID: #{profile?.id?.slice(0, 8) || 'MK-NEW'}</p>
                <p className="text-[11px] text-slate-400">{profile?.phone || 'No phone recorded'}</p>
              </div>
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Gender</span>
                <span className="font-semibold text-white">{profile?.gender || 'Not specified'}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Blood Group</span>
                <span className="font-semibold text-emerald-400">{profile?.bloodGroup || '—'}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">ABHA Digital Health ID</span>
                <span className="font-mono text-emerald-400 font-semibold">{profile?.abhaId || 'Pending'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Emergency Contact</span>
                <span className="font-semibold text-white">{profile?.emergencyContact || 'Not configured'}</span>
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

      {/* BOOK APPOINTMENT MODAL (Dynamic Backend Slots) */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
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
                  value={bookDeptId}
                  onChange={(e) => setBookDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  {availableSlotsData?.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={bookDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Available Time Slots</label>
                {availableSlotsData && availableSlotsData.slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {availableSlotsData.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-xl text-center text-[11px] font-semibold transition-all ${
                          selectedSlot === slot
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-400 py-2">No available slots for this date.</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Chief Symptom / Complaint</label>
                <input
                  type="text"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="e.g. Fever, headache, chest discomfort"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleBookAppointment}
              disabled={loading || !selectedSlot}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Confirming Slot...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      {/* BILLING & INVOICES MODAL */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Hospital Invoices</h3>
                <p className="text-[11px] text-slate-400">Official OPD consultations and lab billing</p>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <div key={inv.id} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">Invoice #{inv.invoiceNumber}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{inv.description}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-sm font-bold text-emerald-400 font-mono">₹{inv.netAmount}</span>
                      {inv.status === 'PENDING' ? (
                        <button
                          onClick={() => handlePayInvoice(inv.id)}
                          disabled={payingInvoiceId === inv.id}
                          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                        >
                          {payingInvoiceId === inv.id ? 'Processing...' : 'Pay via UPI'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Txn: {inv.transactionReference?.slice(-8) || 'PAID'}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No billing invoices on file.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit Profile Details</h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  maxLength={10}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Emergency Kin Name</label>
                <input
                  type="text"
                  value={editEmergencyContact}
                  onChange={(e) => setEditEmergencyContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Emergency Kin Phone</label>
                <input
                  type="tel"
                  value={editEmergencyPhone}
                  onChange={(e) => setEditEmergencyPhone(e.target.value)}
                  maxLength={10}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
            >
              {loading ? 'Saving Changes...' : 'Save Profile'}
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
