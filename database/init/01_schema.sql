-- =============================================
-- Tiferet - Chabad House Management System
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS (admin system) ──
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── COMMUNITY MEMBERS ──
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    hebrew_name VARCHAR(100) DEFAULT '',
    father_hebrew_name VARCHAR(100) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    phone2 VARCHAR(50) DEFAULT '',
    address TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    birth_date DATE,
    hebrew_birth_date VARCHAR(50) DEFAULT '',
    death_date DATE,
    hebrew_death_date VARCHAR(50) DEFAULT '',
    is_deceased BOOLEAN DEFAULT false,
    family_members TEXT DEFAULT '',
    spouse_name VARCHAR(200) DEFAULT '',
    children_count INTEGER DEFAULT 0,
    membership_type VARCHAR(50) DEFAULT 'regular' CHECK (membership_type IN ('regular','premium','honorary','youth','senior')),
    membership_status VARCHAR(50) DEFAULT 'active' CHECK (membership_status IN ('active','inactive','suspended')),
    join_date DATE DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── DONORS ──
CREATE TABLE donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    company VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    donor_type VARCHAR(50) DEFAULT 'individual' CHECK (donor_type IN ('individual','company','foundation','anonymous')),
    donor_level VARCHAR(50) DEFAULT 'regular' CHECK (donor_level IN ('regular','silver','gold','platinum','diamond')),
    total_donated DECIMAL(12,2) DEFAULT 0,
    donation_count INTEGER DEFAULT 0,
    first_donation_date DATE,
    last_donation_date DATE,
    notes TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── DONATIONS ──
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ILS',
    donation_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash','check','credit_card','bank_transfer','paypal','bit','other')),
    receipt_number VARCHAR(100) DEFAULT '',
    campaign VARCHAR(255) DEFAULT '',
    purpose VARCHAR(255) DEFAULT '',
    dedication VARCHAR(500) DEFAULT '',
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('weekly','monthly','quarterly','annual')),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed','pending','cancelled','refunded')),
    tax_deductible BOOLEAN DEFAULT true,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── CAMPAIGNS ──
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    goal_amount DECIMAL(12,2) DEFAULT 0,
    raised_amount DECIMAL(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── EVENTS / PROGRAMS ──
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    event_type VARCHAR(50) DEFAULT 'shiur' CHECK (event_type IN ('shiur','shabbat','holiday','kids','women','fundraiser','community','other')),
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255) DEFAULT 'בית חב"ד',
    max_participants INTEGER,
    registered_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── EVENT REGISTRATIONS ──
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    guest_name VARCHAR(200),
    guest_phone VARCHAR(50),
    num_guests INTEGER DEFAULT 1,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, member_id)
);

-- ── REMINDERS / YAHRZEITS / BIRTHDAYS ──
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('birthday','yahrzeit','anniversary','custom','event')),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    reminder_date DATE NOT NULL,
    hebrew_date VARCHAR(50) DEFAULT '',
    is_recurring BOOLEAN DEFAULT true,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── EXPENSES ──
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    receipt_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── DONATION LANDING PAGES ──
CREATE TABLE landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    goal_amount DECIMAL(12,2) DEFAULT 0,
    raised_amount DECIMAL(12,2) DEFAULT 0,
    donation_count INTEGER DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'ILS',
    allow_usd BOOLEAN DEFAULT true,
    allow_monthly BOOLEAN DEFAULT true,
    preset_amounts_ils JSONB DEFAULT '[50,100,180,360,500,1000]',
    preset_amounts_usd JSONB DEFAULT '[18,36,50,100,180,500]',
    allow_custom_amount BOOLEAN DEFAULT true,
    min_amount DECIMAL(10,2) DEFAULT 10,
    thank_you_message TEXT DEFAULT 'תודה רבה על תרומתך הנדיבה! זכות גדולה עומדת לך.',
    is_active BOOLEAN DEFAULT true,
    end_date DATE,
    show_progress BOOLEAN DEFAULT true,
    show_donors BOOLEAN DEFAULT true,
    primary_color VARCHAR(20) DEFAULT '#1e3a5f',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── AMBASSADORS ──
CREATE TABLE ambassadors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    slug VARCHAR(100) UNIQUE NOT NULL,
    goal_amount DECIMAL(12,2) DEFAULT 0,
    raised_amount DECIMAL(12,2) DEFAULT 0,
    donation_count INTEGER DEFAULT 0,
    message TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── PUBLIC DONATIONS (from landing pages) ──
CREATE TABLE public_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
    ambassador_id UUID REFERENCES ambassadors(id) ON DELETE SET NULL,
    donor_name VARCHAR(200) NOT NULL,
    donor_email VARCHAR(255) DEFAULT '',
    donor_phone VARCHAR(50) DEFAULT '',
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ILS',
    is_monthly BOOLEAN DEFAULT false,
    dedication VARCHAR(500) DEFAULT '',
    is_anonymous BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── SITE SETTINGS ──
CREATE TABLE site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── INDEXES ──
CREATE INDEX idx_members_name ON members(last_name, first_name);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_members_deceased ON members(is_deceased);
CREATE INDEX idx_members_birth ON members(birth_date);
CREATE INDEX idx_members_death ON members(death_date);
CREATE INDEX idx_donors_level ON donors(donor_level);
CREATE INDEX idx_donors_member ON donors(member_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_campaign ON donations(campaign);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_type ON reminders(reminder_type);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_ambassadors_slug ON ambassadors(slug);
CREATE INDEX idx_ambassadors_page ON ambassadors(landing_page_id);
CREATE INDEX idx_public_donations_page ON public_donations(landing_page_id);
CREATE INDEX idx_public_donations_ambassador ON public_donations(ambassador_id);

-- ── TRIGGERS ──
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_donors_updated BEFORE UPDATE ON donors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_landing_pages_updated BEFORE UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── AUTO UPDATE DONOR STATS ──
CREATE OR REPLACE FUNCTION update_donor_stats() RETURNS TRIGGER AS $$
BEGIN
  UPDATE donors SET
    total_donated = (SELECT COALESCE(SUM(amount),0) FROM donations WHERE donor_id = COALESCE(NEW.donor_id, OLD.donor_id) AND status='completed'),
    donation_count = (SELECT COUNT(*) FROM donations WHERE donor_id = COALESCE(NEW.donor_id, OLD.donor_id) AND status='completed'),
    last_donation_date = (SELECT MAX(donation_date) FROM donations WHERE donor_id = COALESCE(NEW.donor_id, OLD.donor_id) AND status='completed')
  WHERE id = COALESCE(NEW.donor_id, OLD.donor_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_donation_stats AFTER INSERT OR UPDATE OR DELETE ON donations FOR EACH ROW EXECUTE FUNCTION update_donor_stats();
