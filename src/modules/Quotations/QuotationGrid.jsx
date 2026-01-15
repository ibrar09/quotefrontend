import React, { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);
import { useTheme } from '../../context/ThemeContext';
import { Edit2, Eye, Trash2 } from 'lucide-react';

const QuotationGrid = ({
    rowData,
    loading,
    onCellValueChanged,
    onEditClick,
    onDeleteClick,
    onViewClick
}) => {
    const { darkMode, colors } = useTheme();

    // Custom Cell Renderer for Actions
    const ActionsRenderer = (params) => {
        return (
            <div className="flex items-center gap-2 h-full">
                <button
                    onClick={() => onViewClick(params.data)}
                    className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                    title="View PDF"
                >
                    <Eye size={16} />
                </button>
                <button
                    onClick={() => onEditClick(params.data)}
                    className="p-1 hover:bg-green-50 text-green-600 rounded"
                    title="Edit Full Quote"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onDeleteClick(params.data.id)}
                    className="p-1 hover:bg-red-50 text-red-600 rounded"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        );
    };

    // Value Setter for Amount updates (to handle validation if needed)
    const amountValueSetter = (params) => {
        const newVal = Number(params.newValue);
        if (isNaN(newVal)) return false;

        // Optimistically update
        params.data[params.colDef.field] = newVal;
        return true;
    };

    const columnDefs = useMemo(() => [
        {
            field: 'quote_no',
            headerName: 'Quote #',
            width: 120,
            pinned: 'left',
            filter: 'agTextColumnFilter',
            editable: false
        },
        {
            field: 'quote_status',
            headerName: 'Status',
            width: 130,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['DRAFT', 'READY_TO_SEND', 'SENT', 'PO_RECEIVED', 'APPROVED', 'PAID', 'CANCELLED']
            },
            editable: true,
            cellStyle: params => ({
                fontWeight: 'bold',
                color: getColorForStatus(params.value, colors) // Helper below
            })
        },
        {
            field: 'brand',
            headerName: 'Brand',
            width: 120,
            editable: true,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'location',
            headerName: 'Location',
            width: 150,
            editable: true
        },
        {
            field: 'work_description',
            headerName: 'Description',
            flex: 1,
            minWidth: 200,
            editable: true
        },
        {
            field: 'grand_total',
            headerName: 'Total (SAR)',
            width: 120,
            editable: false, // Calculated field, safest to keep read-only inline for now
            valueFormatter: params => params.value ? `SAR ${Number(params.value).toLocaleString()}` : '-'
        },
        {
            headerName: 'Actions',
            width: 120,
            cellRenderer: ActionsRenderer,
            pinned: 'right',
            sortable: false,
            filter: false
        }
    ], [colors]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        headerClass: 'font-bold uppercase text-xs tracking-wider',
    }), []);

    // Theme Variables to match Maaj styling
    const gridStyle = useMemo(() => ({
        height: '100%',
        width: '100%',
        '--ag-header-background-color': darkMode ? '#1f2937' : '#f9fafb', // Gray-800 : Gray-50
        '--ag-odd-row-background-color': darkMode ? '#111827' : '#ffffff', // Gray-900 : White
        '--ag-background-color': darkMode ? '#111827' : '#ffffff',
        '--ag-foreground-color': darkMode ? '#ffffff' : '#000000',
        '--ag-border-color': darkMode ? '#374151' : '#e5e7eb',
        '--ag-row-hover-color': darkMode ? '#374151' : '#f3f4f6',
    }), [darkMode]);

    return (
        <div
            className={`${darkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full h-[600px] shadow-xl rounded-xl overflow-hidden`}
            style={gridStyle}
        >
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onCellValueChanged={onCellValueChanged}
                loadingOverlayComponent={() => <div className="text-center p-4">Loading...</div>}
                tooltipShowDelay={500}
                animateRows={true}
                rowSelection='multiple'
            />
        </div>
    );
};

// Helper for status colors (matching QuotationList logic)
const getColorForStatus = (status, colors) => {
    switch (status) {
        case 'PAID': return '#15803d'; // green-700
        case 'APPROVED': return '#16a34a'; // green-600
        case 'PO_RECEIVED': return '#0891b2'; // cyan-600
        case 'SENT': return '#3b82f6'; // blue-500
        case 'READY_TO_SEND': return '#6366f1'; // indigo-500
        case 'CANCELLED': return '#ef4444'; // red-500
        case 'DRAFT': return '#f97316'; // orange-500
        default: return '#9ca3af'; // gray-400
    }
};

export default QuotationGrid;
