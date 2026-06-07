import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Database, Download, Smartphone, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { db } from '../../db/database';
import { exportBackup, importBackup, type CadenceBackup } from '../../db/repository';
import { GhostButton, PrimaryButton } from '../../components/FormControls';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

type Status = { kind: 'idle' } | { kind: 'success'; message: string } | { kind: 'error'; message: string } | { kind: 'info'; message: string };

const MANUAL_INSTALL_MESSAGE =
  "Ton navigateur ne propose pas l’installation directe pour l’instant : ouvre son menu (⋮ ou icône de partage) puis choisis « Ajouter à l’écran d’accueil » ou « Installer l’application ».";

export function SettingsPage() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [confirmingReset, setConfirmingReset] = useState(false);
  const install = useInstallPrompt();

  async function handleInstall() {
    if (!install.canPrompt) {
      setStatus({ kind: 'info', message: MANUAL_INSTALL_MESSAGE });
      return;
    }
    const accepted = await install.promptInstall();
    setStatus(
      accepted
        ? { kind: 'success', message: 'Installation lancée — Cadence va apparaître sur ton écran d’accueil.' }
        : { kind: 'info', message: 'Installation annulée. Tu pourras relancer l’opération quand tu le souhaites.' },
    );
  }
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `cadence-sauvegarde-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ kind: 'success', message: 'Sauvegarde téléchargée. Garde ce fichier en lieu sûr.' });
    } catch {
      setStatus({ kind: 'error', message: "Impossible d'exporter les données." });
    }
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as CadenceBackup;
      if (
        !parsed ||
        (parsed.version !== 1 && parsed.version !== 2) ||
        !Array.isArray(parsed.tasks) ||
        !Array.isArray(parsed.routines) ||
        (parsed.version === 2 && !Array.isArray(parsed.projects))
      ) {
        throw new Error('format invalide');
      }
      await importBackup(parsed);
      setStatus({ kind: 'success', message: 'Données restaurées avec succès depuis la sauvegarde.' });
    } catch {
      setStatus({ kind: 'error', message: "Ce fichier ne semble pas être une sauvegarde Cadence valide." });
    }
  }

  async function handleReset() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 3000);
      return;
    }
    await db.transaction('rw', db.tasks, db.routines, db.categories, db.projects, async () => {
      await Promise.all([db.tasks.clear(), db.routines.clear(), db.categories.clear(), db.projects.clear()]);
    });
    setConfirmingReset(false);
    setStatus({ kind: 'success', message: 'Toutes les données ont été supprimées.' });
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="pt-2">
        <p className="text-sm text-base-300">Configuration</p>
        <h1 className="text-xl font-semibold tracking-tight">Réglages</h1>
      </header>

      {!install.installed && (
        <section className="flex flex-col gap-3 rounded-2xl border border-accent-violet/30 bg-accent-violet/[0.06] p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-violet/15 text-accent-violet-soft">
              <Smartphone className="size-4.5" />
            </span>
            <div>
              <h2 className="text-[15px] font-medium">Installer l’application</h2>
              <p className="mt-1 text-sm text-base-300">
                Ajoute Cadence à ton écran d’accueil pour l’ouvrir comme une application, en plein écran et hors-ligne.
              </p>
            </div>
          </div>
          <PrimaryButton type="button" onClick={() => void handleInstall()} className="self-start">
            <Smartphone className="size-4" /> Installer Cadence
          </PrimaryButton>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-base-700/60 bg-base-800/60 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-mint/15 text-accent-mint">
            <ShieldCheck className="size-4.5" />
          </span>
          <div>
            <h2 className="text-[15px] font-medium">Tes données restent sur ton téléphone</h2>
            <p className="mt-1 text-sm text-base-300">
              Cadence ne possède aucun serveur : toutes tes tâches et routines sont stockées localement
              (IndexedDB) sur cet appareil, et fonctionnent hors-ligne. Pense à exporter une sauvegarde
              régulièrement, notamment avant un changement de téléphone.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-base-700/60 bg-base-800/60 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-violet/15 text-accent-violet-soft">
            <Database className="size-4.5" />
          </span>
          <div>
            <h2 className="text-[15px] font-medium">Sauvegarde locale</h2>
            <p className="text-sm text-base-300">Exporte ou restaure tes données au format JSON.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={() => void handleExport()}>
            <Download className="size-4" /> Exporter mes données
          </PrimaryButton>
          <GhostButton type="button" onClick={triggerImport}>
            <Upload className="size-4" /> Restaurer une sauvegarde
          </GhostButton>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => void handleImportFile(e)} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-accent-coral/30 bg-accent-coral/5 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-coral/15 text-accent-coral">
            <Trash2 className="size-4.5" />
          </span>
          <div>
            <h2 className="text-[15px] font-medium">Zone de danger</h2>
            <p className="text-sm text-base-300">Supprime définitivement toutes les tâches, routines, projets et catégories.</p>
          </div>
        </div>
        <GhostButton
          type="button"
          onClick={() => void handleReset()}
          className={confirmingReset ? '!border-accent-coral !text-accent-coral' : ''}
        >
          {confirmingReset ? 'Confirmer la suppression définitive ?' : 'Réinitialiser l’application'}
        </GhostButton>
      </section>

      {status.kind !== 'idle' && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx('rounded-xl border px-4 py-3 text-sm', {
            'border-accent-mint/30 bg-accent-mint/10 text-accent-mint': status.kind === 'success',
            'border-accent-coral/30 bg-accent-coral/10 text-accent-coral': status.kind === 'error',
            'border-accent-violet/30 bg-accent-violet/10 text-accent-violet-soft': status.kind === 'info',
          })}
        >
          {status.message}
        </motion.p>
      )}

      <p className="text-center text-xs text-base-500">Cadence — installé en PWA, fonctionne entièrement hors-ligne.</p>
    </div>
  );
}
