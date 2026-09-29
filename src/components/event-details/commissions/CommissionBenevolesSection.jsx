import React, { useState } from 'react';

/**
 * Sous-composant du tiroir "Bénévoles Jour J"
 * Gestion des créneaux horaires et rôles pour l'événement.
 */
export default function CommissionBenevolesSection({
  creneaux = [],
  onChangeCreneaux,
  usersMap = {}
}) {
  const [role, setRole] = useState('');
  const [horaireDebut, setHoraireDebut] = useState('');
  const [horaireFin, setHoraireFin] = useState('');
  const [nbPlaces, setNbPlaces] = useState(2);

  const handleAddCreneau = (e) => {
    e.preventDefault();
    if (!role.trim()) return;

    const newCreneau = {
      id: `creneau_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: role.trim(),
      horaireDebut: horaireDebut || '',
      horaireFin: horaireFin || '',
      nbPlaces: Number(nbPlaces) || 1,
      inscrits: []
    };

    onChangeCreneaux([...creneaux, newCreneau]);
    setRole('');
    setHoraireDebut('');
    setHoraireFin('');
    setNbPlaces(2);
  };

  const handleDeleteCreneau = (creneauId) => {
    onChangeCreneaux(creneaux.filter((c) => c.id !== creneauId));
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-cordel-bg/50 rounded-lg border border-encre-noire/20 text-xs">
      <div className="flex items-center justify-between">
        <h4 className="font-black uppercase text-encre-noire flex items-center gap-1.5">
          <span>🤝</span> Bénévoles Jour J ({creneaux.length} créneau{creneaux.length > 1 ? 'x' : ''})
        </h4>
      </div>

      {/* Liste des créneaux */}
      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
        {creneaux.length === 0 ? (
          <p className="text-[11px] text-stone-500 italic p-2 text-center">
            Aucun créneau de bénévolat créé.
          </p>
        ) : (
          creneaux.map((c) => {
            const placesRestantes = Math.max(0, (c.nbPlaces || 1) - (c.inscrits?.length || 0));
            return (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded border border-encre-noire/20 bg-white"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-encre-noire">{c.role}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-300">
                      {c.horaireDebut && c.horaireFin ? `${c.horaireDebut} - ${c.horaireFin}` : 'Horaire libre'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5">
                    <span>
                      👥 {c.inscrits?.length || 0} / {c.nbPlaces} inscrit(s)
                    </span>
                    {placesRestantes === 0 && (
                      <span className="font-bold text-[var(--color-cordel-vert)]">
                        (Complet)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCreneau(c.id)}
                  className="text-stone-400 hover:text-[var(--color-cordel-rouge)] p-1 text-xs"
                  title="Supprimer ce créneau"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Ajout d'un créneau */}
      <form onSubmit={handleAddCreneau} className="flex flex-wrap items-center gap-2 pt-2 border-t border-encre-noire/10">
        <input
          type="text"
          placeholder="Rôle (ex: Buvette, Accueil, Montage)..."
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="flex-1 min-w-[140px] px-2 py-1.5 rounded border border-encre-noire/30 bg-white text-xs"
        />
        <div className="flex items-center gap-1">
          <input
            type="time"
            value={horaireDebut}
            onChange={(e) => setHoraireDebut(e.target.value)}
            className="px-1 py-1 rounded border border-encre-noire/30 bg-white text-xs"
          />
          <span className="text-stone-400">à</span>
          <input
            type="time"
            value={horaireFin}
            onChange={(e) => setHoraireFin(e.target.value)}
            className="px-1 py-1 rounded border border-encre-noire/30 bg-white text-xs"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-stone-500 font-bold">Places :</label>
          <input
            type="number"
            min="1"
            max="30"
            value={nbPlaces}
            onChange={(e) => setNbPlaces(e.target.value)}
            className="w-14 px-1 py-1 rounded border border-encre-noire/30 bg-white text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={!role.trim()}
          className="px-3 py-1.5 font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40"
        >
          + Créneau
        </button>
      </form>
    </div>
  );
}
