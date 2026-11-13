import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SummaryTiles from './components/SummaryTiles';
import CategoryBreakdown from './components/CategoryBreakdown';
import AttentionList from './components/AttentionList';
import * as api from './api';
import type { Message } from './types';

describe('SummaryTiles', () => {
  it('shows totals and contains urgent-count testid', () => {
    render(<SummaryTiles total={1200} urgent={7} />);
    expect(screen.getByTestId('urgent')).toHaveTextContent('7');
    expect(screen.getByTestId('urgent-count')).toHaveTextContent('7');
  });
});

describe('CategoryBreakdown', () => {
  it('renders all six categories when all are present', () => {
    const counts = { delivery: 4, payment: 2, refund: 1, product_quality: 1, account: 1, other: 1 };
    render(<CategoryBreakdown counts={counts} total={10} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });
});

describe('AttentionList & Draft reply workflow', () => {
  const sampleMessage: Message = {
    message_id: 'M100',
    category: 'delivery',
    is_urgent: true,
    order_ref: 'BZ-48219',
    duplicate_of: null,
    customer_id: 'C100',
    channel: 'app',
    received_at: '2026-10-24T10:00:00+03:30',
    answered_at: null,
    subject: 'بسته من نرسیده',
    body: 'سلام سفارشم هنوز دستم نرسیده',
    severity: 'high',
    severity_hint: 'high',
  };

  it('renders attention row with QA testids and handles successful draft', async () => {
    vi.spyOn(api, 'requestDraft').mockResolvedValueOnce({
      message_id: 'M100',
      draft: 'سلام، پیام شما دریافت شد و در حال پیگیری هستیم.',
      language: 'fa',
      blocked: false,
      warnings: [],
    });

    render(
      <AttentionList
        ids={['M100']}
        messages={[sampleMessage]}
        now={new Date('2026-10-24T12:30:00+03:30')}
      />
    );

    const row = screen.getByTestId('attention-row');
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute('data-message-id', 'M100');
    expect(row).toHaveAttribute('data-business-minutes-left');

    const draftBtn = screen.getByTestId('draft-button');
    expect(draftBtn).toBeInTheDocument();

    fireEvent.click(draftBtn);

    const textarea = await screen.findByTestId('draft-text');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
    expect(textarea).toHaveValue('سلام، پیام شما دریافت شد و در حال پیگیری هستیم.');

    const approveBtn = screen.getByTestId('draft-approve');
    expect(approveBtn).toBeInTheDocument();

    // Edit textarea
    fireEvent.change(textarea, { target: { value: 'متن ویرایش شده' } });
    expect(textarea).toHaveValue('متن ویرایش شده');

    // Click approve button
    fireEvent.click(approveBtn);
    expect(approveBtn).toBeInTheDocument();
  });

  it('renders draft-warning when draft generation is blocked', async () => {
    vi.spyOn(api, 'requestDraft').mockResolvedValueOnce({
      message_id: 'M100',
      draft: '',
      language: 'fa',
      blocked: true,
      warnings: ['امکان تولید پیش‌نویس امن وجود ندارد'],
    });

    render(
      <AttentionList
        ids={['M100']}
        messages={[sampleMessage]}
        now={new Date('2026-10-24T12:30:00+03:30')}
      />
    );

    const draftBtn = screen.getByTestId('draft-button');
    fireEvent.click(draftBtn);

    const warning = await screen.findByTestId('draft-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent('امکان تولید پیش‌نویس امن وجود ندارد');
  });
});
