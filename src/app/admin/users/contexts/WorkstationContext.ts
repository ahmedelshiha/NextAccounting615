'use client'

import { createContext, useContext, ReactNode } from 'react'
import { WorkstationContextType, QuickStatsData } from '../types/workstation'
import { UserFilters } from '../types'

/**
 * WorkstationContext
 * Manages the state for the Oracle Fusion-inspired workstation layout
 * Includes layout visibility, filter state, selections, and bulk operations
 */
const WorkstationContext = createContext<WorkstationContextType | undefined>(undefined)

/**
 * Hook to use the WorkstationContext
 * @throws {Error} If used outside of WorkstationContextProvider
 */
export function useWorkstationContext(): WorkstationContextType {
  const context = useContext(WorkstationContext)
  if (!context) {
    throw new Error('useWorkstationContext must be used within WorkstationContextProvider')
  }
  return context
}

/**
 * Hooks for specific workstation features
 */
export function useWorkstationSidebar() {
  const context = useWorkstationContext()
  return {
    isOpen: context.sidebarOpen,
    toggle: () => context.setSidebarOpen(!context.sidebarOpen),
    open: () => context.setSidebarOpen(true),
    close: () => context.setSidebarOpen(false)
  }
}

export function useWorkstationInsights() {
  const context = useWorkstationContext()
  return {
    isOpen: context.insightsPanelOpen,
    toggle: () => context.setInsightsPanelOpen(!context.insightsPanelOpen),
    open: () => context.setInsightsPanelOpen(true),
    close: () => context.setInsightsPanelOpen(false)
  }
}

export function useWorkstationFilters() {
  const context = useWorkstationContext()
  return {
    filters: context.selectedFilters,
    setFilters: context.setSelectedFilters
  }
}

export function useWorkstationSelection() {
  const context = useWorkstationContext()
  return {
    selectedIds: context.selectedUserIds,
    setSelectedIds: context.setSelectedUserIds,
    toggle: context.toggleUserSelection,
    selectAll: context.selectAllUsers,
    clear: context.clearSelection,
    count: context.selectedUserIds.size
  }
}

export { WorkstationContext, type WorkstationContextType }
