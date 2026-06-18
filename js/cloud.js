// =====================================================================
// CLOUD LAYER — Supabase auth + project sync (dengan fallback localStorage)
// =====================================================================
// Jika Supabase belum dikonfigurasi (SUPABASE_ENABLED=false), semua fungsi
// jatuh-balik ke localStorage agar aplikasi tetap berjalan seperti biasa.
// =====================================================================

const Cloud = {
  sb: null,
  enabled: false,
  user: null,

  init() {
    this.enabled = !!window.SUPABASE_ENABLED && !!window.supabase;
    if (!this.enabled) return false;
    try {
      this.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      // restore session + listen for changes
      this.sb.auth.getSession().then(({ data }) => {
        this.user = data?.session?.user || null;
        this._notify();
      });
      this.sb.auth.onAuthStateChange((_e, session) => {
        this.user = session?.user || null;
        this._notify();
      });
      return true;
    } catch (e) { console.warn('Cloud init gagal:', e); this.enabled = false; return false; }
  },

  _listeners: [],
  onChange(fn) { this._listeners.push(fn); if (this.user!==undefined) fn(this.user); },
  _notify() { this._listeners.forEach(fn => { try { fn(this.user); } catch(e){} }); },

  isLoggedIn() { return this.enabled && !!this.user; },
  displayName() {
    if (!this.user) return '';
    return this.user.user_metadata?.name || this.user.email?.split('@')[0] || 'Pengguna';
  },

  // ---------------- AUTH ----------------
  async signUp(name, email, password, phone) {
    if (!this.enabled) throw new Error('NOT_CONFIGURED');
    const { data, error } = await this.sb.auth.signUp({
      email, password,
      options: { data: { name, phone } }
    });
    if (error) throw error;
    return data;
  },
  async signIn(email, password) {
    if (!this.enabled) throw new Error('NOT_CONFIGURED');
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signInWithGoogle() {
    if (!this.enabled) throw new Error('NOT_CONFIGURED');
    const { error } = await this.sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
    if (error) throw error;
  },
  async signOut() {
    if (!this.enabled) return;
    await this.sb.auth.signOut();
    this.user = null; this._notify();
  },

  // ---------------- PROJECTS ----------------
  // Tabel `projects`: id (uuid), user_id (uuid), name (text), data (jsonb), updated_at (timestamptz)
  async listProjects() {
    if (!this.isLoggedIn()) return null;
    const { data, error } = await this.sb.from('projects')
      .select('id,name,updated_at').order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async saveProjectCloud(name, projectData, id) {
    if (!this.isLoggedIn()) throw new Error('NOT_LOGGED_IN');
    const row = { user_id: this.user.id, name, data: projectData, updated_at: new Date().toISOString() };
    if (id) row.id = id;
    const { data, error } = await this.sb.from('projects').upsert(row).select('id').single();
    if (error) throw error;
    return data?.id;
  },
  async loadProjectCloud(id) {
    if (!this.isLoggedIn()) throw new Error('NOT_LOGGED_IN');
    const { data, error } = await this.sb.from('projects').select('data,name').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async deleteProjectCloud(id) {
    if (!this.isLoggedIn()) throw new Error('NOT_LOGGED_IN');
    const { error } = await this.sb.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------------- SUBSCRIPTION (read) ----------------
  // Tabel `subscriptions`: user_id (uuid, pk), plan (text), cycle (text), expires_at (timestamptz)
  async getSubscription() {
    if (!this.isLoggedIn()) return null;
    const { data } = await this.sb.from('subscriptions').select('*').eq('user_id', this.user.id).maybeSingle();
    return data || null;
  },
};

window.Cloud = Cloud;
