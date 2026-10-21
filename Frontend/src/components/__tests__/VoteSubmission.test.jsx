import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../services/api.js';
import { VoteSubmission } from '../voting/VoteSubmission.jsx';
import { renderPlain, resetEnvironment } from '../../test/utils.jsx';

const challenge = () => ({
  challengeId: 'vote-chal-1',
  maskedPhone: '+20 11******90',
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  resendAvailableAt: new Date(Date.now() + 60_000).toISOString()
});

function setup(overrides = {}) {
  const props = {
    selected: 11,
    selectedLabel: 'Green Campus Plan',
    requestChallenge: vi.fn().mockResolvedValue(challenge()),
    cast: vi.fn().mockResolvedValue({ voteId: 'VOT-2026-000123' }),
    onDone: vi.fn(),
    onFailure: vi.fn(),
    ...overrides
  };
  renderPlain(<VoteSubmission {...props} />);
  return props;
}

const gone = async (role = 'dialog') => waitFor(() => expect(screen.queryByRole(role)).not.toBeInTheDocument());

describe('vote confirmation flow', () => {
  beforeEach(async () => {
    await resetEnvironment();
  });

  it('keeps the submit button disabled until an option is selected', () => {
    setup({ selected: null, selectedLabel: '' });
    expect(screen.getByRole('button', { name: 'Submit my vote' })).toBeDisabled();
    expect(screen.getByText('Select an option to continue.')).toBeInTheDocument();
  });

  it('asks for confirmation first and sends NO code request until the voter confirms', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Submit my vote' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirm your choice' });
    expect(within(dialog).getByText('Green Campus Plan')).toBeInTheDocument();
    expect(within(dialog).getByText('Once your vote is cast it cannot be changed.')).toBeInTheDocument();
    expect(props.requestChallenge).not.toHaveBeenCalled();
    expect(props.cast).not.toHaveBeenCalled();
  });

  it('cancelling the confirmation sends nothing', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Submit my vote' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await gone();
    expect(props.requestChallenge).not.toHaveBeenCalled();
    expect(props.cast).not.toHaveBeenCalled();
    expect(props.onDone).not.toHaveBeenCalled();
  });

  it('Escape closes the confirmation without voting', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Submit my vote' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await gone();
    expect(props.cast).not.toHaveBeenCalled();
  });

  it('confirm -> SMS code -> cast: the vote is submitted once with the challenge and the typed code', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Submit my vote' }));
    const confirm = await screen.findByRole('dialog', { name: 'Confirm your choice' });
    await user.click(within(confirm).getByRole('button', { name: 'Send verification code' }));
    expect(props.requestChallenge).toHaveBeenCalledTimes(1);

    const otp = await screen.findByRole('dialog', { name: 'Verify and cast your vote' });
    expect(within(otp).getByText('+20 11******90')).toBeInTheDocument();
    // the Cast button stays disabled until all six digits are entered
    expect(within(otp).getByRole('button', { name: 'Cast my vote' })).toBeDisabled();

    await user.keyboard('482913');
    await waitFor(() => expect(props.cast).toHaveBeenCalledTimes(1));
    expect(props.cast).toHaveBeenCalledWith({ challengeId: 'vote-chal-1', code: '482913' });
    await waitFor(() => expect(props.onDone).toHaveBeenCalledWith({ voteId: 'VOT-2026-000123' }));
    await gone();
  });

  it('shows an error and keeps the dialog open when the code is wrong (no onDone)', async () => {
    const user = userEvent.setup();
    const cast = vi.fn().mockRejectedValue(new ApiError(400, 'otp_invalid', 'bad code'));
    const props = setup({ cast });
    await user.click(screen.getByRole('button', { name: 'Submit my vote' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Send verification code' }));
    await screen.findByRole('dialog', { name: 'Verify and cast your vote' });
    await user.keyboard('111111');
    expect(await screen.findByText('The code is incorrect. Check the SMS and try again.')).toBeInTheDocument();
    expect(props.onDone).not.toHaveBeenCalled();
    expect(props.onFailure).not.toHaveBeenCalled(); // a wrong code is not a page-level failure
    expect(screen.getByRole('dialog', { name: 'Verify and cast your vote' })).toBeInTheDocument();
  });

  it('tells the page when the person has already voted / voting closed so it can refresh', async () => {
    const user = userEvent.setup();
    const cast = vi.fn().mockRejectedValue(new ApiError(409, 'already_voted', 'x'));
    const props = setup({ cast });
    await user.click(screen.getByRole('button', { name: 'Submit my vote' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Send verification code' }));
    await screen.findByRole('dialog', { name: 'Verify and cast your vote' });
    await user.keyboard('222222');
    await waitFor(() => expect(props.onFailure).toHaveBeenCalledTimes(1));
    expect(props.onFailure.mock.calls[0][0].code).toBe('already_voted');
    expect(await screen.findByText('You have already voted in this election. Each person can vote only once.')).toBeInTheDocument();
  });

  it('stays on the confirmation step with an error when the code cannot be requested (voting closed)', async () => {
    const user = userEvent.setup();
    const requestChallenge = vi.fn().mockRejectedValue(new ApiError(409, 'event_closed', 'x'));
    const props = setup({ requestChallenge });
    await user.click(screen.getByRole('button', { name: 'Submit my vote' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirm your choice' });
    await user.click(within(dialog).getByRole('button', { name: 'Send verification code' }));
    expect(await within(dialog).findByText('Voting for this election has closed.')).toBeInTheDocument();
    expect(props.onFailure).toHaveBeenCalledTimes(1);
    expect(props.cast).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Verify and cast your vote' })).not.toBeInTheDocument();
  });
});
