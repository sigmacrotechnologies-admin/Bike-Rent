import { useMemo, useState } from 'react'
import {
  ADDONS,
  PROJECT_TYPES,
  QUALITY_TIERS,
  REGIONS,
  calculateEstimate,
  formatCurrency,
  type ProjectType,
  type QualityTier,
  type RegionId,
} from './pricing'
import './index.css'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2400&q=80'

function App() {
  const [projectType, setProjectType] = useState<ProjectType>('new_home')
  const [squareFeet, setSquareFeet] = useState(1800)
  const [quality, setQuality] = useState<QualityTier>('standard')
  const [region, setRegion] = useState<RegionId>('south')
  const [addons, setAddons] = useState<string[]>(['permits'])
  const [contingencyPercent, setContingencyPercent] = useState(10)

  const estimate = useMemo(
    () =>
      calculateEstimate({
        projectType,
        squareFeet,
        quality,
        region,
        addons,
        contingencyPercent,
      }),
    [projectType, squareFeet, quality, region, addons, contingencyPercent],
  )

  const barTotal =
    estimate.materials + estimate.labor + estimate.softCosts + Math.max(estimate.addons, 1)

  function toggleAddon(id: string) {
    setAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  function printEstimate() {
    window.print()
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__media" aria-hidden="true">
          <img
            src={HERO_IMAGE}
            alt=""
            width={2400}
            height={1600}
          />
        </div>
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__grid" aria-hidden="true" />

        <div className="hero__inner">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              C
            </span>
            <span className="brand__name">Cornerstone</span>
          </div>
          <h1 className="hero__headline">Construction costs, clarified before you break ground.</h1>
          <p className="hero__lede">
            Instant ballpark estimates for new builds, remodels, and fit-outs—tuned by region,
            finish level, and scope.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#estimator">
              Build my estimate
            </a>
            <a className="btn btn--ghost" href="#how">
              How it works
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="estimator" id="estimator">
          <div className="estimator__inner">
            <p className="section-kicker" id="how">
              Project estimator
            </p>
            <h2 className="section-title">Shape the scope. Watch the budget settle.</h2>
            <p className="section-copy">
              Sample U.S. pricing based on trade averages. Use it for planning conversations—not as
              a contractor bid.
            </p>

            <div className="estimator__layout">
              <div className="panel">
                <div className="field-group">
                  <span className="field-label">Project type</span>
                  <div className="choice-grid choice-grid--3">
                    {PROJECT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        className={`choice${projectType === type.id ? ' is-active' : ''}`}
                        onClick={() => setProjectType(type.id)}
                        aria-pressed={projectType === type.id}
                      >
                        <span className="choice__title">{type.label}</span>
                        <span className="choice__blurb">{type.blurb}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <span className="field-label">Size & market</span>
                  <div className="input-row">
                    <div className="input-wrap">
                      <label htmlFor="sqft">Square footage</label>
                      <input
                        id="sqft"
                        type="number"
                        min={50}
                        max={50000}
                        step={50}
                        value={squareFeet}
                        onChange={(e) => setSquareFeet(Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="input-wrap">
                      <label htmlFor="region">Region</label>
                      <select
                        id="region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value as RegionId)}
                      >
                        {REGIONS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <span className="field-label">Finish level</span>
                  <div className="choice-grid">
                    {QUALITY_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        className={`choice${quality === tier.id ? ' is-active' : ''}`}
                        onClick={() => setQuality(tier.id)}
                        aria-pressed={quality === tier.id}
                      >
                        <span className="choice__title">{tier.label}</span>
                        <span className="choice__blurb">
                          {Math.round(tier.multiplier * 100)}% of baseline cost
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <div className="range-wrap">
                    <label className="field-label" htmlFor="contingency">
                      Contingency reserve
                    </label>
                    <input
                      id="contingency"
                      type="range"
                      min={5}
                      max={20}
                      step={1}
                      value={contingencyPercent}
                      onChange={(e) => setContingencyPercent(Number(e.target.value))}
                    />
                    <div className="range-meta">
                      <span>5%</span>
                      <span>{contingencyPercent}%</span>
                      <span>20%</span>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <span className="field-label">Add-ons</span>
                  <div className="addon-list">
                    {ADDONS.map((addon) => {
                      const active = addons.includes(addon.id)
                      const priceLabel =
                        addon.unit === 'flat'
                          ? formatCurrency(addon.amount)
                          : addon.unit === 'sqft'
                            ? `${formatCurrency(addon.amount)}/sqft`
                            : `${(addon.amount * 100).toFixed(1)}% of base`
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          className={`addon${active ? ' is-active' : ''}`}
                          onClick={() => toggleAddon(addon.id)}
                          aria-pressed={active}
                        >
                          <span className="addon__check" aria-hidden="true">
                            ✓
                          </span>
                          <span>
                            <span className="addon__label">{addon.label}</span>
                            <span className="addon__desc">{addon.description}</span>
                          </span>
                          <span className="addon__price">{priceLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <aside className="panel panel--result" aria-live="polite">
                <p className="result__eyebrow">Estimated project cost</p>
                <p className="result__total-label">Likely total</p>
                <p className="result__total" key={estimate.total}>
                  {formatCurrency(estimate.total)}
                </p>
                <p className="result__range">
                  Planning range {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
                </p>

                <div className="result__metrics">
                  <div className="metric">
                    <span>Per square foot</span>
                    <strong>{formatCurrency(estimate.costPerSqft)}</strong>
                  </div>
                  <div className="metric">
                    <span>Timeline</span>
                    <strong>
                      {estimate.timelineWeeks.low}–{estimate.timelineWeeks.high} wks
                    </strong>
                  </div>
                </div>

                <div
                  className="bar-stack"
                  aria-hidden="true"
                  title="Materials / Labor / Soft costs / Add-ons"
                >
                  <i style={{ width: `${(estimate.materials / barTotal) * 100}%` }} />
                  <i style={{ width: `${(estimate.labor / barTotal) * 100}%` }} />
                  <i style={{ width: `${(estimate.softCosts / barTotal) * 100}%` }} />
                  <i style={{ width: `${(Math.max(estimate.addons, 1) / barTotal) * 100}%` }} />
                </div>

                <div className="breakdown">
                  {estimate.lines.map((line) => (
                    <div className="breakdown__row" key={line.id}>
                      <span>{line.label}</span>
                      <span>{formatCurrency(line.amount)}</span>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn btn--solid" onClick={printEstimate}>
                  Print estimate summary
                </button>
                <p className="note">
                  Figures are illustrative sample data for early planning. Local labor rates,
                  material volatility, site conditions, and code requirements can move the number
                  substantially.
                </p>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <span>
            <strong>Cornerstone</strong> construction estimator
          </span>
          <span>Sample pricing · Not a formal bid</span>
        </div>
      </footer>
    </div>
  )
}

export default App
