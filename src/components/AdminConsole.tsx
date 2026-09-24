'use client';

import {useEffect, useMemo, useState} from 'react';
import type {Locale} from '@/lib/types';
import {AdminShell} from './AdminShell';
import {FallbackImage} from './FallbackImage';

type Row = Record<string, any>;
type Tab = 'dashboard' | 'categories' | 'brands' | 'homepage' | 'settings' | 'leads' | 'media' | 'users' | 'activity';

const emptyData = {
  products: [] as Row[],
  categories: [] as Row[],
  brands: [] as Row[],
  homepage: [] as Row[],
  settings: {} as Row,
  leads: [] as Row[],
  employees: [] as Row[]
};

function inputClass() {
  return 'h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm font-bold text-white outline-none focus:border-brand-neon';
}

function areaClass() {
  return `${inputClass()} min-h-28 py-3`;
}

function buttonClass(tone: 'primary' | 'quiet' | 'danger' = 'quiet') {
  if (tone === 'primary') return 'h-10 rounded-md bg-brand-neon px-4 text-sm font-black text-white disabled:opacity-50';
  if (tone === 'danger') return 'h-10 rounded-md bg-red-500/15 px-4 text-sm font-black text-red-200 disabled:opacity-50';
  return 'h-10 rounded-md border border-white/10 bg-black px-4 text-sm font-black text-zinc-200 disabled:opacity-50';
}

function labelClass() {
  return 'mb-1 block text-xs font-black uppercase text-zinc-500';
}

function imagesFromProduct(product: Row) {
  const urls = Array.isArray(product.image_urls) ? product.image_urls : product.image_url ? [product.image_url] : [];
  return urls.map((url) => String(url).trim()).filter(Boolean);
}

export function AdminConsole({locale, initialTab = 'dashboard'}: {locale: Locale; initialTab?: Tab}) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [activeTab] = useState<Tab>(initialTab);
  const [data, setData] = useState(emptyData);
  const [status, setStatus] = useState(t('Loading Supabase admin data...', 'جاري تحميل بيانات الأدمن من Supabase...'));
  const [categoryForm, setCategoryForm] = useState<Row>({id: '', name_en: '', name_ar: '', slug: '', icon: '', sort_order: '0', is_visible: true});
  const [brandForm, setBrandForm] = useState<Row>({id: '', name_en: '', name_ar: '', logo_url: '', sort_order: '0', is_visible: true});
  const [sectionForm, setSectionForm] = useState<Row>({id: '', title_en: '', title_ar: '', source: '', is_visible: true, sort_order: '0'});
  const [settingsForm, setSettingsForm] = useState<Row>({});
  const [employeeForm, setEmployeeForm] = useState<Row>({id: '', name: '', email: '', role: 'staff', is_active: true});

  const stats = useMemo(() => {
    return {
      products: data.products.length,
      categories: data.categories.length,
      brands: data.brands.length,
      leads: data.leads.length
    };
  }, [data]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const response = await fetch('/api/admin/console', {cache: 'no-store', credentials: 'same-origin'});
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setStatus(result?.message || t('Admin load failed.', 'فشل تحميل بيانات الأدمن.'));
      return;
    }
    setData(result.data);
    setSettingsForm(result.data.settings ?? {});
    setStatus(t('Connected to Supabase.', 'متصل بـ Supabase.'));
  }

  async function action(actionName: string, payload: Row) {
    setStatus(t('Saving...', 'جاري الحفظ...'));
    const response = await fetch('/api/admin/console', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action: actionName, payload})
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setStatus(result?.message || t('Action failed.', 'فشلت العملية.'));
      return false;
    }
    setData(result.data);
    setSettingsForm(result.data.settings ?? {});
    setStatus(t('Saved in Supabase.', 'تم الحفظ في Supabase.'));
    return true;
  }

  async function signOut() {
    await fetch('/api/admin/logout', {method: 'POST', credentials: 'same-origin'});
    window.location.assign(`/${locale}/admin/login`);
  }

  const titleMap: Record<Tab, string> = {
    dashboard: t('Dashboard', 'لوحة التحكم'),
    categories: t('Categories', 'الأقسام'),
    brands: t('Brands', 'الماركات'),
    homepage: t('Homepage', 'الصفحة الرئيسية'),
    settings: t('Store Settings', 'إعدادات المتجر'),
    leads: t('WhatsApp Leads', 'طلبات واتساب'),
    media: t('Media Library', 'مكتبة الوسائط'),
    users: t('Users & Roles', 'المستخدمون والصلاحيات'),
    activity: t('Activity Log', 'سجل النشاط')
  };

  return (
    <AdminShell
      actions={(
        <>
          <button className={buttonClass()} onClick={() => void load()} type="button">{t('Refresh', 'تحديث')}</button>
          <button className={buttonClass('danger')} onClick={() => void signOut()} type="button">{t('Sign out', 'تسجيل الخروج')}</button>
        </>
      )}
      locale={locale}
      subtitle={t('Clean Supabase-powered administration for daily store work.', 'إدارة واضحة مرتبطة بـ Supabase للعمل اليومي في المتجر.')}
      title={titleMap[activeTab]}
    >
      <p className="rounded-md border border-white/10 bg-zinc-950 p-3 text-sm font-bold text-zinc-300">{status}</p>

      {activeTab === 'dashboard' ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [t('Products', 'المنتجات'), stats.products],
            [t('Categories', 'الأقسام'), stats.categories],
            [t('Brands', 'الماركات'), stats.brands],
            [t('WhatsApp Leads', 'طلبات واتساب'), stats.leads]
          ].map(([label, value]) => (
            <div className="rounded-lg border border-white/10 bg-zinc-950 p-5" key={String(label)}>
              <p className="text-sm font-black text-zinc-500">{label}</p>
              <strong className="mt-2 block text-3xl font-black text-white">{value}</strong>
            </div>
          ))}
        </section>
      ) : null}

      {activeTab === 'categories' ? (
        <CrudSection
          form={categoryForm}
          rows={data.categories}
          setForm={setCategoryForm}
          title={t('Categories', 'الأقسام')}
          fields={[
            ['name_ar', t('Arabic name', 'الاسم بالعربي')],
            ['name_en', t('English name', 'الاسم بالإنجليزي')],
            ['slug', t('Slug', 'الرابط')],
            ['icon', t('Image / icon URL', 'رابط الصورة / الأيقونة')],
            ['sort_order', t('Sort order', 'ترتيب العرض')]
          ]}
          onDelete={(row) => action('deleteCategory', {id: row.id})}
          onNew={() => setCategoryForm({id: '', name_en: '', name_ar: '', slug: '', icon: '', sort_order: '0', is_visible: true})}
          onSave={() => action('saveCategory', categoryForm)}
          t={t}
        />
      ) : null}

      {activeTab === 'brands' ? (
        <CrudSection
          form={brandForm}
          rows={data.brands}
          setForm={setBrandForm}
          title={t('Brands', 'الماركات')}
          fields={[
            ['name_ar', t('Arabic name', 'الاسم بالعربي')],
            ['name_en', t('English name', 'الاسم بالإنجليزي')],
            ['logo_url', t('Logo URL', 'رابط الشعار')],
            ['sort_order', t('Sort order', 'ترتيب العرض')]
          ]}
          onDelete={(row) => action('deleteBrand', {id: row.id})}
          onNew={() => setBrandForm({id: '', name_en: '', name_ar: '', logo_url: '', sort_order: '0', is_visible: true})}
          onSave={() => action('saveBrand', brandForm)}
          t={t}
        />
      ) : null}

      {activeTab === 'homepage' ? (
        <CrudSection
          form={sectionForm}
          rows={data.homepage}
          setForm={setSectionForm}
          title={t('Homepage sections', 'أقسام الصفحة الرئيسية')}
          fields={[
            ['id', 'ID'],
            ['title_ar', t('Arabic title', 'العنوان بالعربي')],
            ['title_en', t('English title', 'العنوان بالإنجليزي')],
            ['source', t('Source', 'المصدر')],
            ['sort_order', t('Sort order', 'ترتيب العرض')]
          ]}
          onDelete={(row) => action('deleteHomepage', {id: row.id})}
          onNew={() => setSectionForm({id: '', title_en: '', title_ar: '', source: '', is_visible: true, sort_order: '0'})}
          onSave={() => action('saveHomepage', sectionForm)}
          t={t}
        />
      ) : null}

      {activeTab === 'settings' ? (
        <SettingsSection form={settingsForm} setForm={setSettingsForm} onSave={() => action('saveSettings', settingsForm)} t={t} />
      ) : null}

      {activeTab === 'leads' ? (
        <RowsSection rows={data.leads} title={t('WhatsApp Leads', 'طلبات واتساب')} t={t} onDelete={(row) => action('deleteLead', {id: row.id})} />
      ) : null}

      {activeTab === 'media' ? (
        <section className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950 p-4">
          <h2 className="text-xl font-black">{t('Media Library', 'مكتبة الوسائط')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {data.products.flatMap((product) => imagesFromProduct(product)).map((url, index) => (
              <a className="overflow-hidden rounded-md border border-white/10 bg-black" href={url} key={`${url}-${index}`} target="_blank">
                <FallbackImage alt="" className="aspect-square w-full object-cover" src={url}>
                  <div className="grid aspect-square place-items-center p-2 text-center text-xs font-black text-red-200">{t('Image unavailable', 'الصورة لا تظهر')}</div>
                </FallbackImage>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <CrudSection
          form={employeeForm}
          rows={data.employees}
          setForm={setEmployeeForm}
          title={t('Users & Roles', 'المستخدمون والصلاحيات')}
          fields={[
            ['name', t('Name', 'الاسم')],
            ['email', t('Email', 'البريد')],
            ['role', t('Role', 'الصلاحية')]
          ]}
          onDelete={(row) => action('deleteEmployee', {id: row.id})}
          onNew={() => setEmployeeForm({id: '', name: '', email: '', role: 'staff', is_active: true})}
          onSave={() => action('saveEmployee', employeeForm)}
          t={t}
        />
      ) : null}

      {activeTab === 'activity' ? (
        <section className="rounded-lg border border-white/10 bg-zinc-950 p-4">
          <h2 className="text-xl font-black">{t('Activity Log', 'سجل النشاط')}</h2>
          <p className="mt-3 text-sm font-bold text-zinc-400">{t('Recent changes are reflected through Supabase timestamps on each record.', 'تظهر آخر التغييرات من خلال تواريخ سجلات Supabase.')}</p>
        </section>
      ) : null}
    </AdminShell>
  );
}

function CrudSection({
  title,
  form,
  setForm,
  fields,
  rows,
  onSave,
  onNew,
  onDelete,
  t
}: {
  title: string;
  form: Row;
  setForm: (row: Row) => void;
  fields: [string, string][];
  rows: Row[];
  onSave: () => Promise<boolean>;
  onNew: () => void;
  onDelete: (row: Row) => Promise<boolean>;
  t: (en: string, ar: string) => string;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
        <h2 className="text-xl font-black">{title}</h2>
        <div className="mt-4 grid gap-3">
          {fields.map(([field, label]) => (
            <label key={field}>
              <span className={labelClass()}>{label}</span>
              <input className={inputClass()} onChange={(event) => setForm({...form, [field]: event.target.value})} value={form[field] ?? ''} />
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={buttonClass('primary')} onClick={() => void onSave()} type="button">{t('Save', 'حفظ')}</button>
          <button className={buttonClass()} onClick={onNew} type="button">{t('New', 'جديد')}</button>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => (
          <article className="grid gap-3 rounded-lg border border-white/10 bg-zinc-950 p-4 md:grid-cols-[1fr_auto]" key={row.id}>
            <div className="min-w-0">
              <strong className="block truncate">{row.name_ar || row.title_ar || row.name || row.id}</strong>
              <p className="mt-1 truncate text-sm font-bold text-zinc-400">{row.name_en || row.title_en || row.email || '-'}</p>
              <p className="mt-1 text-xs font-bold text-zinc-500">#{row.id} · {row.slug || row.role || row.source || '-'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={buttonClass()} onClick={() => setForm(row)} type="button">{t('Edit', 'تعديل')}</button>
              <button className={buttonClass('danger')} onClick={() => window.confirm(t('Delete this row?', 'حذف هذا السجل؟')) && void onDelete(row)} type="button">{t('Delete', 'حذف')}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsSection({form, setForm, onSave, t}: {form: Row; setForm: (row: Row) => void; onSave: () => Promise<boolean>; t: (en: string, ar: string) => string}) {
  const fields: [string, string, 'input' | 'area'][] = [
    ['logoUrl', t('Logo', 'الشعار'), 'input'],
    ['bannerUrl', t('Banner', 'البنر'), 'input'],
    ['whatsapp', t('WhatsApp number', 'رقم واتساب'), 'input'],
    ['phoneSales', t('Sales phone', 'هاتف المبيعات'), 'input'],
    ['phoneRepairs', t('Repairs phone', 'هاتف الصيانة'), 'input'],
    ['instagram', 'Instagram', 'input'],
    ['benefitPayQr', t('BenefitPay QR', 'BenefitPay QR'), 'input'],
    ['iban', 'IBAN', 'input'],
    ['deliveryOptions', t('Delivery fee / options', 'رسوم / خيارات التوصيل'), 'area']
  ];
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-4">
      <h2 className="text-xl font-black">{t('Store Settings', 'إعدادات المتجر')}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map(([field, label, type]) => (
          <label key={field}>
            <span className={labelClass()}>{label}</span>
            {type === 'area'
              ? <textarea className={areaClass()} onChange={(event) => setForm({...form, [field]: event.target.value})} value={form[field] ?? ''} />
              : <input className={inputClass()} onChange={(event) => setForm({...form, [field]: event.target.value})} value={form[field] ?? ''} />}
          </label>
        ))}
      </div>
      <button className={`${buttonClass('primary')} mt-4`} onClick={() => void onSave()} type="button">{t('Save settings', 'حفظ الإعدادات')}</button>
    </section>
  );
}

function RowsSection({title, rows, onDelete, t}: {title: string; rows: Row[]; onDelete: (row: Row) => Promise<boolean>; t: (en: string, ar: string) => string}) {
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-black">{title}</h2>
      {rows.map((row) => (
        <article className="grid gap-3 rounded-lg border border-white/10 bg-zinc-950 p-4 md:grid-cols-[1fr_auto]" key={row.id}>
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs font-semibold text-zinc-300">{JSON.stringify(row, null, 2)}</pre>
          <button className={buttonClass('danger')} onClick={() => void onDelete(row)} type="button">{t('Delete', 'حذف')}</button>
        </article>
      ))}
    </section>
  );
}
