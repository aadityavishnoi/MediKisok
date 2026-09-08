import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  FileText,
  Pill,
  Bell,
  User,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  LogOut,
  Download,
  Printer,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Eye,
  Phone,
  Mail,
  MapPin,
  Building2,
  Stethoscope,
  Heart,
  QrCode,
  ArrowRight,
  Receipt,
  Sparkles,
  Check,
  History,
  X,
  Menu,
  Smartphone,
  KeyRound,
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
  patientSendOtp,
  patientLoginWithOtp,
  patientRegister,
  getPatientDashboard,
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

export type TabType =
  | 'dashboard'
  | 'history'
  | 'reports'
  | 'prescriptions'
  | 'appointments'
  | 'followup'
  | 'billing'
  | 'notifications'
  | 'profile';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medikiosk_patient_token'));
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
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
  const [authMode, setAuthMode] = useState<'kiosk' | 'login' | 'register'>('kiosk');
  const [kioskPhone, setKioskPhone] = useState('');
  const [kioskOtp, setKioskOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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

  // Reports Filter & Search State
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategory, setReportCategory] = useState('ALL');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSort, setReportSort] = useState<'newest' | 'oldest'>('newest');

  // Prescriptions Sub-tab State
  const [rxTab, setRxTab] = useState<'active' | 'history'>('active');

  // Appointments Sub-tab State
  const [apptTab, setApptTab] = useState<'upcoming' | 'previous'>('upcoming');

  // Medical History Filter State
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');

  // Booking & Follow-up Form
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
  const [upiId, setUpiId] = useState('');

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
      const [dash, appts, rx, labs, records, bills, notifs, slots] = await Promise.all([
        getPatientDashboard().catch(() => null),
        getPatientAppointments().catch(() => []),
        getPatientPrescriptions().catch(() => []),
        getPatientLabReports().catch(() => []),
        getPatientMedicalRecords().catch(() => null),
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
      setMedicalRecords(records);
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
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPortalData();
    }
  }, [token]);

  // Update dynamic slots when doctor or date changes in booking / follow-up form
  useEffect(() => {
    if (bookForm.doctorId && bookForm.appointmentDate) {
      getAvailableAppointmentSlots(bookForm.doctorId, bookForm.appointmentDate)
        .then((res) => {
          if (res) {
            setAvailableSlots(res);
            if (res.slots.length > 0 && !res.slots.includes(bookForm.timeSlot)) {
              setBookForm((prev) => ({ ...prev, timeSlot: res.slots[0] }));
            }
          }
        })
        .catch(() => {});
    }
  }, [bookForm.doctorId, bookForm.appointmentDate]);

  const showNotificationToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Timer for OTP resend countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Kiosk Registered Patient OTP Handlers
  const handleSendKioskOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = kioskPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      showNotificationToast('Please enter a valid 10-digit mobile number.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await patientSendOtp(cleanPhone);
      setOtpSent(true);
      setOtpCountdown(60);
      showNotificationToast(res.message || 'OTP sent successfully to your mobile number via SMS!');
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to send OTP. Please check the mobile number and try again.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyKioskOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = kioskPhone.replace(/\D/g, '').slice(-10);
    if (!kioskOtp || kioskOtp.trim().length < 4) {
      showNotificationToast('Please enter the 6-digit OTP code received on your mobile.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await patientLoginWithOtp(cleanPhone, kioskOtp.trim());
      localStorage.setItem('medikiosk_patient_token', res.token);
      setToken(res.token);
      setProfile(res.patient);
      showNotificationToast(`Welcome back, ${res.patient.fullName}! Verified from MediKiosk records.`);
    } catch (err: any) {
      showNotificationToast(err.message || 'Invalid or expired OTP. Please verify and retry.', true);
    } finally {
      setActionLoading(false);
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
    showNotificationToast('Logged out securely.');
  };

  // Profile Update Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updated = await updatePatientProfile(editProfileData);
      setProfile(updated);
      setShowEditProfileModal(false);
      showNotificationToast('Health profile & contact details updated successfully.');
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to update profile.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Book Appointment / Follow-up Handler
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const created = await bookPatientAppointment(bookForm);
      setAppointments((prev) => [created, ...prev]);
      setShowBookModal(false);
      showNotificationToast(`Appointment successfully booked for ${bookForm.timeSlot}!`);
      setActiveTab('appointments');
      setApptTab('upcoming');
      loadPortalData();
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to book appointment.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule Appointment Handler
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRescheduleModal) return;
    setActionLoading(true);
    try {
      const updated = await reschedulePatientAppointment(showRescheduleModal.id, rescheduleForm);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setShowRescheduleModal(null);
      showNotificationToast('Appointment rescheduled successfully.');
      loadPortalData();
    } catch (err: any) {
      showNotificationToast(err.message || 'Failed to reschedule appointment.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Appointment Handler
  const handleCancelAppointment = async () => {
    if (!showCancelModal) return;
    if (!cancelReason || cancelReason.trim().length < 3) {
      showNotificationToast('Please provide a valid cancellation reason.', true);
      return;
    }
    setActionLoading(true);
    try {
      const updated = await cancelPatientAppointment(showCancelModal.id, { reason: cancelReason });
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
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

  // Pay Invoice Handler
  const handlePayInvoice = async () => {
    if (!showPayModal) return;
    setActionLoading(true);
    try {
      const paid = await payPatientInvoice(showPayModal.id, {
        paymentMethod,
        transactionReference: `TXN-UPI-${Date.now().toString().slice(-8)}`,
      });
      setInvoices((prev) => prev.map((inv) => (inv.id === paid.id ? paid : inv)));
      setShowPayModal(null);
      setShowReceiptModal(paid);
      showNotificationToast(`Payment of ₹${paid.netAmount.toFixed(2)} completed successfully!`);
      loadPortalData();
    } catch (err: any) {
      showNotificationToast(err.message || 'Payment processing failed.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Notification read handler
  const handleMarkNotifRead = async (id: string) => {
    try {
      await markPatientNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await markAllPatientNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showNotificationToast('All notifications marked as read.');
    } catch {
      showNotificationToast('Failed to mark all as read.', true);
    }
  };

  // Secure File Download Handlers
  const handleDownloadReport = async (reportId: string, filename?: string) => {
    try {
      const currentToken = localStorage.getItem('medikiosk_patient_token');
      const res = await fetch(`/api/patient/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `lab-report-${reportId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotificationToast('Medical report downloaded securely.');
    } catch {
      showNotificationToast('Failed to download report file.', true);
    }
  };

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const currentToken = localStorage.getItem('medikiosk_patient_token');
      const res = await fetch(`/api/patient/prescriptions/${prescriptionId}/download`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescriptionId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotificationToast('Prescription document downloaded.');
    } catch {
      showNotificationToast('Failed to download prescription document.', true);
    }
  };

  // Pre-fill follow-up booking from past appointment
  const handleStartFollowUp = (doctorName?: string | null, deptName?: string | null) => {
    const matchedDoc = availableSlots?.doctors.find((d) => d.name === doctorName);
    const matchedDept = availableSlots?.departments.find((d) => d.name === deptName);
    setBookForm((prev) => ({
      ...prev,
      doctorId: matchedDoc?.id ?? prev.doctorId,
      departmentId: matchedDept?.id ?? prev.departmentId,
      type: 'FOLLOW_UP',
      reason: `Follow-up Consultation with ${doctorName ?? 'Physician'} for ongoing health monitoring`,
    }));
    setActiveTab('followup');
  };

  // Filtered Reports Memo
  const filteredReports = useMemo(() => {
    return labReports
      .filter((r) => {
        if (reportSearch) {
          const q = reportSearch.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchCategory = r.category.toLowerCase().includes(q);
          const matchDoctor = r.doctorName?.toLowerCase().includes(q) ?? false;
          const matchNotes = r.doctorNotes?.toLowerCase().includes(q) ?? false;
          const matchFacility = r.facilityName?.toLowerCase().includes(q) ?? false;
          if (!matchTitle && !matchCategory && !matchDoctor && !matchNotes && !matchFacility) return false;
        }
        if (reportCategory !== 'ALL') {
          if (!r.category.toLowerCase().includes(reportCategory.toLowerCase())) return false;
        }
        if (reportStartDate) {
          if (new Date(r.testDate).getTime() < new Date(reportStartDate).getTime()) return false;
        }
        if (reportEndDate) {
          if (new Date(r.testDate).getTime() > new Date(reportEndDate).getTime()) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const diff = new Date(b.testDate).getTime() - new Date(a.testDate).getTime();
        return reportSort === 'oldest' ? -diff : diff;
      });
  }, [labReports, reportSearch, reportCategory, reportStartDate, reportEndDate, reportSort]);

  // Filtered Prescriptions Memo
  const activePrescriptions = useMemo(() => {
    return prescriptions.filter((p) => p.status === 'Active');
  }, [prescriptions]);

  const historyPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => p.status === 'Completed' || p.status === 'Expired');
  }, [prescriptions]);

  // Filtered Appointments Memo
  const upcomingAppointments = useMemo(() => {
    return appointments.filter((a) => ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'].includes(a.status));
  }, [appointments]);

  const previousAppointments = useMemo(() => {
    return appointments.filter((a) => ['COMPLETED', 'CANCELLED'].includes(a.status));
  }, [appointments]);

  // Filtered Medical Timeline Memo
  const timelineEvents = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      category: 'CONSULTATION' | 'PRESCRIPTION' | 'LAB_REPORT' | 'APPOINTMENT';
      description: string;
      details?: string;
      doctor?: string | null;
      badge: string;
    }> = [];

    // Add Appointments
    appointments.forEach((a) => {
      list.push({
        id: `tl-appt-${a.id}`,
        title: `OPD Consultation: ${a.reason}`,
        date: a.appointmentDate,
        category: 'APPOINTMENT',
        description: `Status: ${a.status} (${a.type}) in ${a.departmentName ?? 'OPD Clinic'}`,
        details: a.notes ?? undefined,
        doctor: a.doctorName,
        badge: a.status,
      });
    });

    // Add Prescriptions
    prescriptions.forEach((p) => {
      list.push({
        id: `tl-rx-${p.id}`,
        title: `Medical Prescription: ${p.diagnosis}`,
        date: p.prescriptionDate,
        category: 'PRESCRIPTION',
        description: `Prescribed ${p.medications.length} medication(s) • Status: ${p.status}`,
        details: p.instructions ?? undefined,
        doctor: p.doctorName,
        badge: p.status,
      });
    });

    // Add Lab Reports
    labReports.forEach((l) => {
      list.push({
        id: `tl-lab-${l.id}`,
        title: `Laboratory Diagnostics: ${l.title}`,
        date: l.testDate,
        category: 'LAB_REPORT',
        description: `Diagnostic findings verified by ${l.doctorName ?? 'Clinical Pathologist'}`,
        details: l.doctorNotes ?? undefined,
        doctor: l.doctorName,
        badge: l.category,
      });
    });

    // Add Clinical History if exists
    if (medicalRecords?.clinicalHistories) {
      medicalRecords.clinicalHistories.forEach((ch) => {
        list.push({
          id: `tl-ch-${ch.id}`,
          title: `Kiosk Clinical Intake: ${ch.chiefComplaint}`,
          date: ch.createdAt,
          category: 'CONSULTATION',
          description: `Digital smart kiosk assessment recorded in ${ch.mode} triage mode`,
          badge: ch.mode,
        });
      });
    }

    return list
      .filter((e) => (historyFilter === 'ALL' ? true : e.category === historyFilter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, prescriptions, labReports, medicalRecords, historyFilter]);

  // If not authenticated, render Login / Register screen
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 flex flex-col justify-between">
        {/* Header */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/10 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 shrink-0">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg text-white leading-tight">MediKiosk</h1>
              <p className="text-[11px] sm:text-xs text-emerald-400 font-medium truncate">Smart Clinical Management & Patient Portal</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ABDM & HIPAA Compliant Healthcare Gateway
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-3.5 sm:p-6">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Verified Patient Access
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {authMode === 'kiosk'
                  ? 'Kiosk Patient Login'
                  : authMode === 'login'
                  ? 'Patient Portal Login'
                  : 'Create Patient Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {authMode === 'kiosk'
                  ? 'Registered at a MediKiosk station? Sign in with your mobile number & OTP'
                  : authMode === 'login'
                  ? 'Access your medical history, test reports, prescriptions and OPD appointments'
                  : 'Register for smart hospital services and link your ABHA digital health account'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/30 border border-white/5 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setAuthMode('kiosk')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'kiosk' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Kiosk OTP</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'login' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Password</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'register' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Register</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === 'kiosk' ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                  <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Registered at a MediKiosk Station?</span>
                    <p className="text-[11px] text-emerald-400/90 mt-0.5">
                      Enter the 10-digit mobile number you used at the kiosk or RFID intake. We will send an SMS verification OTP to sign you in.
                    </p>
                  </div>
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendKioskOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Registered Mobile Number
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={kioskPhone}
                          onChange={(e) => setKioskPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="e.g. 9876543210"
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tracking-wider font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        We will send a 6-digit verification code via TextBee SMS.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading || kioskPhone.length < 10}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                      Send Verification OTP via SMS
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyKioskOtp} className="space-y-4">
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>OTP sent to <strong className="text-white font-mono">+91 {kioskPhone}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setKioskOtp(''); }}
                        className="text-[11px] text-emerald-400 hover:underline font-medium"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={kioskOtp}
                        onChange={(e) => setKioskOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-base text-center tracking-widest font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading || kioskOtp.length < 4}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Verify OTP & Access Portal
                    </button>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      {otpCountdown > 0 ? (
                        <span className="text-slate-400">Resend code in <strong className="text-slate-200 font-mono">{otpCountdown}s</strong></span>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleSendKioskOtp}
                          className="text-emerald-400 hover:underline font-medium"
                        >
                          Resend OTP via SMS
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setKioskOtp(''); }}
                        className="text-slate-400 hover:text-white"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : authMode === 'login' ? (
              <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
                <div
                  onClick={() => setAuthMode('kiosk')}
                  className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Registered with Kiosk? <strong>Login with Mobile & OTP &rarr;</strong></span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email, Phone Number, or Patient ID
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or patient@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Sign In to Patient Portal
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Mobile Phone *
                    </label>
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
                <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-2">
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
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Create Password *
                  </label>
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

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'history', label: 'Medical History', icon: History },
    { id: 'reports', label: 'Medical Reports', icon: FileText, badge: labReports.length },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill, badge: activePrescriptions.length },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: upcomingAppointments.length },
    { id: 'followup', label: 'Follow-ups', icon: Clock },
    { id: 'billing', label: 'Billing & Payments', icon: CreditCard, badge: invoices.filter((i) => i.status === 'PENDING').length },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xs gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Navigation Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center shrink-0 min-w-[38px] min-h-[38px]"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">MediKiosk</span>
              <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Patient Portal
              </span>
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              AIIMS New Delhi — Smart Digital Healthcare
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Notifications Icon Button */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`relative p-2 rounded-xl border transition-colors flex items-center justify-center min-w-[38px] min-h-[38px] ${
              activeTab === 'notifications'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title="Notifications"
            aria-label="Notifications"
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
            className={`cursor-pointer flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl border transition-colors min-h-[38px] ${
              activeTab === 'profile'
                ? 'bg-emerald-50 border-emerald-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
            title="View Profile"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              {profile?.fullName ? profile.fullName.charAt(0) : 'P'}
            </div>
            <div className="text-left hidden md:block max-w-[140px]">
              <div className="text-xs font-semibold text-slate-900 leading-tight truncate">{profile?.fullName ?? 'Patient'}</div>
              <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span className="truncate">{profile?.abhaId ? profile.abhaId.slice(0, 14) : 'ABDM Linked'}</span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 transition-colors flex items-center justify-center min-w-[38px] min-h-[38px]"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-over Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-tight text-slate-900">MediKiosk</span>
                    <div className="text-[10px] text-emerald-600 font-semibold">Patient Portal</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  title="Close Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Patient Info Card in Drawer */}
              <div
                onClick={() => {
                  setActiveTab('profile');
                  setMobileMenuOpen(false);
                }}
                className="p-4 bg-emerald-50/60 border-b border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {profile?.fullName ? profile.fullName.charAt(0) : 'P'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{profile?.fullName ?? 'Patient'}</div>
                    <div className="text-[10px] text-slate-500 truncate">{profile?.phone ?? 'N/A'}</div>
                    <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{profile?.abhaId ?? 'ABDM Verified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items List */}
              <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{tab.label}</span>
                      </div>
                      {Boolean(tab.badge && tab.badge > 0) && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
              <div className="text-[11px] text-slate-400 text-center font-medium">
                AIIMS New Delhi Network
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-red-200 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 flex items-center justify-center gap-2 shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-header Tabs */}
      <nav className="bg-white border-b border-slate-200 px-3.5 sm:px-6 py-2 no-scrollbar overflow-x-auto flex items-center gap-1.5 sm:gap-2">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
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

      {/* Toast Feedback */}
      {errorMsg && (
        <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between shadow-xs animate-in fade-in break-words">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 text-base font-bold p-1">
            &times;
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between shadow-xs animate-in fade-in break-words">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 text-base font-bold p-1">
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-7xl mx-auto w-full min-w-0">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-medium text-slate-600">Retrieving patient health records from hospital database...</p>
            <p className="text-xs text-slate-400 mt-1">Verifying encrypted clinical tokens & ABDM authorizations</p>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 1. DASHBOARD TAB */}
            {/* ========================================================================= */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Welcome Card & Summary */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ABHA Verified Health Account
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">Namaste, {profile?.fullName ?? 'Patient'}</h1>
                    <p className="text-xs text-emerald-100/80 leading-relaxed">
                      Welcome to your comprehensive patient care portal. Access verified diagnostic lab panels, digital
                      e-prescriptions, OPD follow-ups, and live vitals recorded across hospital departments.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs pt-1 text-emerald-200">
                      <span>Blood Group: <strong className="text-white">{profile?.bloodGroup ?? 'N/A'}</strong></span>
                      <span>Phone: <strong className="text-white">{profile?.phone ?? 'N/A'}</strong></span>
                      <span className="break-all">ABHA ID: <strong className="text-white font-mono">{profile?.abhaId ?? 'Pending'}</strong></span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setActiveTab('followup')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-emerald-900 text-xs font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-md min-h-[40px]"
                    >
                      <Plus className="w-4 h-4" />
                      Schedule Follow-up
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 text-white text-xs font-semibold border border-white/20 transition-all flex items-center justify-center gap-2 min-h-[40px]"
                    >
                      <FileText className="w-4 h-4" />
                      View Medical Reports
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <div
                    onClick={() => setActiveTab('appointments')}
                    className="cursor-pointer bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Appointments</span>
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{appointments.length}</div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-0.5">
                      {upcomingAppointments.length} Upcoming
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('prescriptions')}
                    className="cursor-pointer bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Prescriptions</span>
                      <Pill className="w-4 h-4 text-blue-600 shrink-0" />
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{prescriptions.length}</div>
                    <div className="text-[10px] sm:text-[11px] text-blue-600 font-medium mt-0.5">
                      {activePrescriptions.length} Active Courses
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('reports')}
                    className="cursor-pointer bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Reports</span>
                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{labReports.length}</div>
                    <div className="text-[10px] sm:text-[11px] text-purple-600 font-medium mt-0.5">Verified Lab Panels</div>
                  </div>

                  <div
                    onClick={() => setActiveTab('billing')}
                    className="cursor-pointer bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Bills Due</span>
                      <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">
                      {invoices.filter((i) => i.status === 'PENDING').length}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-amber-600 font-medium mt-0.5">Pending Payments</div>
                  </div>
                </div>

                {/* Next Appointment Card & Vitals Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Next Appointment Highlight */}
                  <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="font-bold text-sm sm:text-base text-slate-900">Next Scheduled Consultation</h2>
                          <p className="text-[11px] sm:text-xs text-slate-500">Verified doctor schedule & hospital room token</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
                      >
                        All Appointments &rarr;
                      </button>
                    </div>

                    {upcomingAppointments.length > 0 ? (
                      <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {upcomingAppointments[0].type}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {upcomingAppointments[0].status}
                            </span>
                          </div>
                          <div className="font-bold text-sm text-slate-900 break-words">{upcomingAppointments[0].reason}</div>
                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 sm:gap-3">
                            <span>Doctor: <strong>{upcomingAppointments[0].doctorName ?? 'OPD Specialist'}</strong></span>
                            <span>Date: <strong>{new Date(upcomingAppointments[0].appointmentDate).toLocaleDateString()}</strong></span>
                            <span>Slot: <strong>{upcomingAppointments[0].timeSlot}</strong></span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="break-words">{upcomingAppointments[0].location ?? 'AIIMS Main OPD Block, Room 204'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                          <button
                            onClick={() => {
                              setShowRescheduleModal(upcomingAppointments[0]);
                              setRescheduleForm({
                                appointmentDate: upcomingAppointments[0].appointmentDate.split('T')[0],
                                timeSlot: upcomingAppointments[0].timeSlot,
                                reason: '',
                              });
                            }}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold text-center min-h-[36px]"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => setShowCancelModal(upcomingAppointments[0])}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold text-center min-h-[36px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="text-xs font-semibold text-slate-600">No upcoming appointments scheduled</div>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Need an OPD consultation or follow-up checkup? Book an appointment based on real-time doctor availability.
                        </p>
                        <button
                          onClick={() => setActiveTab('followup')}
                          className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs min-h-[38px]"
                        >
                          Book Appointment Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vitals Summary Card */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500 shrink-0" /> Patient Vitals
                      </h2>
                      <span className="text-[10px] text-slate-400">Latest Recorded</span>
                    </div>

                    {dashboard?.vitalsSummary && (dashboard.vitalsSummary.bloodPressure || dashboard.vitalsSummary.heartRate || dashboard.vitalsSummary.lastRecordedAt) ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Blood Pressure</div>
                            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 break-words">
                              {dashboard.vitalsSummary.bloodPressure}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">Recorded</div>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Heart Rate</div>
                            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 break-words">
                              {dashboard.vitalsSummary.heartRate}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">Recorded</div>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">SpO2 (Oxygen)</div>
                            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 break-words">
                              {dashboard.vitalsSummary.spO2}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">Recorded</div>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Temperature</div>
                            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 break-words">
                              {dashboard.vitalsSummary.temperature}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">Recorded</div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Vital signs recorded and synchronized from hospital database.</span>
                        </div>
                      </>
                    ) : (
                      <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                        <Heart className="w-7 h-7 text-slate-300 mx-auto" />
                        <div className="text-xs font-semibold text-slate-700">No Vitals Recorded Yet</div>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Check in at any MediKiosk station or nurse triage desk to measure and sync your vital signs automatically.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Shortcuts & Recent Reports/Prescriptions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Active Prescriptions Preview */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-blue-600 shrink-0" /> Active Prescriptions
                      </h2>
                      <button
                        onClick={() => setActiveTab('prescriptions')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        View All ({prescriptions.length}) &rarr;
                      </button>
                    </div>

                    {activePrescriptions.length > 0 ? (
                      <div className="space-y-3">
                        {activePrescriptions.slice(0, 2).map((rx) => (
                          <div key={rx.id} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-900 break-words">{rx.diagnosis}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                                {rx.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Dr. {rx.doctorName ?? 'Consultant'} • Prescribed on {new Date(rx.prescriptionDate).toLocaleDateString()}
                            </div>
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {rx.medications.map((m, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                                  {m.name} ({m.dosage})
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No active prescription regimens.
                      </div>
                    )}
                  </div>

                  {/* Recent Medical Reports Preview */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600 shrink-0" /> Recent Medical Reports
                      </h2>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="text-xs font-bold text-purple-600 hover:text-purple-700"
                      >
                        View All ({labReports.length}) &rarr;
                      </button>
                    </div>

                    {labReports.length > 0 ? (
                      <div className="space-y-3">
                        {labReports.slice(0, 2).map((lab) => (
                          <div key={lab.id} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-900 break-words">{lab.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 shrink-0">
                                {lab.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between gap-2 flex-wrap">
                              <span>{lab.facilityName ?? 'AIIMS Central Pathology'}</span>
                              <span>{new Date(lab.testDate).toLocaleDateString()}</span>
                            </div>
                            <div className="pt-1 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400">{lab.parameters.length} Clinical Parameters Analyzed</span>
                              <button
                                onClick={() => setShowLabModal(lab)}
                                className="text-xs font-bold text-purple-700 hover:text-purple-800 shrink-0"
                              >
                                Details &rarr;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No medical reports available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. MEDICAL HISTORY TAB (Chronological Clinical Journey) */}
            {/* ========================================================================= */}
            {activeTab === 'history' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-emerald-600 shrink-0" />
                      Medical History & Clinical Journey
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chronological record of consultations, diagnoses, prescriptions, lab reports, and clinical milestones
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold pb-1 w-full sm:w-auto -mx-1 px-1">
                    {[
                      { id: 'ALL', label: 'All Events' },
                      { id: 'CONSULTATION', label: 'Consultations' },
                      { id: 'PRESCRIPTION', label: 'Prescriptions' },
                      { id: 'LAB_REPORT', label: 'Lab Reports' },
                      { id: 'APPOINTMENT', label: 'Appointments' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setHistoryFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap min-h-[34px] ${
                          historyFilter === f.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline UI */}
                <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-200 space-y-4 sm:space-y-6 ml-2 sm:ml-4">
                  {timelineEvents.length > 0 ? (
                    timelineEvents.map((item) => (
                      <div key={item.id} className="relative group">
                        {/* Node icon */}
                        <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-emerald-700 shadow-xs shrink-0">
                          {item.category === 'APPOINTMENT' && <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {item.category === 'PRESCRIPTION' && <Pill className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {item.category === 'LAB_REPORT' && <FileText className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {item.category === 'CONSULTATION' && <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4" />}
                        </div>

                        {/* Event Card */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-2 break-words">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-emerald-700">
                              {new Date(item.date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
                              {item.badge}
                            </span>
                          </div>

                          <h2 className="font-bold text-sm text-slate-900 break-words">{item.title}</h2>
                          <p className="text-xs text-slate-600 break-words">{item.description}</p>

                          {item.doctor && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Attending: <strong>{item.doctor}</strong></span>
                            </div>
                          )}

                          {item.details && (
                            <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 break-words">
                              {item.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                      No clinical history records matching the chosen filter.
                    </div>
                  )}
                </div>

                {/* Patient Privacy Banner */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5 sm:gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="break-words">
                    <strong className="font-bold">Encrypted Clinical Journey:</strong> This medical history is maintained under Ayushman Bharat Digital Mission (ABDM) standards. Internal doctor-only raw clinical notes are protected, and you are viewing your verified patient-facing health records.
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. MEDICAL REPORTS TAB (Dedicated Page with Search, Filters, Details, Download) */}
            {/* ========================================================================= */}
            {activeTab === 'reports' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                      Medical & Diagnostic Reports
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View, filter, inspect laboratory parameters, and download certified medical reports
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                      {filteredReports.length} Available Reports
                    </span>
                  </div>
                </div>

                {/* Filter and Search Controls Bar */}
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search report by name, doctor, or test..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-purple-500 min-h-[38px]"
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <select
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-purple-500 min-h-[38px]"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Hematology">Hematology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Pathology">Pathology</option>
                        <option value="Radiology">Radiology</option>
                      </select>
                    </div>

                    {/* Date Range Start */}
                    <div>
                      <input
                        type="date"
                        title="Start Date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-purple-500 min-h-[38px]"
                      />
                    </div>

                    {/* Sort Order */}
                    <div>
                      <select
                        value={reportSort}
                        onChange={(e) => setReportSort(e.target.value as 'newest' | 'oldest')}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-purple-500 min-h-[38px]"
                      >
                        <option value="newest">Sort: Newest to Oldest</option>
                        <option value="oldest">Sort: Oldest to Newest</option>
                      </select>
                    </div>
                  </div>

                  {(reportSearch || reportCategory !== 'ALL' || reportStartDate || reportEndDate) && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 flex-wrap gap-2">
                      <span className="text-slate-500">Filtered results: {filteredReports.length} reports</span>
                      <button
                        onClick={() => {
                          setReportSearch('');
                          setReportCategory('ALL');
                          setReportStartDate('');
                          setReportEndDate('');
                        }}
                        className="text-purple-600 font-semibold hover:underline"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Reports List */}
                {filteredReports.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                {report.category}
                              </span>
                              <h2 className="font-bold text-sm sm:text-base text-slate-900 mt-1 break-words">{report.title}</h2>
                              <p className="text-xs text-slate-500">{report.facilityName ?? 'AIIMS Central Pathology Lab'}</p>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-xs font-semibold text-slate-500 block">
                                {new Date(report.testDate).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-block mt-1">
                                {report.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600">
                            Supervising Physician: <strong>{report.doctorName ?? 'Dr. Suresh Sen (Pathologist)'}</strong>
                          </div>

                          {/* Parameters snippet */}
                          <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100 overflow-x-auto w-full">
                            <table className="w-full text-xs text-left min-w-[280px]">
                              <thead>
                                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-200">
                                  <th className="pb-1 font-semibold">Parameter</th>
                                  <th className="pb-1 font-semibold">Result</th>
                                  <th className="pb-1 font-semibold">Reference</th>
                                  <th className="pb-1 font-semibold text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60">
                                {report.parameters.slice(0, 3).map((param, idx) => (
                                  <tr key={idx}>
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
                            {report.parameters.length > 3 && (
                              <div className="text-[11px] text-purple-700 font-medium pt-2 text-center">
                                + {report.parameters.length - 3} more parameters in complete report
                              </div>
                            )}
                          </div>

                          {report.doctorNotes && (
                            <div className="text-xs text-slate-500 italic bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 break-words">
                              &ldquo;{report.doctorNotes}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-2">
                          <button
                            onClick={() => setShowLabModal(report)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
                          >
                            <Eye className="w-4 h-4" />
                            View Full Report
                          </button>
                          <button
                            onClick={() => handleDownloadReport(report.id, report.originalFilename ?? undefined)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">No matching medical reports found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Try clearing your search query or adjusting your date filters. All new diagnostic reports uploaded by hospital departments will automatically appear here.
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Medical reports are strictly read-only for patient integrity and authenticated against your digital ID.</span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. PRESCRIPTIONS TAB (Active vs History, Detailed Medication Breakdown) */}
            {/* ========================================================================= */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Pill className="w-5 h-5 text-blue-600" />
                      Prescriptions & Medications
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Active courses, medication history, dosage schedules, and doctor instructions
                    </p>
                  </div>

                  {/* Sub-tab Switcher: Active Prescriptions vs Prescription History */}
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 text-xs font-semibold w-full sm:w-auto">
                    <button
                      onClick={() => setRxTab('active')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-1.5 rounded-xl transition-all text-center ${
                        rxTab === 'active' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Active ({activePrescriptions.length})
                    </button>
                    <button
                      onClick={() => setRxTab('history')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-1.5 rounded-xl transition-all text-center ${
                        rxTab === 'history' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      History ({historyPrescriptions.length})
                    </button>
                  </div>
                </div>

                {/* Prescriptions Cards */}
                {((rxTab === 'active' ? activePrescriptions : historyPrescriptions).length > 0) ? (
                  <div className="space-y-6">
                    {(rxTab === 'active' ? activePrescriptions : historyPrescriptions).map((rx) => (
                      <div
                        key={rx.id}
                        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  rx.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rx.status === 'Completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {rx.status}
                              </span>
                              <span className="text-xs text-slate-400">Rx Ref: #{rx.id.slice(-6)}</span>
                            </div>
                            <h2 className="font-bold text-base text-slate-900 mt-1 break-words">{rx.diagnosis}</h2>
                            <p className="text-xs text-slate-500 break-words">
                              Prescribed by: <strong className="text-slate-800">{rx.doctorName ?? 'Senior OPD Physician'}</strong> • AIIMS New Delhi
                            </p>
                          </div>

                          <div className="flex flex-col sm:items-end text-xs text-slate-500 shrink-0">
                            <div>Prescription Date: <strong className="text-slate-800">{new Date(rx.prescriptionDate).toLocaleDateString()}</strong></div>
                            <div>Valid Until: <strong className="text-slate-800">{rx.endDate ? new Date(rx.endDate).toLocaleDateString() : 'N/A'}</strong></div>
                          </div>
                        </div>

                        {/* Medications Detailed Table (Desktop: md+) */}
                        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Medicine Name</th>
                                <th className="p-3">Dosage</th>
                                <th className="p-3">Route</th>
                                <th className="p-3">Frequency</th>
                                <th className="p-3">Duration</th>
                                <th className="p-3">Special Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rx.medications.map((m, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-bold text-slate-900">{m.name}</td>
                                  <td className="p-3 text-slate-700 font-medium">{m.dosage}</td>
                                  <td className="p-3 text-slate-600">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px]">
                                      {m.route ?? 'Oral'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-blue-700 font-semibold">{m.frequency}</td>
                                  <td className="p-3 text-slate-600">{m.duration}</td>
                                  <td className="p-3 text-slate-600 italic">{m.instructions}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Medication Cards (Mobile/Tablet: < md) */}
                        <div className="block md:hidden space-y-2.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Medications List ({rx.medications.length})
                          </span>
                          {rx.medications.map((m, idx) => (
                            <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                                  <div className="text-slate-600 font-medium">{m.dosage}</div>
                                </div>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[10px] shrink-0">
                                  {m.route ?? 'Oral'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-[11px]">
                                  {m.frequency}
                                </span>
                                <span className="px-2 py-1 rounded-lg bg-slate-200/70 text-slate-700 font-medium text-[11px]">
                                  {m.duration}
                                </span>
                              </div>
                              {m.instructions && (
                                <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded-xl border border-slate-100">
                                  {m.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Doctor Advice & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                          <div className="text-xs text-slate-600 break-words">
                            <strong>Physician Advice:</strong> {rx.instructions ?? 'Take medications as scheduled. Maintain proper hydration and follow up if symptoms persist.'}
                          </div>
                          <div className="flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              onClick={() => setShowRxModal(rx)}
                              className="flex-1 xs:flex-none px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[38px]"
                            >
                              <Printer className="w-4 h-4" />
                              View / Print Rx
                            </button>
                            <button
                              onClick={() => handleDownloadPrescription(rx.id)}
                              className="flex-1 xs:flex-none px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[38px]"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3">
                    <Pill className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">
                      No {rxTab === 'active' ? 'active' : 'historical'} prescriptions found
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {rxTab === 'active'
                        ? 'You currently have no ongoing medication courses prescribed.'
                        : 'Past completed and expired prescription records will be archived here.'}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Prescription data is strictly read-only for patients to comply with medical regulations and safety protocols.</span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. APPOINTMENTS TAB (Upcoming vs Previous, Reschedule & Cancel) */}
            {/* ========================================================================= */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      My OPD Appointments
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage upcoming consultations, reschedule slots, view previous visit summaries
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {/* Sub-tabs */}
                    <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 text-xs font-semibold text-center w-full sm:w-auto">
                      <button
                        onClick={() => setApptTab('upcoming')}
                        className={`px-3.5 py-2 sm:py-1.5 rounded-xl transition-all ${
                          apptTab === 'upcoming' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
                        }`}
                      >
                        Upcoming ({upcomingAppointments.length})
                      </button>
                      <button
                        onClick={() => setApptTab('previous')}
                        className={`px-3.5 py-2 sm:py-1.5 rounded-xl transition-all ${
                          apptTab === 'previous' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
                        }`}
                      >
                        Previous ({previousAppointments.length})
                      </button>
                    </div>

                    <button
                      onClick={() => setShowBookModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 min-h-[38px]"
                    >
                      <Plus className="w-4 h-4" />
                      Book Consultation
                    </button>
                  </div>
                </div>

                {/* Appointments List */}
                {((apptTab === 'upcoming' ? upcomingAppointments : previousAppointments).length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {(apptTab === 'upcoming' ? upcomingAppointments : previousAppointments).map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-col xs:flex-row items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {appt.type}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    appt.status === 'CONFIRMED' || appt.status === 'SCHEDULED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : appt.status === 'RESCHEDULED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : appt.status === 'COMPLETED'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {appt.status}
                                </span>
                              </div>
                              <h2 className="font-bold text-base text-slate-900 mt-1.5 break-words">{appt.reason}</h2>
                              <p className="text-xs text-slate-500">{appt.departmentName ?? 'General OPD Clinic'}</p>
                            </div>
                            <div className="text-left xs:text-right shrink-0">
                              <span className="text-xs font-bold text-emerald-800 block">
                                {new Date(appt.appointmentDate).toLocaleDateString()}
                              </span>
                              <span className="text-xs font-semibold text-slate-600 block">{appt.timeSlot}</span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1 text-slate-600">
                            <div>Attending Physician: <strong>{appt.doctorName ?? 'Consultant Physician'}</strong></div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="break-words">{appt.location ?? 'AIIMS New Delhi — Main OPD Block'}</span>
                            </div>
                            {appt.notes && (
                              <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 break-words">
                                {appt.notes}
                              </div>
                            )}
                            {appt.cancellationReason && (
                              <div className="mt-2 text-xs bg-red-50 p-2.5 rounded-xl border border-red-100 text-red-700 break-words">
                                Cancellation Note: {appt.cancellationReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions for Upcoming or Previous */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row items-stretch xs:items-center justify-end gap-2">
                          {apptTab === 'upcoming' ? (
                            <>
                              <button
                                onClick={() => {
                                  setShowRescheduleModal(appt);
                                  setRescheduleForm({
                                    appointmentDate: appt.appointmentDate.split('T')[0],
                                    timeSlot: appt.timeSlot,
                                    reason: '',
                                  });
                                }}
                                className="flex-1 xs:flex-none px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold text-center min-h-[38px] flex items-center justify-center"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => setShowCancelModal(appt)}
                                className="flex-1 xs:flex-none px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold text-center min-h-[38px] flex items-center justify-center"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartFollowUp(appt.doctorName, appt.departmentName)}
                              className="w-full xs:w-auto px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[38px]"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Book Follow-up With This Doctor
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">
                      No {apptTab === 'upcoming' ? 'upcoming' : 'previous'} appointments
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {apptTab === 'upcoming'
                        ? 'You do not have any pending appointments. You can book an OPD slot anytime.'
                        : 'Past visit histories will appear here once consultations conclude.'}
                    </p>
                    {apptTab === 'upcoming' && (
                      <button
                        onClick={() => setShowBookModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-xs"
                      >
                        Book Appointment
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. FOLLOW-UP SCHEDULING TAB (Dynamic Real availability, Doctor Schedule) */}
            {/* ========================================================================= */}
            {activeTab === 'followup' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Schedule Follow-up Appointment
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule a follow-up consultation with your attending doctor based on real-time OPD slot availability
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Scheduling Form */}
                  <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                    <form onSubmit={handleBookAppointment} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Clinical Department *
                          </label>
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
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500 min-h-[40px]"
                          >
                            {availableSlots?.departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Attending Doctor *
                          </label>
                          <select
                            value={bookForm.doctorId}
                            onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500 min-h-[40px]"
                          >
                            {availableSlots?.doctors
                              .filter((d) => !bookForm.departmentId || d.departmentId === bookForm.departmentId)
                              .map((doc) => (
                                <option key={doc.id} value={doc.id}>
                                  {doc.name} ({doc.departmentName})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Follow-up Date *
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={bookForm.appointmentDate}
                            onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500 min-h-[40px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Consultation Mode *
                          </label>
                          <select
                            value={bookForm.type}
                            onChange={(e) => setBookForm({ ...bookForm, type: e.target.value as AppointmentType })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500 min-h-[40px]"
                          >
                            <option value="FOLLOW_UP">Follow-up Review (OPD)</option>
                            <option value="IN_PERSON">In-Person Consultation</option>
                            <option value="VIDEO_CONSULT">Tele-Health / Video Consult</option>
                          </select>
                        </div>
                      </div>

                      {/* Live Available Time Slots */}
                      <div>
                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 mb-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            Available Time Slots on {new Date(bookForm.appointmentDate).toLocaleDateString()} *
                          </label>
                          <span className="text-[11px] text-emerald-600 font-medium">
                            {availableSlots?.slots.length ?? 0} Live Slots Available
                          </span>
                        </div>

                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots?.slots.map((slot) => {
                            const isSelected = bookForm.timeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setBookForm({ ...bookForm, timeSlot: slot })}
                                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold'
                                    : 'border-slate-200 hover:bg-emerald-50/50 text-slate-700'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Reason for Follow-up *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Medication review, follow-up on lipid panel reports"
                          value={bookForm.reason}
                          onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500 min-h-[40px]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Additional Health Symptoms / Notes
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Any ongoing symptoms or specific questions for the physician..."
                          value={bookForm.notes}
                          onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Confirm & Schedule Follow-up Appointment
                      </button>
                    </form>
                  </div>

                  {/* Booking Guidelines & Double-booking Prevention Notice */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Scheduling Policies
                      </h3>
                      <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                        <li>Slots shown reflect live doctor OPD schedules and active bookings.</li>
                        <li>Double-booking is automatically blocked by server-side schedule checks.</li>
                        <li>An OPD registration token and invoice is automatically generated upon confirmation.</li>
                        <li>Rescheduling is permitted up to 2 hours prior to consultation time.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                      <div className="font-bold">Need Immediate Emergency Care?</div>
                      <p className="text-[11px] text-blue-800">
                        Please proceed directly to the AIIMS 24x7 Emergency Trauma Center or dial the hospital emergency helpline at <strong>102</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 7. BILLING & PAYMENTS TAB */}
            {/* ========================================================================= */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                      Hospital Billing & Payments
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View OPD consultation invoices, lab test fees, and process UPI / Card payments
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                      Pending Dues: ₹
                      {invoices
                        .filter((i) => i.status === 'PENDING')
                        .reduce((sum, i) => sum + i.netAmount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Invoices List */}
                <div className="space-y-4">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-800">#{inv.invoiceNumber}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-slate-900 break-words">{inv.description}</div>
                        <div className="text-xs text-slate-500 break-words">
                          Department: {inv.department} • Issued on {new Date(inv.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="text-base font-bold text-slate-900">₹{inv.netAmount.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400">
                            {inv.status === 'PAID' ? `Paid via ${inv.paymentMethod}` : 'Payment Pending'}
                          </div>
                        </div>

                        {inv.status === 'PENDING' ? (
                          <button
                            onClick={() => setShowPayModal(inv)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 min-h-[38px] flex items-center justify-center"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowReceiptModal(inv)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[38px]"
                          >
                            <Receipt className="w-4 h-4" />
                            Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 8. NOTIFICATIONS TAB */}
            {/* ========================================================================= */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-600" />
                      Notifications & Clinical Alerts
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time appointment confirmations, laboratory report alerts, and billing receipts
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllNotifsRead}
                      className="self-start sm:self-auto px-3.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold min-h-[36px]"
                    >
                      Mark All as Read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 ${
                          n.read
                            ? 'bg-white border-slate-200 opacity-80'
                            : 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                        }`}
                      >
                        <div className="space-y-1 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{n.title}</span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" title="Unread"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed break-words">{n.message}</p>
                          <div className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()} at{' '}
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100/60">
                          {n.type.includes('APPOINTMENT') && (
                            <button
                              onClick={() => {
                                handleMarkNotifRead(n.id);
                                setActiveTab('appointments');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 min-h-[34px]"
                            >
                              View Appointments
                            </button>
                          )}
                          {n.type.includes('REPORT') && (
                            <button
                              onClick={() => {
                                handleMarkNotifRead(n.id);
                                setActiveTab('reports');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 min-h-[34px]"
                            >
                              View Reports
                            </button>
                          )}
                          {!n.read && (
                            <button
                              onClick={() => handleMarkNotifRead(n.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[34px] min-h-[34px] flex items-center justify-center"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center text-xs text-slate-400">
                    No notifications or clinical alerts at this time.
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 9. PATIENT PROFILE TAB (ABHA Digital Card, Editable Contact Details) */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
                      Patient Profile & Digital Health ID
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage demographic information, linked ABHA credentials, and emergency contact details
                    </p>
                  </div>

                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs min-h-[38px] flex items-center justify-center"
                  >
                    Edit Contact Details
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Digital ABHA Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Ayushman Bharat</div>
                          <div className="text-xs font-bold text-white">Digital Health Card (ABHA)</div>
                        </div>
                      </div>
                      <QrCode className="w-7 h-7 text-emerald-400 opacity-80 shrink-0" />
                    </div>

                    <div className="pt-2 space-y-1">
                      <div className="text-[11px] text-slate-400">Cardholder Name</div>
                      <div className="text-base sm:text-lg font-bold tracking-tight text-white break-words">{profile?.fullName}</div>
                      <div className="font-mono text-xs text-emerald-300 tracking-wider break-all">
                        {profile?.abhaId ?? '91-XXXX-XXXX-XXXX'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Gender</span>
                        <span className="font-semibold">{profile?.gender ?? 'Male'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Blood Group</span>
                        <span className="font-semibold">{profile?.bloodGroup ?? 'B+'}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-emerald-400 font-mono text-center pt-2">
                      National Health Authority • Verified ABDM Health Record
                    </div>
                  </div>

                  {/* Profile Details Cards */}
                  <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                      Verified Identity & Clinical Attributes
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Full Legal Name (Read-Only)</span>
                        <div className="font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 break-words">
                          {profile?.fullName}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Date of Birth (Read-Only)</span>
                        <div className="font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                        <div className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 break-all">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {profile?.phone ?? 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Email Address</span>
                        <div className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 break-all">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {profile?.email ?? 'N/A'}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Residential Address</span>
                        <div className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 break-words">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {profile?.address ?? 'AIIMS Residential Sector, New Delhi'}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Emergency Contact Person</span>
                        <div className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 break-words">
                          {profile?.emergencyContact ?? 'Sunita Sharma (Spouse)'}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Emergency Contact Phone</span>
                        <div className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 break-all">
                          {profile?.emergencyPhone ?? '+91 98765 00000'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 break-words">
                      Registered at: AIIMS New Delhi Hospital Network • Enrolled on {new Date(profile?.createdAt ?? Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: Book Appointment */}
      {/* ========================================================================= */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Book OPD Consultation</h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={bookForm.departmentId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const firstDoc = availableSlots?.doctors.find((d) => d.departmentId === deptId);
                    setBookForm({ ...bookForm, departmentId: deptId, doctorId: firstDoc?.id ?? '' });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                >
                  {availableSlots?.departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor</label>
                <select
                  value={bookForm.doctorId}
                  onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                >
                  {availableSlots?.doctors
                    .filter((d) => !bookForm.departmentId || d.departmentId === bookForm.departmentId)
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.departmentName})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookForm.appointmentDate}
                    onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={bookForm.timeSlot}
                    onChange={(e) => setBookForm({ ...bookForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                  >
                    {availableSlots?.slots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest tightness, blood pressure review"
                  value={bookForm.reason}
                  onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse xs:flex-row sm:flex-row items-stretch xs:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold min-h-[38px] text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md min-h-[38px] text-center"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Reschedule Appointment */}
      {/* ========================================================================= */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Reschedule Consultation</h3>
              <button
                onClick={() => setShowRescheduleModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleReschedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Consultation Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleForm.appointmentDate}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, appointmentDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Time Slot *</label>
                <select
                  value={rescheduleForm.timeSlot}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                >
                  {availableSlots?.slots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Rescheduling</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule conflict"
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse xs:flex-row sm:flex-row items-stretch xs:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(null)}
                  className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold min-h-[38px] text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md min-h-[38px] text-center"
                >
                  Update Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Cancel Appointment Confirmation */}
      {/* ========================================================================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Cancel Appointment Confirmation</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed break-words">
              Are you sure you want to cancel your consultation for{' '}
              <strong className="text-slate-900">{showCancelModal.reason}</strong> on{' '}
              {new Date(showCancelModal.appointmentDate).toLocaleDateString()} at {showCancelModal.timeSlot}?
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. Health improved, unable to travel"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-red-500 min-h-[38px]"
              />
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse xs:flex-row sm:flex-row items-stretch xs:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(null)}
                className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold min-h-[38px] text-center"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelAppointment}
                className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 shadow-md min-h-[38px] text-center"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Pay Invoice */}
      {/* ========================================================================= */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-bold text-base text-slate-900">Hospital Checkout & Payment</h3>
              </div>
              <button
                onClick={() => setShowPayModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Invoice Number:</span>
                <span className="font-mono font-bold text-slate-800">#{showPayModal.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Description:</span>
                <span className="font-medium text-slate-800 break-words">{showPayModal.description}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="text-emerald-700">₹{showPayModal.netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Payment Option</label>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs font-semibold">
                {(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 min-h-[42px] ${
                      paymentMethod === m
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{m.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse xs:flex-row sm:flex-row items-stretch xs:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPayModal(null)}
                className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold min-h-[38px] text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePayInvoice}
                className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md min-h-[38px] text-center"
              >
                Pay ₹{showPayModal.netAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Payment Receipt */}
      {/* ========================================================================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Hospital Payment Receipt</h3>
              <p className="text-xs text-slate-500">AIIMS New Delhi — Digital Care Billing</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Receipt Ref:</span>
                <span className="font-mono font-bold text-slate-800">REC-{showReceiptModal.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-800 break-words">{profile?.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{showReceiptModal.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-slate-800 break-all">{showReceiptModal.transactionReference}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold text-slate-900 pt-2">
                <span>Amount Paid:</span>
                <span className="text-emerald-700">₹{showReceiptModal.netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setShowReceiptModal(null)}
                className="w-full xs:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 min-h-[38px]"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Prescription Print Preview */}
      {/* ========================================================================= */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">AIIMS Digital e-Prescription</h3>
                <p className="text-xs text-slate-500">Department of Cardiology & Internal Medicine</p>
              </div>
              <button
                onClick={() => setShowRxModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>Patient: <strong className="text-slate-800 break-words">{profile?.fullName}</strong></div>
                <div>Date: <strong className="text-slate-800">{new Date(showRxModal.prescriptionDate).toLocaleDateString()}</strong></div>
                <div>Diagnosis: <strong className="text-slate-800 break-words">{showRxModal.diagnosis}</strong></div>
                <div>Doctor: <strong className="text-slate-800">{showRxModal.doctorName ?? 'Senior Consultant'}</strong></div>
              </div>

              <div className="space-y-2">
                <div className="font-bold uppercase text-[10px] tracking-wider text-emerald-800">
                  Prescribed Medication Regimen
                </div>
                {showRxModal.medications.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 bg-slate-50/40">
                    <div>
                      <div className="font-bold text-slate-900">{m.name} ({m.dosage})</div>
                      <div className="text-slate-500 text-[11px] break-words">{m.instructions} • Route: {m.route ?? 'Oral'}</div>
                    </div>
                    <div className="text-left xs:text-right shrink-0">
                      <div className="font-semibold text-blue-700">{m.frequency}</div>
                      <div className="text-slate-400 text-[10px]">{m.duration}</div>
                    </div>
                  </div>
                ))}
              </div>

              {showRxModal.instructions && (
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-slate-700 break-words">
                  <strong>Instructions:</strong> {showRxModal.instructions}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button
                onClick={() => handleDownloadPrescription(showRxModal.id)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <Download className="w-4 h-4" /> Download Text Document
              </button>
              <button
                onClick={() => setShowRxModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 min-h-[38px] flex items-center justify-center"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Full Lab Report Details Modal */}
      {/* ========================================================================= */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {showLabModal.category}
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-1 break-words">{showLabModal.title}</h3>
                <p className="text-xs text-slate-500">{showLabModal.facilityName ?? 'AIIMS Central Pathology Lab'}</p>
              </div>
              <button
                onClick={() => setShowLabModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Test Date</span>
                <span className="font-bold text-slate-800">{new Date(showLabModal.testDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Verification Status</span>
                <span className="font-bold text-emerald-700">{showLabModal.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Supervising Doctor</span>
                <span className="font-bold text-slate-800">{showLabModal.doctorName ?? 'Senior Pathologist'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Patient Name</span>
                <span className="font-bold text-slate-800 break-words">{profile?.fullName}</span>
              </div>
            </div>

            {/* Parameter Details Table with Contained Horizontal Scroll */}
            <div className="rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[360px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Test Parameter</th>
                    <th className="p-3">Observed Value</th>
                    <th className="p-3">Biological Reference</th>
                    <th className="p-3 text-right">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {showLabModal.parameters.map((param, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">{param.name}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {param.value} <span className="text-[10px] text-slate-400 font-normal">{param.unit}</span>
                      </td>
                      <td className="p-3 text-slate-500">{param.referenceRange}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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

            {showLabModal.doctorNotes && (
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-1">
                <strong>Supervising Pathologist Clinical Notes:</strong>
                <p className="text-purple-800 italic break-words">{showLabModal.doctorNotes}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button
                onClick={() => handleDownloadReport(showLabModal.id, showLabModal.originalFilename ?? undefined)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <Download className="w-4 h-4" /> Download Official PDF/Report
              </button>
              <button
                onClick={() => setShowLabModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-600 min-h-[38px] flex items-center justify-center"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Edit Profile */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Edit Contact & Health Details</h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editProfileData.phone}
                  onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editProfileData.email}
                  onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={editProfileData.bloodGroup}
                  onChange={(e) => setEditProfileData({ ...editProfileData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
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
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editProfileData.address}
                  onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={editProfileData.emergencyContact}
                    onChange={(e) => setEditProfileData({ ...editProfileData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={editProfileData.emergencyPhone}
                    onChange={(e) => setEditProfileData({ ...editProfileData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-[38px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse xs:flex-row sm:flex-row items-stretch xs:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold min-h-[38px] text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md min-h-[38px] text-center"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-4 text-center sm:text-left text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>MediKiosk Hospital Management System • Production Patient Portal</span>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-400">
          Ayushman Bharat Digital Mission (ABDM) • Secured with Server-Side IDOR & Audit Protection
        </div>
      </footer>
    </div>
  );
}
