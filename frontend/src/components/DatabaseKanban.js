import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlusIcon, MoreHorizontalIcon } from 'lucide-react';

const DatabaseKanban = ({ database, rows, onUpdateRow, onAddRow, groupBy = 'status' }) => {
  const groupProperty = database.properties[groupBy];
  
  if (!groupProperty || groupProperty.type !== 'select') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Kanban view requires a select property for grouping</p>
      </div>
    );
  }

  const columns = groupProperty.options || [];
  const ungroupedRows = rows.filter(row => !row.properties[groupBy]);

  const getRowsForColumn = (columnId) => {
    return rows.filter(row => row.properties[groupBy] === columnId);
  };

  const handleMoveCard = (rowId, newColumnId) => {
    onUpdateRow(rowId, { [groupBy]: newColumnId });
  };

  const renderCard = (row) => {
    const titleProperty = Object.values(database.properties).find(p => p.type === 'title');
    const title = titleProperty ? row.properties[titleProperty.id] : 'Untitled';

    return (
      <Card key={row.id} className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm">{title}</h4>
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100">
              <MoreHorizontalIcon className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(row.properties).map(([propertyId, value]) => {
              const property = database.properties[propertyId];
              if (!property || property.type === 'title' || propertyId === groupBy) return null;

              switch (property.type) {
                case 'select':
                  const option = property.options?.find(opt => opt.id === value);
                  return option ? (
                    <Badge key={propertyId} variant="secondary" className={`bg-${option.color}-100 text-${option.color}-800 text-xs`}>
                      {option.name}
                    </Badge>
                  ) : null;
                case 'person':
                  return value ? (
                    <div key={propertyId} className="flex items-center space-x-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                        <AvatarFallback className="text-xs">U</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">Assigned</span>
                    </div>
                  ) : null;
                case 'date':
                  return value ? (
                    <div key={propertyId} className="text-xs text-gray-600">
                      {new Date(value).toLocaleDateString()}
                    </div>
                  ) : null;
                case 'number':
                  return value ? (
                    <div key={propertyId} className="text-xs text-gray-600">
                      {value}{property.format === 'percent' && '%'}
                    </div>
                  ) : null;
                default:
                  return null;
              }
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full p-6">
      <div className="flex space-x-6 h-full overflow-x-auto">
        {columns.map((column) => {
          const columnRows = getRowsForColumn(column.id);
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-${column.color}-500`} />
                    <h3 className="font-medium">{column.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnRows.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontalIcon className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-3 mb-4">
                  {columnRows.map(renderCard)}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    onAddRow();
                    // After adding, move to this column
                    setTimeout(() => {
                      const lastRow = rows[rows.length - 1];
                      if (lastRow) {
                        handleMoveCard(lastRow.id, column.id);
                      }
                    }, 100);
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add a card
                </Button>
              </div>
            </div>
          );
        })}

        {/* Ungrouped items */}
        {ungroupedRows.length > 0 && (
          <div className="flex-shrink-0 w-80">
            <div className="bg-gray-50 rounded-lg p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <h3 className="font-medium">No {groupProperty.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {ungroupedRows.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontalIcon className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {ungroupedRows.map(renderCard)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseKanban;