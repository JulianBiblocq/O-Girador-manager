import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import XiloAvatar from './XiloAvatar';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloSun, XiloMoon } from './XiloIcons';

export default function UserProfile({ user, profileData, onBack }) {
  const [formData, setFormData] = useState({
    prenom: profileData?.prenom || '',
    nom: profileData?.nom || '',
    instrument: profileData?.instrument || 'Autre'
  });
  
  const [saving, setSaving] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        prenom: formData.prenom,
        nom: formData.nom,
        instrument: formData.instrument
      });
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("UserProfile - Erreur lors de la sauvegarde :", error);
      alert("Erreur lors de l'enregistrement de vos modifications.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("UserProfile - Erreur déconnexion :", error);
    }
  };

  const fullName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`;

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ⬅️ Retour
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          Mon Profil
        </span>
        <button 
          type="button"
          onClick={toggleDarkMode}
          className="theme-btn px-2.5 py-1 text-xs font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer flex items-center justify-center min-w-8 min-h-7"
          title={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
        >
          {darkMode ? <XiloSun size={14} /> : <XiloMoon size={14} />}
        </button>
      </div>

      {/* Avatar Container in Center */}
      <div className="flex flex-col items-center gap-2 py-4 select-none">
        <div className="relative">
          <XiloAvatar src={user.photoURL} name={fullName} size={110} />
          {/* Decorative stamp on avatar */}
          <div className="absolute -bottom-1 -right-2 z-20">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-12">
              {profileData?.role || 'membre'}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold tracking-widest text-cordel-master-dark opacity-60 mt-1 break-all px-4 text-center">
          {user.email}
        </span>
      </div>

      {/* Profile Modification Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/10 pb-1">
            Informations personnelles
          </h4>

          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Prénom de l'adhérent
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder="Entrez votre prénom (ex : Manoel)"
              className="theme-input w-full disabled:opacity-50 text-xs font-bold"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Nom de famille
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder="Entrez votre nom de famille (ex : Silva)"
              className="theme-input w-full disabled:opacity-50 text-xs font-bold"
            />
          </div>

          {/* Instrument Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Instrument Principal pratiqué
            </label>
            <select
              name="instrument"
              value={formData.instrument}
              onChange={handleChange}
              required
              disabled={saving}
              className="theme-input w-full disabled:opacity-50 text-xs font-bold"
            >
              <option value="Alfaia">Alfaia (Tambour)</option>
              <option value="Caixa">Caixa (Caisse claire)</option>
              <option value="Gonguê">Gonguê (Cloche)</option>
              <option value="Agbê">Agbê (Shekere)</option>
              <option value="Mineiro">Mineiro (Secoueur)</option>
              <option value="Danse">Danse / Chœur</option>
              <option value="Autre">Autre / Non spécifié</option>
            </select>
          </div>
        </CordelCard>

        {/* Validation Button */}
        <CordelButton 
          type="submit"
          variant="ocre" 
          useExtremeBorder={true}
          disabled={saving}
          className="w-full py-3"
        >
          {saving ? "Enregistrement en cours..." : "Enregistrer mes modifications"}
        </CordelButton>
      </form>

      {/* Disconnect Button (Red / Swappable theme color using var(--cordel-wood)) */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col items-center">
        <CordelButton 
          type="button"
          variant="default"
          onClick={handleDisconnect}
          useExtremeBorder={true}
          className="w-full py-3 !bg-cordel-wood !text-cordel-bg-light border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
        >
          🚪 Se déconnecter
        </CordelButton>
      </div>
    </div>
  );
}
