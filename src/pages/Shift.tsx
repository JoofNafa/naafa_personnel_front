import { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';
import LoadingOverlay from '../common/LoadingOverlay';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { managerAPI } from '../services/api/AppApi';

interface Shift {
  id: number;
  name: string;
  label: string;
  type: 'morning' | 'evening';
  start_time: string;
  end_time: string;
  created_at: string | null;
  updated_at: string | null;
}

export const Shift = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // États du modal (ajout ou édition)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // États pour la suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<'morning' | 'evening'>('morning');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        const response = await managerAPI.getShift();

        if (response.data?.success && Array.isArray(response.data.shifts)) {
          setShifts(response.data.shifts);
        } else {
          setShifts([]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des horaires');
        toast.error('Impossible de charger les horaires');
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  const getTypeLabel = (type: string) => {
    return type === 'morning' ? 'Matin' : 'Soir';
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // "08:00:00" → "08:00"
  };

  const generateName = (start: string, end: string) => {
    const startH = start.slice(0, 5).replace(':', 'H');
    const endH = end.slice(0, 5).replace(':', 'H');
    return `${startH} - ${endH}`;
  };

  // Ouvrir modal ajout
  const openAddModal = () => {
    setStartTime('');
    setEndTime('');
    setType('morning');
    setFormError(null);
    setSuccessMessage(null);
    setEditingShift(null);
    setShowAddModal(true);
    setShowEditModal(false);
  };

  // Ouvrir modal édition
  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setStartTime(shift.start_time.slice(0, 5));
    setEndTime(shift.end_time.slice(0, 5));
    setType(shift.type);
    setFormError(null);
    setSuccessMessage(null);
    setShowEditModal(true);
    setShowAddModal(false);
  };

  // Fermer les modals ajout/édition
  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingShift(null);
  };

  // Fonctions pour la suppression
  const openDeleteModal = (shift: Shift) => {
    setShiftToDelete(shift);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setShiftToDelete(null);
  };

  const confirmDelete = async () => {
    if (!shiftToDelete) return;

    setDeleting(true);
    try {
      await managerAPI.deleteShift(shiftToDelete.id);

      toast.success(`Horaire "${shiftToDelete.name}" supprimé avec succès !`);
      closeDeleteModal();

      // Recharger la liste
      const response = await managerAPI.getShift();
      if (response.data?.success && Array.isArray(response.data.shifts)) {
        setShifts(response.data.shifts);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!startTime || !endTime) {
      setFormError('Veuillez sélectionner une heure de début et une heure de fin');
      return;
    }

    // if (endTime <= startTime) {
    //   setFormError('L\'heure de fin doit être supérieure à l\'heure de début');
    //   return;
    // }

    const name = generateName(startTime, endTime);
    const label = `Horaire ${startTime} - ${endTime}`;

    setSaving(true);

    try {
      if (editingShift) {
        await managerAPI.updateShift(editingShift.id, {
          name,
          label,
          type,
          start_time: startTime,
          end_time: endTime,
        });

        setSuccessMessage(`Horaire "${name}" mis à jour avec succès !`);
        toast.success('Horaire modifié !');
        closeModal();
      } else {
        // Mode ajout
        await managerAPI.newShift({
          name,
          label,
          type,
          start_time: startTime,
          end_time: endTime,
        });

        setSuccessMessage(`Horaire "${name}" ajouté avec succès !`);
        toast.success('Nouvel horaire créé !');
        setTimeout(() => closeModal(), 1500);
      }

      // Recharger la liste
      const response = await managerAPI.getShift();
      if (response.data?.success && Array.isArray(response.data.shifts)) {
        setShifts(response.data.shifts);
      }
    } catch (err: any) {
      const errors = err.response?.data?.errors || {};
      let message = 'Erreur lors de la sauvegarde de l\'horaire';

      if (errors.start_time) message = errors.start_time[0];
      else if (errors.end_time) message = errors.end_time[0];
      else if (err.response?.data?.message) message = err.response.data.message;

      setFormError(message);
      toast.error('Échec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <LoadingOverlay loading={loading || saving || deleting} />
      <ToastContainer />

      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des horaires</h1>
              <p className="text-gray-600">Organiser les horaires de travail</p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            Ajouter un horaire
          </button>
        </div>

        {/* Tableau des shifts */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Liste des horaires définis</h2>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun horaire défini pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Libellé
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Heure de début
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Heure de fin
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-5">
                        <span className="font-semibold text-gray-900">{shift.name}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            shift.type === 'morning'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {getTypeLabel(shift.type)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{formatTime(shift.start_time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{formatTime(shift.end_time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => openEditModal(shift)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier l'horaire"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(shift)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer l'horaire"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal unique : Ajout ou Édition */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingShift ? 'Modifier l\'horaire' : 'Ajouter un nouvel horaire'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Heure de début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* Heure de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'morning' | 'evening')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                >
                  <option value="morning">Matin</option>
                  <option value="evening">Soir</option>
                </select>
              </div>

              {/* Aperçu du nom généré */}
              {startTime && endTime && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-700">
                    <strong>Horaire :</strong> {generateName(startTime, endTime)}
                  </p>
                </div>
              )}

              {/* Messages */}
              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !startTime || !endTime}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Enregistrement...
                    </>
                  ) : editingShift ? (
                    'Mettre à jour'
                  ) : (
                    'Créer l\'horaire'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && shiftToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>

            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer l'horaire{' '}
              <strong>{shiftToDelete.name}</strong> ?<br />
              ({getTypeLabel(shiftToDelete.type)} : {formatTime(shiftToDelete.start_time)} - {formatTime(shiftToDelete.end_time)})
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};