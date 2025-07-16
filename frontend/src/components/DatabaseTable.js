import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  PlusIcon, 
  MoreHorizontalIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  CalendarIcon,
  UserIcon,
  HashIcon,
  TypeIcon,
  CheckSquareIcon,
  TagIcon
} from 'lucide-react';

const DatabaseTable = ({ database, rows, onUpdateRow, onAddRow, onUpdateProperty }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const handleCellEdit = (rowId, propertyId, currentValue) => {
    setEditingCell({ rowId, propertyId });
    setEditingValue(currentValue || '');
  };

  const handleCellSave = () => {
    if (editingCell) {
      onUpdateRow(editingCell.rowId, { [editingCell.propertyId]: editingValue });
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const renderCell = (row, property) => {
    const value = row.properties[property.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.propertyId === property.id;

    if (isEditing) {
      switch (property.type) {
        case 'select':
          return (
            <Select value={editingValue} onValueChange={(val) => {
              setEditingValue(val);
              onUpdateRow(row.id, { [property.id]: val });
              setEditingCell(null);
            }}>
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {property.options?.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-${option.color}-500`} />
                      <span>{option.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'date':
          return (
            <Input
              type="date"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyDown={handleKeyDown}
              className="w-full h-8"
              autoFocus
            />
          );
        case 'number':
          return (
            <Input
              type="number"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyDown={handleKeyDown}
              className="w-full h-8"
              autoFocus
            />
          );
        default:
          return (
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyDown={handleKeyDown}
              className="w-full h-8"
              autoFocus
            />
          );
      }
    }

    // Display mode
    switch (property.type) {
      case 'title':
        return (
          <div 
            className="font-medium cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleCellEdit(row.id, property.id, value)}
          >
            {value || 'Untitled'}
          </div>
        );
      case 'select':
        const option = property.options?.find(opt => opt.id === value);
        return option ? (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleCellEdit(row.id, property.id, value)}
          >
            <Badge variant="secondary" className={`bg-${option.color}-100 text-${option.color}-800`}>
              {option.name}
            </Badge>
          </div>
        ) : (
          <div 
            className="text-gray-400 cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleCellEdit(row.id, property.id, value)}
          >
            Empty
          </div>
        );
      case 'number':
        return (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleCellEdit(row.id, property.id, value)}
          >
            {value || 0}
            {property.format === 'percent' && '%'}
          </div>
        );
      case 'date':
        return (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleCellEdit(row.id, property.id, value)}
          >
            {value ? new Date(value).toLocaleDateString() : 'Empty'}
          </div>
        );
      case 'person':
        return (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleCellEdit(row.id, property.id, value)}
          >
            {value ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
                <span className="text-sm">User</span>
              </div>
            ) : (
              <span className="text-gray-400">Empty</span>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={value || false}
              onCheckedChange={(checked) => onUpdateRow(row.id, { [property.id]: checked })}
            />
          </div>
        );
      case 'formula':
        return (
          <div className="text-gray-600 font-mono text-sm">
            {value}
          </div>
        );
      default:
        return (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleCellEdit(row.id, property.id, value)}
          >
            {value || 'Empty'}
          </div>
        );
    }
  };

  const getPropertyIcon = (type) => {
    const icons = {
      title: TypeIcon,
      select: TagIcon,
      number: HashIcon,
      date: CalendarIcon,
      person: UserIcon,
      checkbox: CheckSquareIcon,
      formula: HashIcon
    };
    return icons[type] || TypeIcon;
  };

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-full">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="w-8 p-2 border-r border-gray-200">
                <Checkbox />
              </th>
              {Object.values(database.properties).map((property) => {
                const Icon = getPropertyIcon(property.type);
                return (
                  <th
                    key={property.id}
                    className="min-w-[150px] p-2 text-left border-r border-gray-200 font-medium text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span>{property.name}</span>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100">
                        <MoreHorizontalIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                );
              })}
              <th className="w-8 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => console.log('Add property')}
                >
                  <PlusIcon className="h-3 w-3" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="p-2 border-r border-gray-200">
                  <Checkbox />
                </td>
                {Object.values(database.properties).map((property) => (
                  <td
                    key={property.id}
                    className="p-2 border-r border-gray-200 align-top"
                  >
                    {renderCell(row, property)}
                  </td>
                ))}
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontalIcon className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
            {/* Add Row */}
            <tr className="hover:bg-gray-50">
              <td className="p-2 border-r border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onAddRow}
                >
                  <PlusIcon className="h-3 w-3" />
                </Button>
              </td>
              <td
                className="p-2 border-r border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-100"
                onClick={onAddRow}
              >
                New
              </td>
              {Object.values(database.properties).slice(1).map((property) => (
                <td
                  key={property.id}
                  className="p-2 border-r border-gray-200"
                />
              ))}
              <td className="p-2" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DatabaseTable;