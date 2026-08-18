import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function useMestreSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'mestre_signals'));
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setSignals(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des signaux du mestre :", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);

  return { signals, loading, error };
}
