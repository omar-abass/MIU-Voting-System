export function Card({ as: Tag = 'section', flat = false, interactive = false, className = '', children, ...rest }) {
  const classes = ['card', flat && 'card--flat', interactive && 'card--interactive', className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, actions, as: Heading = 'h2' }) {
  return (
    <div className="card__header">
      <div>
        {title && <Heading className="card__title">{title}</Heading>}
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}
