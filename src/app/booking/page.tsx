"use client";
import { useState, useCallback } from "react";
import { Calendar, Plus, Clock, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, AlertTriangle, MapPin, Video, Phone, Trash2, Edit3, ExternalLink } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Modal, StatCard, Toggle } from "@/components/ui";

interface Apt { id: string; title: string; client: string; email: string; phone: string; date: string; time: string; duration: string; type: "in-person" | "video" | "phone"; status: "confirmed" | "pending" | "completed" | "cancelled" | "no-show"; notes: string; autoReminder: boolean; location?: string; }

const initialApts: Apt[] = [
  { id: "1", title: "Consultation", client: "Adebayo Johnson", email: "adebayo@techcorp.ng", phone: "+234 801 234 5678", date: "2026-08-27", time: "10:00", duration: "30 min", type: "video", status: "confirmed", notes: "Interested in lead response system. Wants to see dashboard demo.", autoReminder: true, location: "Zoom" },
  { id: "2", title: "Demo", client: "Chioma Okafor", email: "chioma@realestate.com", phone: "+234 802 345 6789", date: "2026-08-27", time: "11:30", duration: "45 min", type: "in-person", status: "confirmed", notes: "Real estate lead conversion demo. Bring case studies.", autoReminder: true, location: "Office" },
  { id: "3", title: "Follow-Up", client: "Emeka Nwosu", email: "emeka@fintech.io", phone: "+234 803 456 7890", date: "2026-08-27", time: "14:00", duration: "20 min", type: "phone", status: "pending", notes: "Discuss pricing. Budget is $5K-10K.", autoReminder: true },
  { id: "4", title: "Onboarding", client: "Gideon Mensah", email: "gideon@logistics.com", phone: "+233 24 567 8901", date: "2026-08-28", time: "09:00", duration: "60 min", type: "video", status: "confirmed", notes: "New client onboarding. Signed Growth plan.", autoReminder: true, location: "Google Meet" },
  { id: "5", title: "Consultation", client: "Halima Bello", email: "halima@edu.ng", phone: "+234 805 678 9012", date: "2026-08-28", time: "13:00", duration: "30 min", type: "video", status: "pending", notes: "Education sector automation. Interested in booking engine.", autoReminder: true },
  { id: "6", title: "Demo", client: "Ibrahim Yusuf", email: "ibrahim@trade.ng", phone: "+234 806 789 0123", date: "2026-08-26", time: "15:00", duration: "45 min", type: "in-person", status: "no-show", notes: "Did not attend. Rescheduled to 08/29.", autoReminder: false },
  { id: "7", title: "Strategy", client: "Janet Okonkwo", email: "janet@salon.com", phone: "+234 807 890 1234", date: "2026-08-26", time: "10:00", duration: "30 min", type: "phone", status: "completed", notes: "Discussed booking engine. Very interested.", autoReminder: true },
  { id: "8", title: "Strategy", client: "Kemi Adekunle", email: "kemi@agency.ng", phone: "+234 808 901 2345", date: "2026-08-29", time: "11:00", duration: "30 min", type: "video", status: "confirmed", notes: "SMMA owner. Wants full automation suite.", autoReminder: true },
  { id: "9", title: "Consultation", client: "Lola Abiodun", email: "lola@clinic.com", phone: "+234 809 012 3456", date: "2026-08-29", time: "14:30", duration: "30 min", type: "phone", status: "pending", notes: "Healthcare automation. Patient booking system.", autoReminder: true },
  { id: "10", title: "Demo", client: "Mike Osei", email: "mike@startup.gh", phone: "+233 20 123 4567", date: "2026-08-30", time: "10:00", duration: "45 min", type: "video", status: "confirmed", notes: "Ghana-based startup. Lead response system demo.", autoReminder: true },
];

const typeIcons: Record<string, typeof Video> = { "in-person": MapPin, video: Video, phone: Phone };
const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info" | "outline"> = { confirmed: "success", pending: "warning", completed: "info", cancelled: "danger", "no-show": "danger" };
const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; }

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function BookingPage() {
  const [appointments, setAppointments] = useState<Apt[]>(initialApts);
  const [selectedDate, setSelectedDate] = useState("2026-08-27");
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Apt | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(7);
  const [currentYear, setCurrentYear] = useState(2026);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [notif, setNotif] = useState("");
  const [autoReminders, setAutoReminders] = useState(true);
  const [maxBookings] = useState(8);
  const [bufferMinutes] = useState(15);

  // Edit form state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Apt>>({});

  // Form state
  const [formClient, setFormClient] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("2026-08-27");
  const [formTime, setFormTime] = useState("10:00");
  const [formDuration, setFormDuration] = useState("30");
  const [formType, setFormType] = useState("video");
  const [formNotes, setFormNotes] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formError, setFormError] = useState("");

  const showNotification = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 3000); };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const dateStr = (day: number) => `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(now.toISOString().split("T")[0]);
  };

  const todayApts = appointments.filter((a) => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const noShows = appointments.filter((a) => a.status === "no-show").length;

  const createBooking = useCallback(() => {
    if (!formClient.trim() || !formEmail.trim()) { setFormError("Client name and email are required"); return; }
    setFormError("");
    const newApt: Apt = {
      id: String(Date.now()),
      title: formTitle || "Consultation",
      client: formClient, email: formEmail, phone: formPhone,
      date: formDate, time: formTime,
      duration: `${formDuration} min`,
      type: formType as "in-person" | "video" | "phone",
      status: "confirmed",
      notes: formNotes, autoReminder: autoReminders, location: formLocation,
    };
    setAppointments((prev) => [...prev, newApt]);
    setFormClient(""); setFormEmail(""); setFormPhone(""); setFormTitle(""); setFormNotes(""); setFormLocation("");
    setShowNew(false);
    setSelectedDate(formDate);
    showNotification(`Appointment booked for ${newApt.client} on ${newApt.date} at ${newApt.time}!`);
  }, [formClient, formEmail, formPhone, formTitle, formDate, formTime, formDuration, formType, formNotes, autoReminders, formLocation]);

  const openDetail = (apt: Apt) => { setSelectedApt(apt); setShowDetail(true); setEditMode(false); setEditForm(apt); };

  const updateAptStatus = (aptId: string, status: Apt["status"]) => {
    setAppointments((prev) => prev.map((a) => a.id === aptId ? { ...a, status } : a));
    if (selectedApt?.id === aptId) setSelectedApt((prev) => prev ? { ...prev, status } : prev);
    showNotification("Status updated");
  };

  const saveEdits = () => {
    if (!selectedApt || !editForm) return;
    setAppointments((prev) => prev.map((a) => a.id === selectedApt.id ? { ...a, ...editForm } : a));
    setSelectedApt((prev) => prev ? { ...prev, ...editForm } : prev);
    setEditMode(false);
    showNotification("Appointment updated");
  };

  const deleteApt = (aptId: string) => {
    const apt = appointments.find((a) => a.id === aptId);
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    setShowDetail(false);
    showNotification(`Appointment with ${apt?.client} cancelled`);
  };

  const formatDuration = (d: string) => d;

  return (
    <div className="animate-fade-in">
      {notif && <div className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium animate-fade-in shadow-lg">{notif}</div>}
      <PageHeader title="Booking Engine" description="Turn enquiries into booked appointments without the back-and-forth" icon={<Calendar className="w-6 h-6" />} actions={<div className="flex gap-3">
        <div className="hidden sm:flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
          <button onClick={() => setView("calendar")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Calendar</button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>List</button>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />New Booking</Button>
      </div>} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard label="Today's Appointments" value={todayApts.length} icon={<Calendar className="w-5 h-5" />} gradient="primary" />
        <StatCard label="Confirmed" value={confirmed} icon={<CheckCircle className="w-5 h-5" />} gradient="success" />
        <StatCard label="Completion Rate" value={`${appointments.length > 0 ? Math.round((completed / appointments.length) * 100) : 0}%`} icon={<TrendingUp className="w-5 h-5" />} gradient="primary" />
        <StatCard label="No-Show Rate" value={`${appointments.length > 0 ? Math.round((noShows / appointments.length) * 100) : 0}%`} icon={<AlertTriangle className="w-5 h-5" />} gradient={noShows > 0 ? "danger" : "success"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {view === "calendar" ? (
            <Card>
              {/* Calendar header with Google-style month/year picker */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }} className="text-lg font-semibold text-foreground hover:bg-secondary px-3 py-1 rounded-lg transition-colors cursor-pointer">
                      {monthNames[currentMonth]}
                    </button>
                    {showMonthPicker && (
                      <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-3 grid grid-cols-3 gap-2 w-[280px]">
                        {monthNames.map((m, i) => (
                          <button key={m} onClick={() => { setCurrentMonth(i); setShowMonthPicker(false); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${i === currentMonth ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
                            {m.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }} className="text-lg font-semibold text-foreground hover:bg-secondary px-3 py-1 rounded-lg transition-colors cursor-pointer">
                      {currentYear}
                    </button>
                    {showYearPicker && (
                      <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-3 grid grid-cols-4 gap-2 w-[320px] max-h-[200px] overflow-y-auto">
                        {Array.from({ length: 21 }, (_, i) => currentYear - 10 + i).map((y) => (
                          <button key={y} onClick={() => { setCurrentYear(y); setShowYearPicker(false); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${y === currentYear ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={goToToday} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">Today</button>
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} className="h-16" />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const ds = dateStr(day);
                  const dayApts = appointments.filter((a) => a.date === ds);
                  const count = dayApts.length;
                  const sel = ds === selectedDate;
                  const isToday = ds === new Date().toISOString().split("T")[0];
                  return (
                    <button key={day} onClick={() => setSelectedDate(ds)} className={`h-16 rounded-lg p-1.5 text-left transition-all duration-200 cursor-pointer border ${sel ? "bg-primary/10 border-primary/30" : isToday ? "bg-secondary/50 border-border" : "border-transparent hover:bg-secondary/30 hover:border-border/50"}`}>
                      <span className={`text-xs font-medium ${isToday ? "text-primary" : sel ? "text-foreground" : "text-muted-foreground"}`}>{day}</span>
                      {count > 0 && <div className="mt-1">
                        {dayApts.slice(0, 3).map((a) => (
                          <div key={a.id} className={`h-1 rounded-full mb-0.5 ${a.status === "confirmed" ? "bg-success" : a.status === "pending" ? "bg-warning" : a.status === "completed" ? "bg-info" : "bg-destructive"}`} />
                        ))}
                        {count > 3 && <span className="text-[9px] text-primary font-medium">+{count - 3}</span>}
                      </div>}
                    </button>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">All Appointments ({appointments.length})</h3>
              <div className="space-y-3">
                {appointments.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map((a) => {
                  const TI = typeIcons[a.type] || Video;
                  return (
                    <div key={a.id} onClick={() => openDetail(a)} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><TI className="w-5 h-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><p className="text-sm font-medium text-foreground">{a.client}</p><Badge variant={statusColors[a.status]}>{a.status}</Badge></div>
                        <p className="text-xs text-muted-foreground truncate">{a.title} &bull; {a.date} at {a.time} &bull; {a.duration}</p>
                      </div>
                      <Edit3 className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{selectedDate === new Date().toISOString().split("T")[0] ? "Today" : selectedDate}</h3>
              <span className="text-xs text-muted-foreground">{todayApts.length} appointments</span>
            </div>
            {todayApts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No appointments</p>
                <Button variant="ghost" size="sm" onClick={() => setShowNew(true)} className="mt-2"><Plus className="w-3.5 h-3.5" />Book one</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayApts.map((a) => {
                  const TI = typeIcons[a.type] || Video;
                  return (
                    <div key={a.id} onClick={() => openDetail(a)} className="p-3 rounded-lg bg-secondary/20 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm font-medium text-foreground">{a.time}</span></div>
                        <Badge variant={statusColors[a.status]}>{a.status}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{a.client}</p>
                      <p className="text-xs text-muted-foreground mb-2">{a.title} &bull; {formatDuration(a.duration)}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><TI className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground capitalize">{a.type.replace("-", " ")}</span>{a.location && <span className="text-xs text-muted-foreground/60">&bull; {a.location}</span>}</div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Availability</h3>
            <div className="space-y-3">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => <div key={d} className="flex items-center justify-between"><span className="text-sm text-foreground">{d}</span><span className="text-xs text-muted-foreground">09:00 - 17:00</span></div>)}
              {["Saturday", "Sunday"].map((d) => <div key={d} className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{d}</span><Badge variant="outline">Unavailable</Badge></div>)}
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-foreground">Buffer</span><span className="text-xs text-muted-foreground">{bufferMinutes} min</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-foreground">Max/day</span><span className="text-xs text-muted-foreground">{maxBookings}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-foreground">Auto-reminders</span><Toggle checked={autoReminders} onChange={setAutoReminders} /></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Detail/Edit Modal */}
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedApt(null); setEditMode(false); }} title={editMode ? "Edit Appointment" : "Appointment Details"}>
        {selectedApt && (() => {
          const live = appointments.find((a) => a.id === selectedApt.id) || selectedApt;
          const form = editMode ? editForm : live;
          const setField = (k: keyof Apt, v: string | boolean) => { if (editMode) setEditForm((prev) => ({ ...prev, [k]: v })); };
          const TI = typeIcons[live.type] || Video;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{live.client.split(" ").map((n) => n[0]).join("")}</div>
                <div className="flex-1">
                  {editMode ? <Input label="Client Name" value={form.client || ""} onChange={(v) => setField("client", v)} /> : <h3 className="text-lg font-semibold text-foreground">{live.client}</h3>}
                  {editMode ? <Input label="Title" value={form.title || ""} onChange={(v) => setField("title", v)} /> : <p className="text-sm text-muted-foreground">{live.title} at {live.location || "TBD"}</p>}
                </div>
                <Badge variant={statusColors[live.status]}>{live.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
                <div><p className="text-xs text-muted-foreground mb-1">Email</p>{editMode ? <Input value={form.email || ""} onChange={(v) => setField("email", v)} /> : <p className="text-sm text-foreground">{live.email}</p>}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Phone</p>{editMode ? <Input value={form.phone || ""} onChange={(v) => setField("phone", v)} /> : <p className="text-sm text-foreground">{live.phone}</p>}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Date</p>{editMode ? <Input type="date" value={form.date || ""} onChange={(v) => setField("date", v)} /> : <p className="text-sm text-foreground">{live.date}</p>}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Time</p>{editMode ? <Select value={form.time || ""} onChange={(v) => setField("time", v)} options={timeSlots.map((t) => ({ value: t, label: t }))} /> : <p className="text-sm text-foreground">{live.time}</p>}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Duration</p>{editMode ? <Select value={form.duration || ""} onChange={(v) => setField("duration", v)} options={[{ value: "15 min", label: "15 min" }, { value: "30 min", label: "30 min" }, { value: "45 min", label: "45 min" }, { value: "60 min", label: "1 hour" }]} /> : <p className="text-sm text-foreground">{live.duration}</p>}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Type</p>{editMode ? <Select value={form.type || ""} onChange={(v) => setField("type", v)} options={[{ value: "video", label: "Video" }, { value: "phone", label: "Phone" }, { value: "in-person", label: "In-Person" }]} /> : <div className="flex items-center gap-2"><TI className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground capitalize">{live.type.replace("-", " ")}</span></div>}</div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                {editMode ? <Input multiline value={form.notes || ""} onChange={(v) => setField("notes", v)} rows={3} /> : <p className="text-sm text-foreground">{live.notes || "No notes"}</p>}
              </div>

              {/* Status actions */}
              {!editMode && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Update Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {(["pending", "confirmed", "completed", "no-show", "cancelled"] as const).map((s) => (
                      <button key={s} onClick={() => updateAptStatus(live.id, s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${live.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {editMode ? (
                  <>
                    <Button variant="secondary" onClick={() => setEditMode(false)} className="flex-1">Cancel</Button>
                    <Button onClick={saveEdits} className="flex-1"><CheckCircle className="w-4 h-4" />Save Changes</Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => setEditMode(true)} className="flex-1"><Edit3 className="w-4 h-4" />Edit</Button>
                    <Button variant="danger" onClick={() => deleteApt(live.id)} className="flex-1"><Trash2 className="w-4 h-4" />Cancel Meeting</Button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* New Booking Modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setFormError(""); }} title="New Appointment">
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"><p className="text-sm text-destructive">{formError}</p></div>}
          <Input label="Client Name *" placeholder="e.g. Adebayo Johnson" value={formClient} onChange={setFormClient} />
          <div className="grid grid-cols-2 gap-4"><Input label="Email *" placeholder="email@company.com" value={formEmail} onChange={setFormEmail} /><Input label="Phone" placeholder="+234 801 234 5678" value={formPhone} onChange={setFormPhone} /></div>
          <Input label="Meeting Title" placeholder="e.g. Consultation, Demo" value={formTitle} onChange={setFormTitle} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" value={formDate} onChange={setFormDate} />
            <Select label="Time *" value={formTime} onChange={setFormTime} options={timeSlots.map((t) => ({ value: t, label: t }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Duration" value={formDuration} onChange={setFormDuration} options={[{ value: "15", label: "15 min" }, { value: "30", label: "30 min" }, { value: "45", label: "45 min" }, { value: "60", label: "1 hour" }]} />
            <Select label="Type" value={formType} onChange={setFormType} options={[{ value: "video", label: "Video Call" }, { value: "phone", label: "Phone Call" }, { value: "in-person", label: "In-Person" }]} />
          </div>
          <Input label="Location / Link" placeholder="e.g. Zoom, Office, Google Meet" value={formLocation} onChange={setFormLocation} />
          <Input label="Notes" multiline placeholder="Context for this meeting..." rows={2} value={formNotes} onChange={setFormNotes} />
          <div className="flex items-center gap-4 p-3 rounded-lg bg-success/5 border border-success/20"><CheckCircle className="w-4 h-4 text-success shrink-0" /><p className="text-xs text-success">Confirmation and reminder sent automatically via email and WhatsApp</p></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowNew(false); setFormError(""); }} className="flex-1">Cancel</Button>
            <Button onClick={createBooking} className="flex-1"><Calendar className="w-4 h-4" />Book Appointment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
