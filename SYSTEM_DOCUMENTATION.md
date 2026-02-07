# विचारमंच परिवार - System Documentation
## Complete Technical & Functional Report

---

## 📋 Executive Summary

**विचारमंच परिवार** is a comprehensive web application built for a community organization following Ambedkarite ideology. The platform serves as a digital hub for managing community events, quizzes, donations, accounts, and spreading awareness about Dr. Babasaheb Ambedkar's teachings and Buddhist principles.

---

## 🏗️ Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 18 with TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS with shadcn/ui components |
| **State Management** | TanStack React Query |
| **Routing** | React Router DOM v6 |
| **Animations** | Framer Motion |
| **Backend** | Lovable Cloud (Supabase) |
| **Database** | PostgreSQL |
| **Authentication** | Supabase Auth |
| **AI Integration** | Lovable AI Gateway |

### Project Structure

```
vicharmanch/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images (logos, backgrounds)
│   ├── components/
│   │   ├── admin/            # Admin dashboard components
│   │   │   ├── AccountsManagement.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   ├── CertificateManagement.tsx
│   │   │   ├── DonationManagement.tsx
│   │   │   ├── NoticeManagement.tsx
│   │   │   ├── ProgramManagement.tsx
│   │   │   ├── QuizManagement.tsx
│   │   │   └── YearLockManager.tsx
│   │   ├── home/             # Homepage components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── IntroSection.tsx
│   │   │   ├── NoticeSection.tsx
│   │   │   └── StatsSection.tsx
│   │   ├── ideology/         # Ideology page components
│   │   │   ├── GratitudeCarousel.tsx
│   │   │   └── MuktiMantraSection.tsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication state
│   ├── hooks/                # Custom React hooks
│   ├── integrations/
│   │   └── supabase/         # Supabase client & types
│   ├── lib/                  # Utility functions
│   └── pages/                # Route pages
│       ├── About.tsx
│       ├── Accounts.tsx
│       ├── AdminDashboard.tsx
│       ├── AdminLogin.tsx
│       ├── AdminSignup.tsx
│       ├── Ideology.tsx
│       ├── Index.tsx
│       ├── NotFound.tsx
│       ├── Programs.tsx
│       ├── Quiz.tsx
│       └── QuizTake.tsx
└── supabase/
    └── config.toml           # Supabase configuration
```

---

## 📊 Database Schema

### Tables Overview

#### 1. `homes` - घर माहिती
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| home_number | INTEGER | Home/unit number |
| home_name | TEXT | Family/owner name |
| contact_person | TEXT | Contact person |
| contact_phone | TEXT | Phone number |
| address | TEXT | Address |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update |

#### 2. `home_donations` - देणगी व्यवस्थापन
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| home_id | UUID | FK to homes |
| year | TEXT | Financial year |
| assigned_amount | DECIMAL | Assigned donation amount |
| paid_amount | DECIMAL | Paid amount |
| payment_date | TIMESTAMP | Payment date |
| notes | TEXT | Payment notes |

#### 3. `yearly_accounts` - वार्षिक खाते
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| year | TEXT | Account year |
| total_income | DECIMAL | Total income |
| total_expense | DECIMAL | Total expense |
| is_visible | BOOLEAN | Public visibility |

#### 4. `account_expenses` - खर्च तपशील
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| account_id | UUID | FK to yearly_accounts |
| item | TEXT | Expense description |
| amount | DECIMAL | Expense amount |

#### 5. `programs` - कार्यक्रम
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Program name |
| date | DATE | Event date |
| time | TIME | Event time |
| location | TEXT | Venue |
| description | TEXT | Description |
| status | TEXT | upcoming/ongoing/completed |
| is_visible | BOOLEAN | Public visibility |

#### 6. `program_winners` - विजेते
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| program_id | UUID | FK to programs |
| category | TEXT | Competition category |
| first_place | TEXT | Winner name |
| second_place | TEXT | Runner-up name |
| third_place | TEXT | Third place name |

#### 7. `quiz_questions` - प्रश्न
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| question | TEXT | Question text |
| option_a | TEXT | Option A |
| option_b | TEXT | Option B |
| option_c | TEXT | Option C |
| option_d | TEXT | Option D |
| correct_answer | TEXT | Correct option (A/B/C/D) |
| category | TEXT | Question category |

#### 8. `quiz_settings` - क्विझ सेटिंग्स
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| category | TEXT | Category |
| is_active | BOOLEAN | Quiz active status |
| duration_minutes | INTEGER | Time limit |

#### 9. `quiz_responses` - प्रतिसाद
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| participant_name | TEXT | Participant name |
| category | TEXT | Quiz category |
| score | INTEGER | Score obtained |
| total_questions | INTEGER | Total questions |
| tab_switches | INTEGER | Tab switch count |
| submitted_at | TIMESTAMP | Submission time |

#### 10. `quiz_answers` - उत्तरे
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| response_id | UUID | FK to quiz_responses |
| question_id | UUID | FK to quiz_questions |
| selected_answer | TEXT | Selected option |
| is_correct | BOOLEAN | Correctness flag |

#### 11. `notices` - सूचना
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Notice title |
| description | TEXT | Notice content |
| date | DATE | Notice date |
| notice_type | TEXT | Type (general/important) |
| is_new | BOOLEAN | New badge flag |
| is_visible | BOOLEAN | Public visibility |

#### 12. `user_roles` - वापरकर्ता भूमिका
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User ID from auth |
| role | ENUM | admin/user |

#### 13. `site_settings` - साइट सेटिंग्स
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| setting_key | TEXT | Setting identifier |
| setting_value | TEXT | Setting value |

---

## 🌐 Page Routes

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Index | Public | Homepage with hero, stats, notices |
| `/about` | About | Public | About the organization |
| `/ideology` | Ideology | Public | Ambedkarite ideology, 22 vows |
| `/programs` | Programs | Public | Event calendar & details |
| `/quiz` | Quiz | Public | Quiz categories |
| `/quiz/:category` | QuizTake | Public | Take quiz |
| `/accounts` | Accounts | Public | Public financial reports |
| `/admin-login` | AdminLogin | Public | Admin authentication |
| `/admin-signup` | AdminSignup | Public | Admin registration |
| `/admin` | AdminDashboard | Admin | Full admin panel |

---

## 🔧 Admin Features

### 1. कार्यक्रम व्यवस्थापन (Program Management)
- Create/Edit/Delete programs
- Set program status (upcoming/ongoing/completed)
- Toggle visibility for public
- Add competition winners
- Generate winner certificates (with template)

### 2. प्रमाणपत्र व्यवस्थापन (Certificate Management)
- Generate certificates for winners
- Custom template support
- Bulk download as ZIP
- Print-ready output

### 3. प्रश्नमंजुषा व्यवस्थापन (Quiz Management)
- Add/Edit/Delete questions
- Set correct answers (MCQ: A/B/C/D)
- Activate/Deactivate quiz
- Set time duration
- View participant responses
- Download detailed reports (CSV)
- Tab-switch monitoring for anti-cheating

### 4. सूचना व्यवस्थापन (Notice Management)
- Create announcements
- Set importance level
- Toggle "New" badge
- Control visibility

### 5. देणगी व्यवस्थापन (Donation Management)
- Home-wise donation tracking
- Assign yearly donation amounts
- Record payments with dates
- Filter by payment status (paid/pending/partial)
- Printable donation reports

### 6. खाते व्यवस्थापन (Accounts Management)
- Track income (from donations)
- Record expenses
- Balance calculation
- Toggle public visibility
- Printable expense reports

### 7. Year Lock & Archive
- Archive entire year's data to ZIP
- Human-readable reports (Marathi)
- Full system reset for new year
- Preserves quiz questions for reuse
- Clears all transactional data

---

## 🎨 Design System

### Color Palette (HSL)

```css
--background: 210 20% 98%
--foreground: 210 40% 15%
--primary: 210 60% 25%
--primary-foreground: 0 0% 100%
--secondary: 210 20% 94%
--accent: 45 90% 48%        /* Golden/Saffron */
--ashoka: 215 70% 45%       /* Ashoka Chakra Blue */
--muted: 210 20% 90%
--destructive: 0 85% 60%
```

### Typography
- Primary Font: System fonts with Devanagari support
- Headers: Bold weight
- Body: Regular weight
- All text in Marathi language

### Components (shadcn/ui)
- Cards, Tables, Dialogs
- Forms with validation
- Tabs, Accordions
- Toast notifications
- Responsive navigation

---

## 🔐 Security

### Authentication
- Email/password authentication via Supabase Auth
- Admin role verification from `user_roles` table
- Protected admin routes
- Session management

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies ensure proper data access
- Admin-only write operations
- Public read for visible content

---

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Touch-friendly interactions
- Collapsible navigation on mobile

---

## 🤖 AI Integration

- **Lovable AI Gateway** enabled
- API Key: Pre-configured (LOVABLE_API_KEY)
- Models available:
  - google/gemini-3-flash-preview (default)
  - google/gemini-2.5-pro
  - openai/gpt-5-mini
- Can be used for:
  - Content summarization
  - Translation features
  - Meeting minutes generation
  - Q&A about Dr. Ambedkar's teachings

---

## 📈 Analytics & Reports

### Available Reports
1. **Donation Report** - Home-wise donation summary
2. **Expense Report** - Itemized expense list
3. **Quiz Report** - Participant-wise scores with answers
4. **Year-End Archive** - Complete data backup

### Export Formats
- PDF (via print dialog)
- CSV (for spreadsheets)
- ZIP (for archives)
- TXT (human-readable)

---

## 🚀 Deployment

- **Platform**: Lovable Cloud
- **Preview URL**: Automatically generated
- **Published URL**: Custom domain support
- **CI/CD**: Automatic deployments on save

---

## 📞 Support & Maintenance

### Regular Tasks
- Backup data annually (Year Lock feature)
- Update quiz questions as needed
- Manage notices and programs
- Monitor donation collections

### Technical Contacts
- Lovable Support: support@lovable.dev

---

## 🙏 Key Ideological Content

### 22 Pratidnya (Vows)
Full 22 vows of Buddhist conversion are displayed in the "मुक्तिमंत्र" section on the Ideology page.

### Core Values
- समता (Equality)
- बंधुता (Fraternity)
- न्याय (Justice)
- शैक्षणिक (Educational)
- सामाजिक (Social)
- वैचारिक (Ideological)
- सांस्कृतिक (Cultural)
- बौद्धिक (Intellectual)

### Guiding Principles
- सर्वांचा, सर्वांसाठी
- अध्यक्षविहीन रचना
- महिलाशक्तीकरण
- बुद्ध, धम्म, संघ
- आंबेडकरवादी विचार
- संविधानवादी दृष्टिकोन
- भिमजल्लोष

---

## 📋 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026 | 2.0 | Added 22 Vows section, Buddha background, AI integration |
| 2025 | 1.5 | Year Lock feature, Certificate generation |
| 2025 | 1.0 | Initial release with core features |

---

**जय भीम • नमो बुद्धाय**

*This documentation was generated for विचारमंच परिवार project management.*
