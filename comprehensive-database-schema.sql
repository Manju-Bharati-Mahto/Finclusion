-- Comprehensive Database Schema for Finclusion Finance App
-- Separate tables for Registration, Categories, Transactions, and Reminders
-- Run this SQL in your Supabase SQL Editor

-- ========================================
-- 1. USER REGISTRATION & PROFILE TABLES
-- ========================================

-- Main user profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Stores encrypted password hash for debugging/admin purposes
    phone_number TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    profile_image_url TEXT,
    bio TEXT,
    registration_ip TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_verification', 'deactivated')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
    currency TEXT DEFAULT 'USD',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_zone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    privacy_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User verification and security
CREATE TABLE IF NOT EXISTS public.user_verification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expires TIMESTAMP WITH TIME ZONE,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    pan_number TEXT,
    aadhar_number TEXT,
    bank_account_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================
-- 2. CATEGORIES MANAGEMENT TABLES
-- ========================================

-- Main categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer', 'investment')) NOT NULL,
    color TEXT DEFAULT '#6B7280',
    icon TEXT DEFAULT 'category',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    parent_category_id UUID REFERENCES public.expense_categories ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, name, type)
);

-- Category budgets
CREATE TABLE IF NOT EXISTS public.category_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.expense_categories ON DELETE CASCADE NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL CHECK (budget_amount > 0),
    period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    alert_threshold DECIMAL(5,2) DEFAULT 80.00 CHECK (alert_threshold BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, category_id, period, start_date)
);

-- Category statistics (for analytics)
CREATE TABLE IF NOT EXISTS public.category_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.expense_categories ON DELETE CASCADE NOT NULL,
    month_year DATE NOT NULL,
    total_amount DECIMAL(15,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    average_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, category_id, month_year)
);

-- ========================================
-- 3. TRANSACTIONS MANAGEMENT TABLES
-- ========================================

-- Main transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.expense_categories ON DELETE SET NULL,
    transaction_type TEXT CHECK (transaction_type IN ('income', 'expense', 'transfer', 'investment')) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount != 0),
    currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    base_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount * exchange_rate) STORED,
    title TEXT NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    location TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'upi', 'wallet', 'cheque', 'other')),
    reference_number TEXT,
    receipt_url TEXT,
    tags TEXT[], -- Array of tags for better categorization
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    recurring_end_date DATE,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transaction attachments (receipts, bills, etc.)
CREATE TABLE IF NOT EXISTS public.transaction_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.financial_transactions ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Split transactions (for shared expenses)
CREATE TABLE IF NOT EXISTS public.transaction_splits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.financial_transactions ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    split_amount DECIMAL(15,2) NOT NULL,
    split_percentage DECIMAL(5,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- ========================================
-- 4. REMINDERS & NOTIFICATIONS TABLES
-- ========================================

-- Bill reminders and payment alerts
CREATE TABLE IF NOT EXISTS public.bill_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.expense_categories ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    due_date DATE NOT NULL,
    reminder_date DATE NOT NULL,
    frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')) DEFAULT 'once',
    next_due_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    color TEXT DEFAULT '#00BF63',
    icon TEXT DEFAULT 'bell',
    is_paid BOOLEAN DEFAULT FALSE,
    paid_on DATE,
    paid_amount DECIMAL(15,2),
    auto_mark_paid BOOLEAN DEFAULT FALSE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    email_notification BOOLEAN DEFAULT FALSE,
    push_notification BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Goal reminders and savings targets
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(15,2) DEFAULT 0 CHECK (current_amount >= 0),
    currency TEXT DEFAULT 'USD',
    target_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    color TEXT DEFAULT '#4F46E5',
    icon TEXT DEFAULT 'target',
    category TEXT,
    monthly_target DECIMAL(15,2),
    auto_save_amount DECIMAL(15,2),
    auto_save_frequency TEXT CHECK (auto_save_frequency IN ('daily', 'weekly', 'monthly')),
    reminder_frequency TEXT CHECK (reminder_frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'weekly',
    is_active BOOLEAN DEFAULT TRUE,
    is_achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- General notifications and alerts
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('reminder', 'alert', 'achievement', 'budget_warning', 'payment_due', 'goal_progress', 'system')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT DEFAULT 'bell',
    color TEXT DEFAULT '#3B82F6',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    related_id UUID, -- Can reference transaction, reminder, goal, etc.
    related_type TEXT, -- 'transaction', 'reminder', 'goal', etc.
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================
-- 5. ADDITIONAL UTILITY TABLES
-- ========================================

-- Account/Wallet management
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('bank', 'cash', 'credit_card', 'investment', 'wallet', 'other')) NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    color TEXT DEFAULT '#6B7280',
    icon TEXT DEFAULT 'bank',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, account_name)
);

-- Monthly budget summary
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    month_year DATE NOT NULL,
    total_income DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    total_budget DECIMAL(15,2) DEFAULT 0,
    savings_target DECIMAL(15,2) DEFAULT 0,
    actual_savings DECIMAL(15,2) DEFAULT 0,
    budget_status TEXT CHECK (budget_status IN ('under_budget', 'on_budget', 'over_budget')) DEFAULT 'on_budget',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, month_year)
);

-- ========================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ========================================

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for service role and matching users" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- User Preferences Policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- User Verification Policies
CREATE POLICY "Users can view own verification" ON public.user_verification
    FOR ALL USING (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can manage own categories" ON public.expense_categories
    FOR ALL USING (auth.uid() = user_id);

-- Category Budgets Policies
CREATE POLICY "Users can manage own category budgets" ON public.category_budgets
    FOR ALL USING (auth.uid() = user_id);

-- Category Statistics Policies
CREATE POLICY "Users can view own category statistics" ON public.category_statistics
    FOR ALL USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can manage own transactions" ON public.financial_transactions
    FOR ALL USING (auth.uid() = user_id);

-- Transaction Attachments Policies
CREATE POLICY "Users can manage own transaction attachments" ON public.transaction_attachments
    FOR ALL USING (auth.uid() = uploaded_by);

-- Transaction Splits Policies (users can see splits they're part of)
CREATE POLICY "Users can view relevant transaction splits" ON public.transaction_splits
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = (SELECT user_id FROM public.financial_transactions WHERE id = transaction_id)
    );
CREATE POLICY "Transaction owners can manage splits" ON public.transaction_splits
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.financial_transactions WHERE id = transaction_id)
    );
CREATE POLICY "Split participants can update their splits" ON public.transaction_splits
    FOR UPDATE USING (auth.uid() = user_id);

-- Reminders Policies
CREATE POLICY "Users can manage own reminders" ON public.bill_reminders
    FOR ALL USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can manage own goals" ON public.savings_goals
    FOR ALL USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can manage own notifications" ON public.user_notifications
    FOR ALL USING (auth.uid() = user_id);

-- Accounts Policies
CREATE POLICY "Users can manage own accounts" ON public.user_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Monthly Budgets Policies
CREATE POLICY "Users can manage own monthly budgets" ON public.monthly_budgets
    FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- User tables indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_user_id ON public.user_verification(user_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON public.expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_type ON public.expense_categories(type);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON public.expense_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_id ON public.category_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_category_budgets_category ON public.category_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_category_statistics_user_month ON public.category_statistics(user_id, month_year);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON public.financial_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_attachments_transaction ON public.transaction_attachments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction ON public.transaction_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_user ON public.transaction_splits(user_id);

-- Reminders and notifications indexes
CREATE INDEX IF NOT EXISTS idx_bill_reminders_user_id ON public.bill_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_due_date ON public.bill_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_status ON public.bill_reminders(status);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON public.savings_goals(target_date);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(is_read);

-- Utility tables indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON public.user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_type ON public.user_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month ON public.monthly_budgets(user_id, month_year);

-- ========================================
-- 9. CREATE TRIGGERS AND FUNCTIONS
-- ========================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables
CREATE TRIGGER set_updated_at_user_profiles
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_preferences
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_verification
    BEFORE UPDATE ON public.user_verification
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_expense_categories
    BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_category_budgets
    BEFORE UPDATE ON public.category_budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_category_statistics
    BEFORE UPDATE ON public.category_statistics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_financial_transactions
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_transaction_splits
    BEFORE UPDATE ON public.transaction_splits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_bill_reminders
    BEFORE UPDATE ON public.bill_reminders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_savings_goals
    BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_accounts
    BEFORE UPDATE ON public.user_accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_monthly_budgets
    BEFORE UPDATE ON public.monthly_budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- New user registration handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile with password hash and registration details
    INSERT INTO public.user_profiles (
        id, 
        full_name, 
        email, 
        password_hash,
        registration_ip,
        account_status
    ) VALUES (
        NEW.id, 
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ), 
        NEW.email,
        NEW.encrypted_password, -- Store the encrypted password hash
        NEW.raw_user_meta_data->>'ip_address',
        CASE 
            WHEN NEW.email_confirmed_at IS NULL THEN 'pending_verification'
            ELSE 'active'
        END
    );
    
    -- Insert user preferences with defaults
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    -- Insert user verification record with email status
    INSERT INTO public.user_verification (
        user_id,
        email_verified,
        email_verified_at
    ) VALUES (
        NEW.id,
        NEW.email_confirmed_at IS NOT NULL,
        NEW.email_confirmed_at
    );
    
    -- Insert default expense categories
    INSERT INTO public.expense_categories (user_id, name, type, color, icon, is_default) VALUES
    (NEW.id, 'Food & Dining', 'expense', '#FF7D7D', 'utensils', true),
    (NEW.id, 'Shopping', 'expense', '#8B5CF6', 'shopping-bag', true),
    (NEW.id, 'Entertainment', 'expense', '#F59E0B', 'film', true),
    (NEW.id, 'Transportation', 'expense', '#10B981', 'car', true),
    (NEW.id, 'Utilities', 'expense', '#3B82F6', 'zap', true),
    (NEW.id, 'Healthcare', 'expense', '#EC4899', 'heart', true),
    (NEW.id, 'Education', 'expense', '#06B6D4', 'book-open', true),
    (NEW.id, 'Insurance', 'expense', '#84CC16', 'shield', true),
    (NEW.id, 'Gifts & Donations', 'expense', '#F97316', 'gift', true),
    (NEW.id, 'Personal Care', 'expense', '#EF4444', 'user', true),
    (NEW.id, 'Salary', 'income', '#00BF63', 'dollar-sign', true),
    (NEW.id, 'Freelancing', 'income', '#22C55E', 'briefcase', true),
    (NEW.id, 'Investments', 'income', '#3B82F6', 'trending-up', true),
    (NEW.id, 'Other Income', 'income', '#6366F1', 'plus-circle', true);
    
    -- Insert default cash account
    INSERT INTO public.user_accounts (user_id, account_name, account_type, is_default)
    VALUES (NEW.id, 'Cash', 'cash', true);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle email confirmation
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user verification when email is confirmed
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.user_verification 
        SET 
            email_verified = TRUE,
            email_verified_at = NEW.email_confirmed_at,
            updated_at = NOW()
        WHERE user_id = NEW.id;
        
        -- Update account status to active
        UPDATE public.user_profiles
        SET 
            account_status = 'active',
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for email confirmation
CREATE TRIGGER on_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- Function to handle user login tracking
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last login and increment login count
    IF NEW.last_sign_in_at IS NOT NULL AND (OLD.last_sign_in_at IS NULL OR NEW.last_sign_in_at > OLD.last_sign_in_at) THEN
        UPDATE public.user_profiles
        SET 
            last_login_at = NEW.last_sign_in_at,
            login_count = login_count + 1,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for login tracking
CREATE TRIGGER on_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_login();

-- Function to update category statistics
CREATE OR REPLACE FUNCTION public.update_category_statistics()
RETURNS TRIGGER AS $$
DECLARE
    target_month DATE;
BEGIN
    -- Determine the month to update based on operation
    IF TG_OP = 'DELETE' THEN
        target_month := date_trunc('month', OLD.transaction_date)::DATE;
    ELSE
        target_month := date_trunc('month', NEW.transaction_date)::DATE;
    END IF;
    
    -- Update statistics for the affected month and category
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.category_statistics (user_id, category_id, month_year, total_amount, transaction_count, average_amount)
        SELECT 
            OLD.user_id,
            OLD.category_id,
            target_month,
            COALESCE(SUM(amount), 0),
            COUNT(*),
            COALESCE(AVG(amount), 0)
        FROM public.financial_transactions
        WHERE user_id = OLD.user_id 
            AND category_id = OLD.category_id 
            AND date_trunc('month', transaction_date)::DATE = target_month
        ON CONFLICT (user_id, category_id, month_year)
        DO UPDATE SET
            total_amount = EXCLUDED.total_amount,
            transaction_count = EXCLUDED.transaction_count,
            average_amount = EXCLUDED.average_amount,
            updated_at = NOW();
    ELSE
        INSERT INTO public.category_statistics (user_id, category_id, month_year, total_amount, transaction_count, average_amount)
        SELECT 
            NEW.user_id,
            NEW.category_id,
            target_month,
            COALESCE(SUM(amount), 0),
            COUNT(*),
            COALESCE(AVG(amount), 0)
        FROM public.financial_transactions
        WHERE user_id = NEW.user_id 
            AND category_id = NEW.category_id 
            AND date_trunc('month', transaction_date)::DATE = target_month
        ON CONFLICT (user_id, category_id, month_year)
        DO UPDATE SET
            total_amount = EXCLUDED.total_amount,
            transaction_count = EXCLUDED.transaction_count,
            average_amount = EXCLUDED.average_amount,
            updated_at = NOW();
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update category statistics
CREATE TRIGGER update_category_statistics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_category_statistics();

-- ========================================
-- 10. GRANT PERMISSIONS
-- ========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ========================================
-- 11. CREATE VIEWS FOR EASY QUERYING
-- ========================================

-- View for user dashboard summary
CREATE OR REPLACE VIEW public.user_dashboard_summary AS
SELECT 
    up.id as user_id,
    up.full_name,
    up.email,
    
    -- Current month totals
    COALESCE(income_summary.total_income, 0) as current_month_income,
    COALESCE(expense_summary.total_expenses, 0) as current_month_expenses,
    COALESCE(income_summary.total_income, 0) - COALESCE(expense_summary.total_expenses, 0) as current_month_savings,
    
    -- Account balances
    COALESCE(account_summary.total_balance, 0) as total_balance,
    
    -- Goals and reminders count
    COALESCE(goals_summary.active_goals, 0) as active_goals,
    COALESCE(reminders_summary.pending_reminders, 0) as pending_reminders,
    COALESCE(notifications_summary.unread_notifications, 0) as unread_notifications
    
FROM public.user_profiles up

LEFT JOIN (
    SELECT 
        user_id,
        SUM(amount) as total_income
    FROM public.financial_transactions
    WHERE transaction_type = 'income'
        AND date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE)
        AND status = 'completed'
    GROUP BY user_id
) income_summary ON up.id = income_summary.user_id

LEFT JOIN (
    SELECT 
        user_id,
        SUM(amount) as total_expenses
    FROM public.financial_transactions
    WHERE transaction_type = 'expense'
        AND date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE)
        AND status = 'completed'
    GROUP BY user_id
) expense_summary ON up.id = expense_summary.user_id

LEFT JOIN (
    SELECT 
        user_id,
        SUM(balance) as total_balance
    FROM public.user_accounts
    WHERE is_active = true
    GROUP BY user_id
) account_summary ON up.id = account_summary.user_id

LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as active_goals
    FROM public.savings_goals
    WHERE is_active = true AND is_achieved = false
    GROUP BY user_id
) goals_summary ON up.id = goals_summary.user_id

LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as pending_reminders
    FROM public.bill_reminders
    WHERE status = 'active' AND due_date <= CURRENT_DATE + INTERVAL '7 days'
    GROUP BY user_id
) reminders_summary ON up.id = reminders_summary.user_id

LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as unread_notifications
    FROM public.user_notifications
    WHERE is_read = false AND (expires_at IS NULL OR expires_at > NOW())
    GROUP BY user_id
) notifications_summary ON up.id = notifications_summary.user_id;

-- View for transaction history with category details
CREATE OR REPLACE VIEW public.transaction_history_view AS
SELECT 
    ft.id,
    ft.user_id,
    ft.transaction_type,
    ft.amount,
    ft.currency,
    ft.title,
    ft.description,
    ft.transaction_date,
    ft.payment_method,
    ft.status,
    ft.created_at,
    
    -- Category details
    ec.name as category_name,
    ec.color as category_color,
    ec.icon as category_icon,
    
    -- Account details
    ua.account_name,
    ua.account_type
    
FROM public.financial_transactions ft
LEFT JOIN public.expense_categories ec ON ft.category_id = ec.id
LEFT JOIN public.user_accounts ua ON ft.user_id = ua.user_id AND ua.is_default = true
ORDER BY ft.transaction_date DESC, ft.created_at DESC;

-- Comment with usage instructions
COMMENT ON TABLE public.user_profiles IS 'Main user profile information extending auth.users table';
COMMENT ON TABLE public.expense_categories IS 'User-defined categories for income and expense classification';
COMMENT ON TABLE public.financial_transactions IS 'All financial transactions including income, expenses, transfers, and investments';
COMMENT ON TABLE public.bill_reminders IS 'Bill payment reminders and recurring payment alerts';
COMMENT ON TABLE public.savings_goals IS 'User-defined savings goals and targets with progress tracking';
COMMENT ON VIEW public.user_dashboard_summary IS 'Comprehensive dashboard view with user statistics';
COMMENT ON VIEW public.transaction_history_view IS 'Transaction history with enriched category and account information';

-- In Supabase SQL Editor, run both files:
-- 1. comprehensive-database-schema.sql
-- 2. supabase-auth-configuration.sql