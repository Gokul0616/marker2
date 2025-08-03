import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  PlusIcon, 
  TrashIcon, 
  GripVerticalIcon, 
  MoreHorizontalIcon,
  TableIcon
} from 'lucide-react';

const TableBlock = ({ block, onChange, canEdit }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  
  // Initialize table data if it doesn't exist
  const initializeTable = () => {
    if (!block.properties?.table) {
      const defaultTable = {
        rows: [
          { id: 'header', cells: ['Column 1', 'Column 2', 'Column 3'], isHeader: true },
          { id: 'row1', cells: ['', '', ''], isHeader: false },
          { id: 'row2', cells: ['', '', ''], isHeader: false }
        ],
        columns: 3
      };
      onChange(block.content, { table: defaultTable });
      return defaultTable;
    }
    return block.properties.table;
  };

  const table = initializeTable();

  const updateTable = (newTable) => {
    onChange(block.content, { table: newTable });
  };

  const updateCell = (rowId, cellIndex, value) => {
    const newTable = {
      ...table,
      rows: table.rows.map(row => 
        row.id === rowId 
          ? { ...row, cells: row.cells.map((cell, index) => 
              index === cellIndex ? value : cell
            )}
          : row
      )
    };
    updateTable(newTable);
  };

  const addRow = (afterRowId = null) => {
    const newRowId = `row_${Date.now()}`;
    const newRow = {
      id: newRowId,
      cells: new Array(table.columns).fill(''),
      isHeader: false
    };

    let newRows;
    if (afterRowId) {
      const index = table.rows.findIndex(row => row.id === afterRowId);
      newRows = [...table.rows];
      newRows.splice(index + 1, 0, newRow);
    } else {
      newRows = [...table.rows, newRow];
    }

    updateTable({ ...table, rows: newRows });
  };

  const addColumn = () => {
    const newTable = {
      ...table,
      columns: table.columns + 1,
      rows: table.rows.map(row => ({
        ...row,
        cells: [...row.cells, '']
      }))
    };
    updateTable(newTable);
  };

  const deleteRow = (rowId) => {
    if (table.rows.length <= 1) return; // Keep at least one row
    
    const newTable = {
      ...table,
      rows: table.rows.filter(row => row.id !== rowId)
    };
    updateTable(newTable);
  };

  const deleteColumn = (columnIndex) => {
    if (table.columns <= 1) return; // Keep at least one column
    
    const newTable = {
      ...table,
      columns: table.columns - 1,
      rows: table.rows.map(row => ({
        ...row,
        cells: row.cells.filter((_, index) => index !== columnIndex)
      }))
    };
    updateTable(newTable);
  };

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600">
        <TableIcon className="h-4 w-4" />
        <span>Table</span>
      </div>

      {/* Table Container */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full border-collapse">
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={row.id} className="group hover:bg-gray-50">
                {/* Row Handle */}
                {canEdit && (
                  <td className="w-8 p-1 border-r border-gray-200 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col items-center space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <GripVerticalIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-gray-400 hover:text-red-600"
                        onClick={() => deleteRow(row.id)}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                )}
                
                {/* Table Cells */}
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`border-r border-b border-gray-200 p-0 relative ${
                      row.isHeader ? 'bg-gray-50 font-semibold' : ''
                    }`}
                  >
                    {canEdit ? (
                      <Input
                        value={cell}
                        onChange={(e) => updateCell(row.id, cellIndex, e.target.value)}
                        onFocus={() => setSelectedCell({ rowId: row.id, cellIndex })}
                        onBlur={() => setSelectedCell(null)}
                        className={`border-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          row.isHeader ? 'font-semibold bg-gray-50' : 'bg-white'
                        }`}
                        placeholder={row.isHeader ? 'Column name' : 'Empty'}
                      />
                    ) : (
                      <div className={`p-2 min-h-[40px] ${row.isHeader ? 'font-semibold' : ''}`}>
                        {cell || (row.isHeader ? 'Column' : '')}
                      </div>
                    )}
                    
                    {/* Column delete button */}
                    {canEdit && rowIndex === 0 && (
                      <div className="absolute -top-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-gray-400 hover:text-red-600"
                          onClick={() => deleteColumn(cellIndex)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </td>
                ))}
                
                {/* Add Column Button */}
                {canEdit && rowIndex === 0 && (
                  <td className="w-8 p-1 border-b border-gray-200 bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                      onClick={addColumn}
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            
            {/* Add Row Button */}
            {canEdit && (
              <tr className="hover:bg-gray-50">
                <td className="w-8 p-1 border-r border-gray-200 bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => addRow()}
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </td>
                <td 
                  className="p-2 border-r border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-100"
                  colSpan={table.columns}
                  onClick={() => addRow()}
                >
                  Add row
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableBlock;