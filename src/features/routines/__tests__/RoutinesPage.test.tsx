import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RoutinesPage } from '../RoutinesPage';
import { db, seedDefaultCategories } from '../../../db/database';
import { resetDatabase } from '../../../test/testDb';

beforeEach(async () => {
  await resetDatabase();
  await seedDefaultCategories(db);
});

afterEach(async () => {
  await resetDatabase();
});

function renderRoutines() {
  return render(
    <MemoryRouter>
      <RoutinesPage />
    </MemoryRouter>,
  );
}

describe('RoutinesPage', () => {
  it('affiche un état vide puis permet de créer une routine', async () => {
    const user = userEvent.setup();
    renderRoutines();

    expect(await screen.findByText(/Aucune routine pour l’instant/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Créer ma première routine/i }));

    const dialog = await screen.findByRole('dialog', { name: /Nouvelle routine/i });
    await user.type(within(dialog).getByLabelText(/Titre/i), 'Étirements du matin');
    await user.click(within(dialog).getByRole('button', { name: 'Lundi' }));
    await user.click(within(dialog).getByRole('button', { name: 'Jeudi' }));
    await user.click(within(dialog).getByRole('button', { name: /^Créer$/i }));

    await waitFor(() => expect(screen.getByText('Étirements du matin')).toBeInTheDocument());
    expect(screen.queryByText(/Aucune routine pour l’instant/i)).not.toBeInTheDocument();
  });

  it('affiche une erreur si on valide sans sélectionner de jour', async () => {
    const user = userEvent.setup();
    renderRoutines();

    await user.click(await screen.findByRole('button', { name: /Nouvelle routine/i }));
    const dialog = await screen.findByRole('dialog', { name: /Nouvelle routine/i });
    await user.type(within(dialog).getByLabelText(/Titre/i), 'Routine sans jour');
    await user.click(within(dialog).getByRole('button', { name: /^Créer$/i }));

    expect(await within(dialog).findByText(/Choisis au moins un jour/i)).toBeInTheDocument();
  });

  it('permet d’activer / désactiver une routine via l’interrupteur', async () => {
    const user = userEvent.setup();
    renderRoutines();
    await user.click(await screen.findByRole('button', { name: /Nouvelle routine/i }));
    const dialog = await screen.findByRole('dialog', { name: /Nouvelle routine/i });
    await user.type(within(dialog).getByLabelText(/Titre/i), 'Lecture du soir');
    await user.click(within(dialog).getByRole('button', { name: 'Mardi' }));
    await user.click(within(dialog).getByRole('button', { name: /^Créer$/i }));

    await screen.findByText('Lecture du soir');
    const toggle = screen.getByRole('switch', { name: /Désactiver Lecture du soir/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    await waitFor(() => expect(screen.getByRole('switch', { name: /Activer Lecture du soir/i })).toHaveAttribute('aria-checked', 'false'));
  });

  it('permet de supprimer une routine via la confirmation à double-tap', async () => {
    const user = userEvent.setup();
    renderRoutines();
    await user.click(await screen.findByRole('button', { name: /Nouvelle routine/i }));
    const dialog = await screen.findByRole('dialog', { name: /Nouvelle routine/i });
    await user.type(within(dialog).getByLabelText(/Titre/i), 'Routine éphémère');
    await user.click(within(dialog).getByRole('button', { name: 'Mercredi' }));
    await user.click(within(dialog).getByRole('button', { name: /^Créer$/i }));

    await screen.findByText('Routine éphémère');
    const deleteButton = screen.getByRole('button', { name: /Supprimer la routine "Routine éphémère"/i });
    await user.click(deleteButton);
    await user.click(screen.getByRole('button', { name: /Confirmer la suppression/i }));

    await waitFor(() => expect(screen.queryByText('Routine éphémère')).not.toBeInTheDocument());
  });
});
