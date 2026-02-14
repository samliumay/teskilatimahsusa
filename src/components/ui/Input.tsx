'use client';

import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, mono, className, id, ...rest }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const inputClassNames = [
      styles.input,
      mono ? styles.mono : undefined,
      error ? styles.hasError : undefined,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClassNames}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error && (
          <span id={`${inputId}-error`} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
