import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TodayPage } from '../TodayPage';
import { db, seedDefaultCategories } from '../../../db/database';
import { createTask } from '../../../db/repository';
import { todayKey } from '../../../lib/date';
import { resetDatabase } from '../../../test/testDb';

beforeEach(async () => {
  await resetDatabase();
  await seedDefaultCategories(db);
});

afterEach(async () => {
  await resetDatabase();
});

function renderToday() {
  return render(
    <MemoryRouter>
      <TodayPage />
    </MemoryRouter>,
  );
}

describe('TodayPage', () => {
  it('affiche un état vide quand aucune tâche n’est prévue aujourd’hui', async () => {
    renderToday();
    expect(await screen.findByText(/Rien au programme/i)).toBeInTheDocument();
  });

  it('affiche les tâches du jour et permet de les valider', async () => {
    const user = userEvent.setup();
    await createTask({ title: 'Boire un café', date: todayKey() });
    await createTask({ title: 'Faire 20 minutes de sport', date: todayKey(), time: '07:00' });

    renderToday();

    expect(await screen.findByText('Boire un café')).toBeInTheDocument();
    expect(screen.getByText('Faire 20 minutes de sport')).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 2 tâche/)).toBeInTheDocument();

    const checkbox = screen.getByRole('button', { name: /Marquer "Boire un café" comme fait/i });
    await user.click(checkbox);

    await waitFor(() => expect(screen.getByText(/1 \/ 2 tâche/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Marquer "Boire un café" comme à faire/i })).toBeInTheDocument();
  });

  it('permet de créer une tâche depuis le formulaire', async () => {
    const user = userEvent.setup();
    renderToday();

    await screen.findByText(/Rien au programme/i);
    await user.click(screen.getByRole('button', { name: /Ajouter une tâche/i }));

    const dialog = await screen.findByRole('dialog', { name: /Nouvelle tâche/i });
    await user.type(within(dialog).getByLabelText(/Titre/i), 'Appeler le dentiste');
    await user.click(within(dialog).getByRole('button', { name: /^Ajouter$/i }));

    await waitFor(() => expect(screen.getByText('Appeler le dentiste')).toBeInTheDocument());
    expect(screen.queryByText(/Rien au programme/i)).not.toBeInTheDocument();
  });

  it('permet de supprimer une tâche via la confirmation à double-tap', async () => {
    const user = userEvent.setup();
    await createTask({ title: 'Tâche à supprimer', date: todayKey() });
    renderToday();

    await screen.findByText('Tâche à supprimer');
    const deleteButton = screen.getByRole('button', { name: /Supprimer "Tâche à supprimer"/i });

    await user.click(deleteButton);
    expect(await screen.findByText(/Confirmer/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Confirmer la suppression/i }));

    await waitFor(() => expect(screen.queryByText('Tâche à supprimer')).not.toBeInTheDocument());
    expect(await screen.findByText(/Rien au programme/i)).toBeInTheDocument();
  });
});
