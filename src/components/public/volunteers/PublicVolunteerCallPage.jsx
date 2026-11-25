import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import PublicThemeProvider, { usePublicThemeContext } from '../../PublicThemeProvider';
import { useTranslation } from '../../LanguageContext';
import { isDemoMode } from '../../../demo/demoManager';
import { canonicalizeGroupId, isCustomDomainHost } from '../../../utils/tenantUtils';
import { buildOrganizadorMemberUrl } from '../../../utils/vitrineLockUtils';
import { normalizePublicVolunteerConfig, normalizeVolunteerApplication } from '../../../utils/volunteerApplicationUtils';
import { computePublicAnonymousShifts, validatePublicVolunteerSubmission } from '../../../utils/publicVolunteerUtils';
import PublicVolunteerStatusScreen from './PublicVolunteerStatusScreen';
import PublicVolunteerShiftsSelector from './PublicVolunteerShiftsSelector';
import PublicVolunteerFormFields from './PublicVolunteerFormFields';

function PublicVolunteerCallContent({ event, loadingEvent, effectiveGroupId, user, navigateToRoute }) {
  const { publicTheme } = usePublicThemeContext();
  const { t } = useTranslation();
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState(null);
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', telephone: '', lienAsso: '', isFlexible: false,
    disponibilitesNote: '', regimeAlimentaire: '', tailleTshirt: '', hasVehicle: false, vehicleDetails: '', isAdult: null, rgpdConsent: false
  });

  const anonymousShifts = useMemo(() => (event ? computePublicAnonymousShifts(event) : []), [event]);
  const cfg = useMemo(() => normalizePublicVolunteerConfig(event?.publicVolunteerConfig, t('agenda.volunteerPublicWelcomeDefault')), [event, t]);

  const handleBackToVitrine = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : '', isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isDemoMode()) { window.location.href = '/demo?app=mostrador'; return; }
    if (isCustomDomainHost(host)) { window.location.href = '/'; return; }
    window.location.href = isLocal ? `/?app=mostrador${effectiveGroupId ? `&groupe=${encodeURIComponent(effectiveGroupId)}` : ''}` : `/${encodeURIComponent(effectiveGroupId || '')}`;
  };

  const handleOpenMemberSpace = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : '', isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal && user && navigateToRoute) { navigateToRoute('/app'); return; }
    window.location.href = buildOrganizadorMemberUrl(effectiveGroupId, { isLocal, isDemo: isDemoMode(), eventId: event?.id || '' });
  };

  if (loadingEvent) return <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--public-bg,#F4ECD8)] text-[var(--public-primary,#8B2A1A)] font-bold text-xs uppercase tracking-widest">⏳ {t('agenda.volunteerPublicLoading') || "Chargement de l'appel à bénévoles..."}</div>;
  if (!event || !cfg.enabled) return <PublicVolunteerStatusScreen mode="closed" eventTitle={event?.titre || ''} onBackToVitrine={handleBackToVitrine} />;
  if (submittedSummary) return <PublicVolunteerStatusScreen mode="confirmed" eventTitle={event.titre} summary={submittedSummary} onBackToVitrine={handleBackToVitrine} />;

  const eventDateJour = /^\d{4}-\d{2}-\d{2}/.test(String(event.date || '')) ? String(event.date).slice(0, 10) : '';
  const formattedDate = event.date && !isNaN(new Date(event.date).getTime()) ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : (event.date || '');
  const validation = validatePublicVolunteerSubmission({ ...form, requestedShiftIds: selectedShiftIds }, { honeypot });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot.trim()) return;
    if (!validation.valid || submitting || !effectiveGroupId || !event?.id) return;
    setSubmitting(true);
    try {
      const payload = normalizeVolunteerApplication({
        ...form, groupId: effectiveGroupId, eventId: event.id, status: 'pending', source: 'public_form', requestedShiftIds: selectedShiftIds
      }, { groupId: effectiveGroupId, eventId: event.id });
      await addDoc(collection(db, 'volunteer_applications'), payload);
      const shiftLabels = selectedShiftIds.map((id) => anonymousShifts.find((s) => s.id === id)?.nomTache || id);
      setSubmittedSummary({ prenom: payload.prenom, nom: payload.nom, isFlexible: payload.isFlexible, disponibilitesNote: payload.disponibilitesNote, shiftLabels });
    } catch (err) { console.error('Erreur envoi proposition bénévole :', err); }
    finally { setSubmitting(false); }
  };

  const logoSrc = publicTheme?.logoUrl || '';
  const assoName = publicTheme?.associationName || '';
  const coverImg = event.imageUrl || event.coverImage || '';

  return (
    <div className="min-h-screen w-full bg-[var(--public-bg,#F4ECD8)] text-[var(--public-text,#181716)] py-6 sm:py-10 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-5 text-left">
        <button type="button" onClick={handleOpenMemberSpace} className="w-full px-4 py-2.5 rounded-xl bg-white/85 border border-stone-300 text-xs font-bold text-stone-700 hover:bg-white transition-colors text-center cursor-pointer shadow-2xs">
          🔑 {t('agenda.volunteerPublicAlreadyMemberBanner') || "Déjà membre de l'association ? Inscris-toi directement en 1 clic depuis ton espace membre →"}
        </button>

        <header className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {coverImg && <img src={coverImg} alt={event.titre} className="w-full h-44 sm:h-56 object-cover bg-stone-100" />}
          <div className="p-5 sm:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {logoSrc && <img src={logoSrc} alt={assoName} className="w-11 h-11 rounded-full object-contain border border-stone-200 bg-stone-50 p-0.5 shrink-0" />}
              <div className="min-w-0">
                {assoName && <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--public-secondary,#2D6A4F)] block">{assoName}</span>}
                <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--public-primary,#8B2A1A)] leading-tight [font-family:var(--public-font-heading,sans-serif)]">{event.titre}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-stone-600">
              {formattedDate && <span className="capitalize">📅 {formattedDate}</span>}
              {event.lieu && <span>📍 {event.lieu}</span>}
            </div>
            {cfg.welcomeMessage && <p className="text-sm text-stone-700 bg-stone-50 border-l-4 border-[var(--public-secondary,#2D6A4F)] px-3.5 py-2.5 rounded-r-lg whitespace-pre-line">{cfg.welcomeMessage}</p>}
          </div>
        </header>

        <PublicVolunteerShiftsSelector
          shifts={anonymousShifts} eventDateJour={eventDateJour} selectedShiftIds={selectedShiftIds}
          onToggleShift={(id) => setSelectedShiftIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          isFlexible={form.isFlexible} onChangeFlexible={(val) => setForm((p) => ({ ...p, isFlexible: val }))}
          disponibilitesNote={form.disponibilitesNote} onChangeNote={(val) => setForm((p) => ({ ...p, disponibilitesNote: val }))}
          disabled={submitting}
        />

        <PublicVolunteerFormFields config={cfg} form={form} onChangeForm={setForm} honeypot={honeypot} onChangeHoneypot={setHoneypot} isValid={validation.valid} submitting={submitting} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

export default function PublicVolunteerCallPage({ eventId, initialGroupId = null, user = null, navigateToRoute }) {
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    const eid = String(eventId || '').trim();
    if (!eid) { setEvent(null); setLoadingEvent(false); return; }
    setLoadingEvent(true);
    const unsub = onSnapshot(doc(db, 'events', eid), (snap) => {
      setEvent(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoadingEvent(false);
    }, () => { setEvent(null); setLoadingEvent(false); });
    return () => unsub();
  }, [eventId]);

  const effectiveGroupId = canonicalizeGroupId(initialGroupId || event?.groupId || '') || '';

  return (
    <PublicThemeProvider groupId={effectiveGroupId}>
      <PublicVolunteerCallContent event={event} loadingEvent={loadingEvent} effectiveGroupId={effectiveGroupId} user={user} navigateToRoute={navigateToRoute} />
    </PublicThemeProvider>
  );
}
