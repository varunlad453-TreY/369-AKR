export type UserRole = 'super_admin' | 'dispatcher' | 'safety_lead' | 'auditor';

export type JobStatus = 
  | 'draft'
  | 'assigned'
  | 'en_route'
  | 'on_site'
  | 'in_progress'
  | 'inspection_pending'
  | 'completed'
  | 'rejected';

export type DocumentType = 
  | 'cad_blueprint'
  | 'structural_permit'
  | 'single_line_diagram'
  | 'safety_checklist'
  | 'proof_of_work'
  | 'commissioning_report';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface Subcontractor {
  id: string;
  authUserId?: string;
  companyName: string;
  phoneNumber: string; // E.164 format (+91...)
  vendorCode: string; // e.g. AKR-VND-8492-SEC
  contactPerson: string;
  licenseNumber?: string;
  stateRegion: string;
  isActive: boolean;
  rating: number;
  assignedJobsCount?: number;
  completedJobsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Geotag {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  addressSnippet?: string;
}

export interface JobDocument {
  id: string;
  jobId: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  downloadUrl?: string;
  uploadedBy: string;
  uploaderRole: 'ADMIN' | 'SUBCONTRACTOR';
  geotag?: Geotag;
  createdAt: string;
}

export interface Job {
  id: string;
  jobCode: string; // e.g. AKR-2026-DEL-104
  title: string;
  description?: string;
  siteAddress: string;
  city: string;
  state: string;
  pincode: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  capacityKwp: number;
  systemType: string;
  status: JobStatus;
  subcontractorId: string;
  subcontractor?: Subcontractor;
  createdBy: string;
  scheduledStart: string;
  scheduledEnd: string;
  completedAt?: string;
  notes?: string;
  documents?: JobDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId?: string;
  actorType: 'ADMIN' | 'SUBCONTRACTOR' | 'SYSTEM' | 'GATEWAY';
  actorIdentifier?: string; // Phone or email
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface OtpVerificationSession {
  vendorCode: string;
  phoneNumber: string;
  maskedPhone: string;
  expiresAt: string;
  demoOtp?: string; // Revealed in demo mode for frictionless review
}
