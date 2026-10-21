import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../common/Modal.jsx';
import { renderPlain, resetEnvironment } from '../../test/utils.jsx';

function Harness() {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  return (
    <>
      <button onClick={() => setOpen(true)}>open dialog</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit details">
        <label>
          First
          <input value={a} onChange={(e) => setA(e.target.value)} data-autofocus />
        </label>
        <label>
          Second
          <input value={b} onChange={(e) => setB(e.target.value)} />
        </label>
        <button onClick={() => setOpen(false)}>done</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  beforeEach(async () => {
    await resetEnvironment();
  });

  it('moves focus into the dialog, closes with Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    renderPlain(<Harness />);
    const trigger = screen.getByRole('button', { name: 'open dialog' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Edit details' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(screen.getByLabelText('First')).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('keeps focus in the field being typed in while the parent re-renders on every keystroke', async () => {
    const user = userEvent.setup();
    renderPlain(<Harness />);
    await user.click(screen.getByRole('button', { name: 'open dialog' }));
    await screen.findByRole('dialog');
    const second = screen.getByLabelText('Second');
    await user.click(second);
    await user.keyboard('typed in the second field');
    // wait longer than the initial-focus timer to make sure focus is not pulled back to the first field
    await new Promise((r) => setTimeout(r, 120));
    expect(second).toHaveFocus();
    expect(second).toHaveValue('typed in the second field');
    expect(screen.getByLabelText('First')).toHaveValue('');
  });

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    renderPlain(<Harness />);
    await user.click(screen.getByRole('button', { name: 'open dialog' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'done' }));
    // closed again: re-open, tab through all three controls and make sure focus wraps around
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'open dialog' }));
    await screen.findByRole('dialog');
    screen.getByRole('button', { name: 'done' }).focus();
    await user.tab();
    expect(screen.getByLabelText('First')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'done' })).toHaveFocus();
  });
});
