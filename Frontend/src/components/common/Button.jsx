import { forwardRef } from 'react';
import { Link } from 'react-router-dom';


export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', block = false, icon = false, loading = false, to, className = '', children, type = 'button', disabled, ...rest },
  ref
) {
  const classes = [
    'btn',
    variant !== 'secondary' && `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    icon && 'btn--icon',
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (to && !disabled) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});
