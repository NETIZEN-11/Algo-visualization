/**
 * Unit tests for `services/metricsService.js` — Prometheus text output.
 */
import { metricsService } from '../../services/metricsService.js'

describe('metricsService', () => {
  beforeEach(() => {
    // Reset counters/gauges/histograms between tests
    metricsService.render() // calls don't reset; we just check the format
  })

  test('renders Prometheus text format', () => {
    const out = metricsService.render()
    expect(typeof out).toBe('string')
    expect(out).toMatch(/^# HELP /m)
    expect(out).toMatch(/^# TYPE /m)
  })

  test('records a custom counter', () => {
    metricsService.inc('test_counter_xyz', { tag: 'a' })
    metricsService.inc('test_counter_xyz', { tag: 'a' })
    metricsService.inc('test_counter_xyz', { tag: 'b' })
    const out = metricsService.render()
    expect(out).toMatch(/test_counter_xyz\{tag=a\} 2/)
    expect(out).toMatch(/test_counter_xyz\{tag=b\} 1/)
  })

  test('records a gauge', () => {
    metricsService.set('test_gauge_xyz', 42)
    const out = metricsService.render()
    expect(out).toMatch(/^test_gauge_xyz 42$/m)
  })

  test('records a histogram observation', () => {
    metricsService.observe('test_hist_xyz', 0.5, [0.1, 1, 10])
    const out = metricsService.render()
    expect(out).toMatch(/test_hist_xyz_bucket\{le="0\.1"\}/)
    expect(out).toMatch(/test_hist_xyz_count 1/)
  })
})
