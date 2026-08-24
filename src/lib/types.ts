export type Role = "student" | "telecaller" | "counselor" | "admin" | "super_admin";

export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Counselor {
  id: string;
  auth_user_id?: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  bio: string;
  specializations: string[];
  is_active: boolean;
  role?: Role;
  created_at: string | null;
}

export interface Telecaller {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  created_at: string | null;
}

export interface Lead {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  field_of_interest: string;
  academic_score: string;
  preferred_countries: string[];
  assigned_counselor_id: string | null;
  assigned_telecaller_id: string | null;
  entity_type: string;
  lead_status: string;
  lead_stage: string;
  lead_source: string;
  priority: string;
  notes: string;
  next_follow_up_date: string | null;
  last_contact_date: string | null;
  conversion_date: string | null;
  created_at: string | null;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path?: string;
  status: string;
  archived: boolean;
  admin_comments?: string;
  reviewed_at?: string | null;
  created_at: string | null;
}

export interface ApplicationRow {
  id: string;
  user_id: string;
  university_name: string;
  course_name: string;
  country: string;
  city: string;
  intake_term: string;
  priority_level: string;
  status: string;
  notes: string;
  counselor_comments: string;
  created_at: string | null;
}

export interface ShortlistRow {
  id: string;
  student_id: string;
  counselor_id: string;
  university_name: string;
  course_name: string;
  location: string;
  counselor_notes: string;
  status: string;
  created_at: string | null;
}

export interface ConversationRow {
  id: string;
  student_id: string;
  counselor_id: string;
  last_message_at?: string | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LeaveRow {
  id: string;
  counselor_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  total_days: number;
  status: string;
  applied_on?: string;
}

export interface AttendanceRow {
  id: string;
  counselor_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  status: string;
}

export interface SalaryRow {
  id: string;
  counselor_id: string;
  month: string;
  year: number;
  net_salary: number;
  notes: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read?: boolean;
  created_at: string;
}

export interface UniversityRow {
  id: string;
  name: string;
  country: string;
  city: string;
  ranking?: number;
  is_active?: boolean;
  is_tie_up?: boolean;
  website_url?: string;
}

export interface ChecklistRow {
  id: string;
  document_type: string;
  description: string;
  is_required: boolean;
  is_active: boolean;
  max_file_size_mb: number;
  allowed_file_types: string[];
  display_order: number;
}

export interface ChatSessionRow {
  id: string;
  user_id?: string;
  is_completed?: boolean;
  created_at?: string;
}

export interface ChatMessageRow {
  id: string;
  session_id?: string;
  role?: string;
  content?: string;
  created_at?: string;
}

export interface AdminState {
  users: AdminUser[];
  counselors: Counselor[];
  telecallers: Telecaller[];
  leads: Lead[];
  documents: DocumentRow[];
  applications: ApplicationRow[];
  shortlists: ShortlistRow[];
  conversations: ConversationRow[];
  messages: MessageRow[];
  leave: LeaveRow[];
  attendance: AttendanceRow[];
  salary: SalaryRow[];
  notifications: NotificationRow[];
  universities: UniversityRow[];
  checklists: ChecklistRow[];
  chatSessions: ChatSessionRow[];
  chatMessages: ChatMessageRow[];
}
