import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import { isToRelance } from '../../utils/diffusionUtils.js';

export { isToRelance };

/**
 * Composant de gestion du Carnet de Contacts (CRM Global) du Pôle Diffusion.
 */
export default function DiffusionContactsManager({ groupId, associationSettings = {} }) {
  const { confirm } = useConfirm();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nom_structure: '',
    nom_contact: '',
    email: '',
    telephone: '',
    type: 'Festival',
    notes: '',
    date_dernier_contact: '',
    date_prochaine_relance: ''
  });

  // Écoute en temps réel de la collection contacts_diffusion
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);

    const contactsRef = collection(db, 'associations', groupId, 'contacts_diffusion');
    const q = query(contactsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(contactsRef, (snapshot) => {
      const docs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setContacts(docs);
      setLoading(false);
    }, (err) => {
      console.error("DiffusionContactsManager - Erreur écoute contacts :", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Ouverture du formulaire de création / édition
  const handleOpenCreate = () => {
    setEditingContact(null);
    setForm({
      nom_structure: '',
      nom_contact: '',
      email: '',
      telephone: '',
      type: 'Festival',
      notes: '',
      date_dernier_contact: new Date().toISOString().split('T')[0],
      date_prochaine_relance: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setForm({
      nom_structure: contact.nom_structure || '',
      nom_contact: contact.nom_contact || '',
      email: contact.email || '',
      telephone: contact.telephone || '',
      type: contact.type || 'Festival',
      notes: contact.notes || '',
      date_dernier_contact: contact.date_dernier_contact || '',
      date_prochaine_relance: contact.date_prochaine_relance || ''
    });
    setIsModalOpen(true);
  };

  // Enregistrement dans Firestore
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.nom_structure.trim() && !form.nom_contact.trim()) {
      alert("Veuillez saisir au moins le nom de la structure ou du contact.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nom_structure: form.nom_structure.trim(),
        nom_contact: form.nom_contact.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        type: form.type,
        notes: form.notes.trim(),
        date_dernier_contact: form.date_dernier_contact,
        date_prochaine_relance: form.date_prochaine_relance,
        updatedAt: serverTimestamp()
      };

      if (editingContact) {
        const contactRef = doc(db, 'associations', groupId, 'contacts_diffusion', editingContact.id);
        await updateDoc(contactRef, payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'associations', groupId, 'contacts_diffusion'), payload);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("DiffusionContactsManager - Erreur de sauvegarde :", err);
      alert("Erreur lors de la sauvegarde du contact : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Suppression
  const handleDelete = async (contactId) => {
    const isOk = await confirm("Êtes-vous sûr de vouloir supprimer définitivement ce contact du carnet ?");
    if (!isOk) return;
    try {
      await deleteDoc(doc(db, 'associations', groupId, 'contacts_diffusion', contactId));
    } catch (err) {
      console.error("Erreur suppression contact :", err);
      alert("Erreur de suppression : " + err.message);
    }
  };

  // Filtrage des contacts
  const filteredContacts = contacts.filter(c => {
    const matchesSearch =
      (c.nom_structure || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nom_contact || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.telephone || '').includes(searchQuery);

    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* Barre d'outils et de recherche */}
      <div data-tour="contacts-filter-bar" className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-lg border border-stone-200">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Rechercher une structure, un nom, un email..."
            className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white w-full sm:w-64"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white"
          >
            <option value="all">Tous les types</option>
            <option value="Festival">Festival</option>
            <option value="Carnaval">Carnaval / Parade</option>
            <option value="Mairie">Mairie / Collectivité</option>
            <option value="Salle">Salle de spectacle</option>
            <option value="Prive">Événement privé</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <CordelButton
          type="button"
          variant="vert"
          data-tour="contacts-add-button"
          onClick={handleOpenCreate}
          className="text-xs font-extrabold flex items-center gap-1.5"
        >
          <span>➕ Ajouter un contact</span>
        </CordelButton>
      </div>

      {/* Tableau interactif des contacts CRM */}
      {loading ? (
        <div className="py-12 text-center text-xs uppercase font-bold tracking-widest text-stone-400 animate-pulse">
          ⏳ Chargement du carnet de contacts...
        </div>
      ) : filteredContacts.length > 0 ? (
        <div data-tour="contacts-table" className="overflow-x-auto bg-white rounded-lg border border-stone-200 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-[10px] font-extrabold uppercase text-cordel-wood">
                <th className="p-3">Structure & Contact</th>
                <th className="p-3">Type</th>
                <th className="p-3">Coordonnées</th>
                <th className="p-3">Dernier Contact</th>
                <th className="p-3">Prochaine Relance</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredContacts.map((contact) => {
                const needsRelance = isToRelance(contact.date_prochaine_relance);

                return (
                  <tr key={contact.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-stone-950">
                          {contact.nom_structure || 'Sans nom de structure'}
                        </span>
                        {contact.nom_contact && (
                          <span className="text-[11px] font-medium text-stone-600">
                            👤 {contact.nom_contact}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-stone-100 text-stone-700 border border-stone-200">
                        {contact.type || 'Général'}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                        {contact.email && <span className="text-stone-800">✉️ {contact.email}</span>}
                        {contact.telephone && <span className="text-stone-600">📞 {contact.telephone}</span>}
                      </div>
                    </td>

                    <td className="p-3 font-semibold text-stone-700">
                      {contact.date_dernier_contact || 'Non renseigné'}
                    </td>

                    <td className="p-3">
                      {contact.date_prochaine_relance ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{contact.date_prochaine_relance}</span>
                          {needsRelance && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 text-amber-950 border border-amber-400 animate-pulse">
                              ⏰ À relancer
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Aucune</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(contact)}
                          className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 cursor-pointer"
                        >
                          ✏️ Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(contact.id)}
                          className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div data-tour="contacts-table" className="py-12 px-6 rounded-lg border border-dashed border-stone-300 bg-white text-center flex flex-col items-center gap-3">
          <span className="text-3xl">📇</span>
          <p className="text-xs font-bold text-stone-700">
            Aucun contact trouvé dans le carnet de prospection.
          </p>
          <CordelButton type="button" variant="vert" onClick={handleOpenCreate} className="text-xs">
            + Ajouter le premier contact
          </CordelButton>
        </div>
      )}

      {/* Modale de Création / Édition Contact */}
      {isModalOpen && (
        <div
          tabIndex={-1}
          onKeyDown={(e) => e.key === 'Escape' && !saving && setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
        >
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
            {/* 1. Header (Fixe) */}
            <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between bg-white">
              <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
                {editingContact ? '✏️ Modifier le Contact' : '➕ Nouveau Contact Prospection'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="text-stone-400 hover:text-stone-800 text-lg font-bold cursor-pointer"
                title="Fermer (Échap)"
              >
                ✕
              </button>
            </div>

            {/* Form Wrapper */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. Body (Défilable verticalement) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-700">Nom Structure *</label>
                    <input
                      type="text"
                      required
                      value={form.nom_structure}
                      onChange={(e) => setForm(prev => ({ ...prev, nom_structure: e.target.value }))}
                      placeholder="ex: Mairie de Brest"
                      className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-700">Nom du Contact</label>
                    <input
                      type="text"
                      value={form.nom_contact}
                      onChange={(e) => setForm(prev => ({ ...prev, nom_contact: e.target.value }))}
                      placeholder="ex: Jean Dupont"
                      className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-700">E-mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@mairie.fr"
                      className="text-xs font-mono font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-700">Téléphone</label>
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => setForm(prev => ({ ...prev, telephone: e.target.value }))}
                      placeholder="02 98 00 00 00"
                      className="text-xs font-mono font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-700">Type de Structure</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                  >
                    <option value="Festival">Festival</option>
                    <option value="Carnaval">Carnaval / Parade</option>
                    <option value="Mairie">Mairie / Collectivité</option>
                    <option value="Salle">Salle de spectacle</option>
                    <option value="Prive">Événement privé</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-700">Date Dernier Contact</label>
                    <input
                      type="date"
                      value={form.date_dernier_contact}
                      onChange={(e) => setForm(prev => ({ ...prev, date_dernier_contact: e.target.value }))}
                      className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-700">Date Prochaine Relance</label>
                    <input
                      type="date"
                      value={form.date_prochaine_relance}
                      onChange={(e) => setForm(prev => ({ ...prev, date_prochaine_relance: e.target.value }))}
                      className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-700">Notes & Historique</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Compte-rendu d'échange, préférences d'horaires..."
                    className="text-xs p-2.5 border border-stone-300 rounded bg-white font-sans resize-none"
                  />
                </div>
              </div>

              {/* 3. Footer (Fixe en bas) */}
              <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 flex items-center justify-end gap-2 bg-stone-50">
                <CordelButton type="button" variant="default" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Annuler
                </CordelButton>
                <CordelButton type="submit" variant="vert" disabled={saving} className="text-xs font-extrabold">
                  {saving ? 'Sauvegarde...' : '✓ Valider le contact'}
                </CordelButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
