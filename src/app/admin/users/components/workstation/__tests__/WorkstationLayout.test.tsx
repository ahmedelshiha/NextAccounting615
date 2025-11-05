import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkstationLayout } from '../WorkstationLayout'

describe('WorkstationLayout', () => {
  it('renders all three columns', () => {
    render(
      <WorkstationLayout
        sidebar={<div data-testid="sidebar">Sidebar</div>}
        main={<div data-testid="main">Main</div>}
        insights={<div data-testid="insights">Insights</div>}
      />
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('main')).toBeInTheDocument()
    expect(screen.getByTestId('insights')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <WorkstationLayout
        sidebar={<div>Sidebar</div>}
        main={<div>Main</div>}
        insights={<div>Insights</div>}
        className="custom-class"
      />
    )

    const layoutContainer = container.querySelector('.workstation-container')
    expect(layoutContainer).toHaveClass('custom-class')
  })

  it('calls onSidebarToggle when sidebar state changes', () => {
    const mockToggle = vi.fn()
    const { rerender } = render(
      <WorkstationLayout
        sidebar={<div>Sidebar</div>}
        main={<div>Main</div>}
        insights={<div>Insights</div>}
        onSidebarToggle={mockToggle}
      />
    )

    // Test will verify toggle behavior in Phase 1 implementation
  })

  it('calls onInsightsToggle when insights state changes', () => {
    const mockToggle = vi.fn()
    render(
      <WorkstationLayout
        sidebar={<div>Sidebar</div>}
        main={<div>Main</div>}
        insights={<div>Insights</div>}
        onInsightsToggle={mockToggle}
      />
    )

    // Test will verify toggle behavior in Phase 1 implementation
  })

  describe('responsive behavior', () => {
    it('renders desktop layout with all columns visible', () => {
      // Will test CSS Grid layout in Phase 1
      const { container } = render(
        <WorkstationLayout
          sidebar={<div>Sidebar</div>}
          main={<div>Main</div>}
          insights={<div>Insights</div>}
        />
      )

      expect(container.querySelector('.workstation-container')).toBeInTheDocument()
    })

    it('respects custom sidebar width', () => {
      render(
        <WorkstationLayout
          sidebar={<div>Sidebar</div>}
          main={<div>Main</div>}
          insights={<div>Insights</div>}
          sidebarWidth={300}
        />
      )

      // Width verification will be tested in Phase 1
    })

    it('respects custom insights panel width', () => {
      render(
        <WorkstationLayout
          sidebar={<div>Sidebar</div>}
          main={<div>Main</div>}
          insights={<div>Insights</div>}
          insightsPanelWidth={350}
        />
      )

      // Width verification will be tested in Phase 1
    })
  })
})
