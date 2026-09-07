export interface DemoSession {
  id: string;
  patientId: string;
  patientName: string;
  status: 'IDENTIFIED' | 'CONSENTED' | 'IN_HISTORY' | 'DOCUMENTS' | 'COMPLETED';
  consentStatus: 'GRANTED' | 'DECLINED' | null;
  language: string;
  chiefComplaintCategory?: string;
  currentTreeId?: string;
  currentNodeId?: string;
  historyCompleted?: boolean;
  answers: Record<string, unknown>;
  createdAt: Date;
}

export const DEMO_CARDS: Record<string, { patientId: string; patientName: string; isDemo: boolean }> = {
  'DEMO-RFID-001': {
    patientId: 'demo-patient-001',
    patientName: 'Aarav Sharma',
    isDemo: true,
  },
  'DEMO-RFID-002': {
    patientId: 'demo-patient-002',
    patientName: 'Priya Verma',
    isDemo: true,
  },
  'DEMO-RFID-003': {
    patientId: 'demo-patient-003',
    patientName: 'Ramesh Patel',
    isDemo: true,
  },
};

class DemoStore {
  private sessions = new Map<string, DemoSession>();

  createSession(uid: string): DemoSession {
    const card = DEMO_CARDS[uid] || {
      patientId: `demo-patient-${Date.now()}`,
      patientName: 'Demo Patient',
      isDemo: true,
    };

    const sessionId = `demo_session_${Date.now()}`;
    const session: DemoSession = {
      id: sessionId,
      patientId: card.patientId,
      patientName: card.patientName,
      status: 'IDENTIFIED',
      consentStatus: null,
      language: 'EN',
      answers: {},
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): DemoSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<DemoSession>): DemoSession | undefined {
    const current = this.sessions.get(sessionId);
    if (!current) return undefined;
    const updated = { ...current, ...updates };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

export const demoStore = new DemoStore();
