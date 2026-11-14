import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SummaryTiles from './components/SummaryTiles';
import CategoryBreakdown from './components/CategoryBreakdown';
import AttentionList from './components/AttentionList';
import UploadForm from './components/UploadForm';
import * as api from './api';
import type { Message } from './types';

describe('SummaryTiles', () => {
  it('shows totals and contains urgent-count testid', () => {
    render(<SummaryTiles total={1200} urgent={7} approaching={13} attentionTotal={20} />);
    expect(screen.getByTestId('urgent')).toHaveTextContent('7');
    expect(screen.getByTestId('urgent-count')).toHaveTextContent('7');
    expect(screen.getByTestId('approaching')).toHaveTextContent('13');
    expect(screen.getByTestId('attention-total')).toHaveTextContent('20');
  });
});

describe('UploadForm', () => {
  it('has upload-input and analyze-button testids', () => {
    const onSubmit = vi.fn();
    render(<UploadForm onSubmit={onSubmit} loading={false} />);
    const input = screen.getByTestId('upload-input');
    const button = screen.getByTestId('analyze-button');
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled(); // disabled until file chosen
  });

  it('renders live progress bar and status message when loading', () => {
    const onSubmit = vi.fn();
    render(
      <UploadForm
        onSubmit={onSubmit}
        loading={true}
        progress={{
          step: 'classify',
          progress: 65,
          message: 'دسته‌بندی پیام‌ها: بسته ۴ از ۶ تکمیل شد (۶۵٪)...',
        }}
      />
    );
    expect(screen.getByTestId('progress-section')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '65%' });
    expect(screen.getByTestId('progress-msg')).toHaveTextContent('دسته‌بندی پیام‌ها: بسته ۴ از ۶ تکمیل شد');
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
  const sampleMessage1: Message = {
    message_id: 'M101',
    category: 'delivery',
    is_urgent: true,
    order_ref: 'BZ-48219',
    duplicate_of: null,
    customer_id: 'C101',
    channel: 'app',
    received_at: '2026-10-24T10:00:00+03:30',
    answered_at: null,
    subject: 'بسته من نرسیده',
    body: 'سلام سفارشم هنوز دستم نرسیده',
    severity: 'high',
    severity_hint: 'high',
  };

  const sampleMessage2: Message = {
    message_id: 'M102',
    category: 'payment',
    is_urgent: false,
    order_ref: null,
    duplicate_of: null,
    customer_id: 'C102',
    channel: 'web',
    received_at: '2026-10-24T11:45:00+03:30',
    answered_at: null,
    subject: 'برداشت دوباره از حساب',
    body: 'دو بار از کارتم کم شد',
    severity: 'high',
    severity_hint: 'high',
  };

  it('renders attention rows in display order with QA testids', () => {
    // Evaluation time: 2026-10-24 12:30:00 (+03:30)
    // M101 received 10:00 -> elapsed 2.5h -> 30 mins overdue (-30)
    // M102 received 11:45 -> elapsed 0.75h -> 75 mins left (+75)
    render(
      <AttentionList
        messages={[sampleMessage1, sampleMessage2]}
        now={new Date('2026-10-24T12:30:00+03:30')}
      />
    );

    const rows = screen.getAllByTestId('attention-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('data-message-id', 'M101');
    expect(rows[0]).toHaveAttribute('data-business-minutes-left', '-30');

    expect(rows[1]).toHaveAttribute('data-message-id', 'M102');
    expect(rows[1]).toHaveAttribute('data-business-minutes-left', '75');
  });

  it('filters attention rows using interactive tabs', () => {
    render(
      <AttentionList
        messages={[sampleMessage1, sampleMessage2]}
        now={new Date('2026-10-24T12:30:00+03:30')}
      />
    );


    // Initial state: "all" selected -> 2 rows
    expect(screen.getAllByTestId('attention-row')).toHaveLength(2);

    // Click Urgent tab -> only M101 shown
    const urgentTab = screen.getByRole('tab', { name: /فوری و معوق/i });
    fireEvent.click(urgentTab);
    const urgentRows = screen.getAllByTestId('attention-row');
    expect(urgentRows).toHaveLength(1);
    expect(urgentRows[0]).toHaveAttribute('data-message-id', 'M101');

    // Click Approaching tab -> only M102 shown
    const approachingTab = screen.getByRole('tab', { name: /در مهلت تعهد/i });
    fireEvent.click(approachingTab);
    const approachingRows = screen.getAllByTestId('attention-row');
    expect(approachingRows).toHaveLength(1);
    expect(approachingRows[0]).toHaveAttribute('data-message-id', 'M102');

    // Click All tab -> both shown again
    const allTab = screen.getByRole('tab', { name: /همه/i });
    fireEvent.click(allTab);
    expect(screen.getAllByTestId('attention-row')).toHaveLength(2);
  });

  it('deep module: auto-filters candidates and computes stats via useAttentionQueue', () => {
    const answeredMessage: Message = {
      ...sampleMessage1,
      message_id: 'M103',
      answered_at: '2026-10-24T11:00:00+03:30',
    };
    const duplicateMessage: Message = {
      ...sampleMessage1,
      message_id: 'M104',
      duplicate_of: 'M101',
    };
    render(
      <AttentionList
        messages={[sampleMessage1, sampleMessage2, answeredMessage, duplicateMessage]}
        now={new Date('2026-10-24T12:30:00+03:30')}
      />
    );
    // Answered and duplicate messages are filtered out internally:
    const rows = screen.getAllByTestId('attention-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('data-message-id', 'M101');
    expect(rows[1]).toHaveAttribute('data-message-id', 'M102');
    expect(screen.getByRole('tab', { name: /همه \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /فوری و معوق \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /در مهلت تعهد \(1\)/i })).toBeInTheDocument();
  });

  it('handles successful draft reply with textarea and approve button', async () => {
    vi.spyOn(api, 'requestDraft').mockResolvedValueOnce({
      message_id: 'M101',
      draft: 'سلام، پیام شما دریافت شد و در حال پیگیری هستیم.',
      language: 'fa',
      blocked: false,
      warnings: [],
    });

    render(
      <AttentionList
        messages={[sampleMessage1]}
        now={new Date('2026-10-24T12:30:00+03:30')}
      />
    );

    const draftBtn = screen.getByTestId('draft-button');
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
      message_id: 'M101',
      draft: '',
      language: 'fa',
      blocked: true,
      warnings: ['امکان تولید پیش‌نویس امن وجود ندارد'],
    });

    render(
      <AttentionList
        messages={[sampleMessage1]}
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
