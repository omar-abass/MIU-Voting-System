import { useId, useState } from 'react';
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table2, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatNumber } from '../../utils/format.js';
import { Button } from '../common/Button.jsx';

export const SERIES_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

const axisTick = { fill: 'var(--chart-axis)', fontSize: 12 };

function ChartTip({ active, payload, valueLabel, format }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const row = item.payload;
  return (
    <div className="chart-tip">
      <strong>{row.name}</strong>
      <span>
        {valueLabel}: {format(item.value)}
      </span>
      {row.note && <span>{row.note}</span>}
    </div>
  );
}

/**
 * Wraps a chart with a title and a "table view" switch. The table carries every value, so
 * nothing is conveyed by colour or by the chart alone.
 */
export function ChartFrame({ title, subtitle, data, valueLabel, format, children, height = 260 }) {
  const { t } = useTranslation();
  const [asTable, setAsTable] = useState(false);
  const id = useId();
  return (
    <div>
      <div className="card__header" style={{ marginBottom: 8 }}>
        <div>
          <h3 className="card__title" id={id}>
            {title}
          </h3>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? <BarChart3 aria-hidden="true" /> : <Table2 aria-hidden="true" />}
          {asTable ? t('charts.viewChart') : t('charts.viewTable')}
        </Button>
      </div>
      {asTable ? (
        <div className="table-wrap" style={{ maxHeight: height + 40, overflow: 'auto' }}>
          <table className="table" aria-labelledby={id}>
            <thead>
              <tr>
                <th scope="col">{t('charts.item')}</th>
                <th scope="col">{valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.key ?? row.name}>
                  <th scope="row" style={{ fontWeight: 600, textAlign: 'start' }}>
                    {row.name}
                  </th>
                  <td className="num">{format(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ width: '100%', height }} role="img" aria-labelledby={id}>
          {children}
        </div>
      )}
    </div>
  );
}

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * Horizontal bars (one series). Thin bars with a rounded data end, the value at the tip.
 * `colorByIndex` colours each bar by its fixed slot when bars are distinct entities (e.g. clubs in a competition).
 */
export function HBarChart({ data, valueLabel, title, subtitle, format, colorByIndex = false, height, domainMax, labelMax = 30 }) {
  const { lang, isRtl } = useLanguage();
  const fmt = format ?? ((v) => formatNumber(v, lang));
  const computedHeight = height ?? Math.max(120, data.length * 44 + 30);
  return (
    <ChartFrame title={title} subtitle={subtitle} data={data} valueLabel={valueLabel} format={fmt} height={computedHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: isRtl ? 4 : 56, bottom: 4, left: isRtl ? 56 : 4 }} barCategoryGap={14}>
          <XAxis type="number" hide domain={[0, domainMax ?? 'dataMax']} reversed={isRtl} />
          <YAxis
            type="category"
            dataKey="name"
            width={190}
            orientation={isRtl ? 'right' : 'left'}
            tick={axisTick}
            tickFormatter={(v) => truncate(String(v), labelMax)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: 'var(--surface-3)', opacity: 0.6 }} content={<ChartTip valueLabel={valueLabel} format={fmt} />} />
          <Bar dataKey="value" barSize={20} radius={[0, 6, 6, 0]} isAnimationActive={false} background={{ fill: 'var(--surface-3)', radius: 6 }}>
            {data.map((row, i) => (
              <Cell key={row.key ?? row.name} fill={colorByIndex ? SERIES_COLORS[i % SERIES_COLORS.length] : 'var(--chart-1)'} />
            ))}
            <LabelList dataKey="value" position="right" formatter={fmt} style={{ fill: 'var(--text)', fontSize: 12.5, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Donut with a direct-labelled legend (name + value + share) beside it. */
export function DonutChart({ data, title, subtitle, valueLabel, totalLabel }) {
  const { lang } = useLanguage();
  const fmt = (v) => formatNumber(v, lang);
  const total = data.reduce((s, d) => s + d.value, 0);
  const visible = data.filter((d) => d.value > 0);
  return (
    <ChartFrame title={title} subtitle={subtitle} data={data} valueLabel={valueLabel} format={fmt} height={220}>
      <div className="donut-wrap" style={{ height: '100%' }}>
        <div style={{ width: 190, height: 190, position: 'relative', flex: 'none' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visible.length ? visible : [{ name: '-', value: 1 }]}
                dataKey="value"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={visible.length > 1 ? 2 : 0}
                stroke="var(--surface)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {(visible.length ? visible : [{ key: 'empty' }]).map((d, i) => (
                  <Cell key={d.key ?? d.name} fill={visible.length ? SERIES_COLORS[data.indexOf(d) % SERIES_COLORS.length] : 'var(--surface-3)'} />
                ))}
              </Pie>
              {visible.length > 0 && <Tooltip content={<ChartTip valueLabel={valueLabel} format={fmt} />} />}
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{fmt(total)}</div>
              <div className="muted sm">{totalLabel}</div>
            </div>
          </div>
        </div>
        <div className="legend">
          {data.map((d, i) => (
            <span key={d.key ?? d.name}>
              <i style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
              <span>
                {d.name} <b>{fmt(d.value)}</b>
              </span>
            </span>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}
