import { useState } from 'react';
import type { HTMLInputTypeAttribute } from 'react';
import {
  ChipGroupQuestion,
  DatalistQuestion,
  FileQuestion,
  InputQuestion,
  Option,
  RangeQuestion,
  SelectQuestion,
  TextQuestion,
  ToggleQuestion,
} from './QuestionComponents';

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'radio-chips'
  | 'checkbox-chips'
  | 'range'
  | 'input'
  | 'datalist'
  | 'toggle'
  | 'file';

export interface QuestionDef {
  id: string;
  title: string;
  type: QuestionType;
  required?: boolean;
  options?: Option[];
  placeholder?: string;
  helper?: string;
  ariaLabel?: string;
  inputType?: HTMLInputTypeAttribute;
  min?: number;
  max?: number;
  step?: number;
  listId?: string;
  displayValue?: (value: unknown) => string;
}

export interface QuestionStepperProps {
  questions: QuestionDef[];
  initialAnswers?: Record<string, unknown>;
  onComplete?: (answers: Record<string, unknown>) => void;
  submitting?: boolean;
  title?: string;
  description?: string;
}

function isAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function QuestionStepper({
  questions,
  initialAnswers,
  onComplete,
  submitting = false,
  title,
  description,
}: QuestionStepperProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers ?? {});

  const total = questions.length;
  const question = questions[current];
  const currentValue = answers[question?.id];
  const answered = isAnswered(currentValue) || !question?.required;
  const progress = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  function setAnswer(id: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function next() {
    if (current >= total - 1) {
      onComplete?.(answers);
      return;
    }
    setCurrent((c) => Math.min(total - 1, c + 1));
  }

  function back() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  if (total === 0) {
    return <div className="jh-quiz-card">No questions configured.</div>;
  }

  function renderQuestion() {
    switch (question.type) {
      case 'text':
        return (
          <TextQuestion
            label={question.title}
            value={(currentValue as string) ?? ''}
            placeholder={question.placeholder}
            helper={question.helper}
            onChange={(v) => {
              setAnswer(question.id, v);
              if (answered) next();
            }}
          />
        );
      case 'textarea':
        return (
          <TextQuestion
            label={question.title}
            multiline
            value={(currentValue as string) ?? ''}
            placeholder={question.placeholder}
            helper={question.helper}
            onChange={(v) => setAnswer(question.id, v)}
          />
        );
      case 'select':
        return (
          <SelectQuestion
            label={question.title}
            value={(currentValue as string) ?? ''}
            options={question.options ?? []}
            onChange={(v) => setAnswer(question.id, v as string)}
            helper={question.helper}
            ariaLabel={question.ariaLabel}
          />
        );
      case 'multi-select':
        return (
          <SelectQuestion
            label={question.title}
            multiple
            value={(currentValue as string[]) ?? []}
            options={question.options ?? []}
            onChange={(v) => setAnswer(question.id, v as string[])}
            helper={question.helper}
            ariaLabel={question.ariaLabel}
          />
        );
      case 'radio-chips':
        return (
          <ChipGroupQuestion
            label={question.title}
            options={question.options ?? []}
            value={(currentValue as string) ?? ''}
            mode="single"
            name={question.id}
            ariaLabel={question.ariaLabel}
            onChange={(v) => setAnswer(question.id, v as string)}
          />
        );
      case 'checkbox-chips':
        return (
          <ChipGroupQuestion
            label={question.title}
            options={question.options ?? []}
            value={(currentValue as string[]) ?? []}
            mode="multi"
            name={question.id}
            ariaLabel={question.ariaLabel}
            onChange={(v) => setAnswer(question.id, v as string[])}
          />
        );
      case 'range':
        return (
          <RangeQuestion
            label={question.title}
            min={question.min ?? 0}
            max={question.max ?? 100}
            step={question.step ?? 1}
            value={(currentValue as number) ?? question.min ?? 0}
            onChange={(v) => setAnswer(question.id, v)}
            displayValue={
              question.displayValue && currentValue !== undefined
                ? question.displayValue(currentValue)
                : undefined
            }
          />
        );
      case 'input':
        return (
          <InputQuestion
            label={question.title}
            type={question.inputType ?? 'text'}
            value={(currentValue as string | number) ?? ''}
            onChange={(v) => setAnswer(question.id, v)}
            placeholder={question.placeholder}
            helper={question.helper}
            min={question.min}
            max={question.max}
            step={question.step}
            ariaLabel={question.ariaLabel}
          />
        );
      case 'datalist':
        return (
          <DatalistQuestion
            label={question.title}
            value={(currentValue as string) ?? ''}
            onChange={(v) => setAnswer(question.id, v)}
            listId={question.listId ?? `${question.id}-list`}
            options={question.options ?? []}
            placeholder={question.placeholder}
          />
        );
      case 'toggle':
        return (
          <ToggleQuestion
            label={question.title}
            checked={Boolean(currentValue)}
            onChange={(checked) => setAnswer(question.id, checked)}
            name={question.id}
          />
        );
      case 'file':
        return (
          <FileQuestion
            label={question.title}
            accept={question.helper}
            onChange={(file) => setAnswer(question.id, file)}
            helper={question.helper}
            name={question.id}
          />
        );
      default:
        return <div>Unsupported question type: {question.type}</div>;
    }
  }

  return (
    <div className="jh-quiz-card jh-quiz-card--desktop" aria-live="polite">
      <div className="jh-quiz-progress" style={{ marginBottom: '1.5rem' }}>
        <div className="jh-quiz-progress-bar">
          <div className="jh-quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="jh-quiz-progress-text">
          <span>Question {current + 1} of {total}</span>
          <span>{progress}%</span>
        </div>
      </div>

      {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
      {description && <p style={{ color: 'var(--jh-gray-600)', marginTop: '0.35rem' }}>{description}</p>}

      <div style={{ margin: '1.25rem 0' }}>{renderQuestion()}</div>

      <div className="jh-quiz-nav">
        <button
          className="jh-btn-secondary"
          onClick={back}
          style={{ visibility: current > 0 ? 'visible' : 'hidden' }}
          disabled={submitting}
        >
          ← Back
        </button>
        <button
          className="jh-btn-primary"
          onClick={next}
          disabled={!answered || submitting}
        >
          {submitting && current >= total - 1
            ? 'Submitting…'
            : current >= total - 1
            ? 'Finish'
            : 'Next →'}
        </button>
      </div>
    </div>
  );
}
